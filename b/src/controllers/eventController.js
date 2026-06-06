const { pool } = require('../config/database');

const getEvents = async (req, res, next) => {
    try {
        const { category, club, startDate, endDate, search } = req.query;
        let query = `SELECT e.*, c.name as club_name, u.name as organizer_name
                     FROM events e
                     LEFT JOIN clubs c ON e.club_id = c.id
                     LEFT JOIN users u ON e.created_by = u.id
                     WHERE e.status = 'published' AND e.deleted_at IS NULL`;
        const params = [];
        
        if (category) {
            query += ' AND e.category = ?';
            params.push(category);
        }
        
        if (club) {
            query += ' AND e.club_id = ?';
            params.push(club);
        }
        
        if (startDate) {
            query += ' AND e.start_time >= ?';
            params.push(startDate);
        }
        
        if (endDate) {
            query += ' AND e.end_time <= ?';
            params.push(endDate);
        }
        
        if (search) {
            query += ' AND (e.title LIKE ? OR e.description LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }
        
        query += ' ORDER BY e.start_time ASC';
        
        const [events] = await pool.query(query, params);
        
        res.json({
            success: true,
            data: events,
            count: events.length
        });
    } catch (error) {
        next(error);
    }
};

const getEventById = async (req, res, next) => {
    try {
        const [events] = await pool.query(
            `SELECT e.*, c.name as club_name, u.name as organizer_name
             FROM events e
             LEFT JOIN clubs c ON e.club_id = c.id
             LEFT JOIN users u ON e.created_by = u.id
             WHERE e.id = ? AND e.deleted_at IS NULL`,
            [req.params.id]
        );
        
        if (events.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }
        
        res.json({
            success: true,
            data: events[0]
        });
    } catch (error) {
        next(error);
    }
};

const createEvent = async (req, res, next) => {
    try {
        const {
            title, description, start_time, end_time,
            venue, capacity, club_id, category, image_url
        } = req.body;
        
        const [result] = await pool.query(
            `INSERT INTO events 
             (title, description, start_time, end_time, venue, capacity, 
              club_id, category, image_url, created_by, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [title, description, start_time, end_time, venue, capacity || 100,
             club_id || null, category, image_url || null, req.user.userId, 'published']
        );
        
        // Log activity
        await pool.query(
            `INSERT INTO activity_logs (user_id, action, entity_type, entity_id) 
             VALUES (?, ?, ?, ?)`,
            [req.user.userId, 'CREATE_EVENT', 'event', result.insertId]
        );
        
        res.status(201).json({
            success: true,
            message: 'Event created successfully',
            data: { id: result.insertId }
        });
    } catch (error) {
        next(error);
    }
};

const updateEvent = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        
        // Check if event exists and user has permission
        const [events] = await pool.query(
            'SELECT created_by, club_id FROM events WHERE id = ?',
            [id]
        );
        
        if (events.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }
        
        const event = events[0];
        const isAdmin = req.user.role === 'university_admin';
        const isCreator = event.created_by === req.user.userId;
        
        if (!isAdmin && !isCreator) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to update this event'
            });
        }
        
        const allowedFields = ['title', 'description', 'start_time', 'end_time', 
                               'venue', 'capacity', 'category', 'image_url', 'status'];
        const setClause = [];
        const values = [];
        
        for (const field of allowedFields) {
            if (updates[field] !== undefined) {
                setClause.push(`${field} = ?`);
                values.push(updates[field]);
            }
        }
        
        if (setClause.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid fields to update'
            });
        }
        
        values.push(id);
        await pool.query(
            `UPDATE events SET ${setClause.join(', ')} WHERE id = ?`,
            values
        );
        
        res.json({
            success: true,
            message: 'Event updated successfully'
        });
    } catch (error) {
        next(error);
    }
};

const deleteEvent = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        const [events] = await pool.query(
            'SELECT created_by FROM events WHERE id = ?',
            [id]
        );
        
        if (events.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }
        
        const isAdmin = req.user.role === 'university_admin';
        const isCreator = events[0].created_by === req.user.userId;
        
        if (!isAdmin && !isCreator) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to delete this event'
            });
        }
        
        // Soft delete
        await pool.query(
            'UPDATE events SET deleted_at = NOW(), status = "cancelled" WHERE id = ?',
            [id]
        );
        
        res.json({
            success: true,
            message: 'Event deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

const registerForEvent = async (req, res, next) => {
    try {
        const eventId = req.params.id;
        const userId = req.user.userId;
        
        // Check if event exists and is published
        const [events] = await pool.query(
            'SELECT capacity, current_registrations, status FROM events WHERE id = ?',
            [eventId]
        );
        
        if (events.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }
        
        const event = events[0];
        
        if (event.status !== 'published') {
            return res.status(400).json({
                success: false,
                message: 'Event is not available for registration'
            });
        }
        
        if (event.current_registrations >= event.capacity) {
            return res.status(400).json({
                success: false,
                message: 'Event is full'
            });
        }
        
        // Check if already registered
        const [registered] = await pool.query(
            'SELECT id FROM event_registrations WHERE user_id = ? AND event_id = ?',
            [userId, eventId]
        );
        
        if (registered.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Already registered for this event'
            });
        }
        
        // Register user
        await pool.query(
            'INSERT INTO event_registrations (user_id, event_id) VALUES (?, ?)',
            [userId, eventId]
        );
        
        await pool.query(
            'UPDATE events SET current_registrations = current_registrations + 1 WHERE id = ?',
            [eventId]
        );
        
        res.json({
            success: true,
            message: 'Successfully registered for event'
        });
    } catch (error) {
        next(error);
    }
};

const cancelRegistration = async (req, res, next) => {
    try {
        const eventId = req.params.id;
        const userId = req.user.userId;
        
        const [registered] = await pool.query(
            'SELECT id FROM event_registrations WHERE user_id = ? AND event_id = ?',
            [userId, eventId]
        );
        
        if (registered.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'You are not registered for this event'
            });
        }
        
        await pool.query(
            'DELETE FROM event_registrations WHERE user_id = ? AND event_id = ?',
            [userId, eventId]
        );
        
        await pool.query(
            'UPDATE events SET current_registrations = current_registrations - 1 WHERE id = ?',
            [eventId]
        );
        
        res.json({
            success: true,
            message: 'Registration cancelled successfully'
        });
    } catch (error) {
        next(error);
    }
};

const getUserEvents = async (req, res, next) => {
    try {
        const [events] = await pool.query(
            `SELECT e.*, c.name as club_name
             FROM events e
             JOIN event_registrations er ON e.id = er.event_id
             LEFT JOIN clubs c ON e.club_id = c.id
             WHERE er.user_id = ? AND e.deleted_at IS NULL
             ORDER BY e.start_time DESC`,
            [req.user.userId]
        );
        
        res.json({
            success: true,
            data: events
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getEvents,
    getEventById,
    createEvent,
    updateEvent,
    deleteEvent,
    registerForEvent,
    cancelRegistration,
    getUserEvents
};