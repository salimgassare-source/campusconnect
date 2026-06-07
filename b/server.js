const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Database connection
const db = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'campusconnect',
    waitForConnections: true,
    connectionLimit: 10
}).promise();

// ============ AUTHENTICATION MIDDLEWARE ============
const authenticate = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey123');
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
};

// ============ HEALTH CHECK ============
app.get('/health', async (req, res) => {
    try {
        await db.query('SELECT 1');
        res.json({ status: 'OK', message: 'Server running', database: 'connected' });
    } catch (error) {
        res.json({ status: 'OK', message: 'Server running', database: 'disconnected' });
    }
});

// ============ AUTHENTICATION ENDPOINTS ============
app.post('/api/v1/auth/register', async (req, res) => {
    try {
        const { name, email, password, student_id, course, role = 'student' } = req.body;
        
        const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await db.query(
            'INSERT INTO users (name, email, password_hash, role, student_id, course) VALUES (?, ?, ?, ?, ?, ?)',
            [name, email, hashedPassword, role, student_id, course]
        );
        
        const token = jwt.sign(
            { userId: result.insertId, email, role },
            process.env.JWT_SECRET || 'secretkey123',
            { expiresIn: '7d' }
        );
        
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: { userId: result.insertId, name, email, role, token }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/api/v1/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const [users] = await db.query('SELECT id, name, email, password_hash, role FROM users WHERE email = ?', [email]);
        
        if (users.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        
        const user = users[0];
        const isValid = await bcrypt.compare(password, user.password_hash);
        
        if (!isValid) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        
        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'secretkey123',
            { expiresIn: '7d' }
        );
        
        res.json({
            success: true,
            message: 'Login successful',
            data: { userId: user.id, name: user.name, email: user.email, role: user.role, token }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============ EVENT ENDPOINTS ============
app.get('/api/v1/events', async (req, res) => {
    try {
        const [events] = await db.query('SELECT * FROM events WHERE status = "published" ORDER BY start_time DESC');
        res.json({ success: true, data: events });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get('/api/v1/events/:id', async (req, res) => {
    try {
        const [events] = await db.query('SELECT * FROM events WHERE id = ?', [req.params.id]);
        if (events.length === 0) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }
        res.json({ success: true, data: events[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/api/v1/events', authenticate, async (req, res) => {
    try {
        const { title, description, start_time, end_time, venue, capacity, category } = req.body;
        
        const [result] = await db.query(
            'INSERT INTO events (title, description, start_time, end_time, venue, capacity, category, created_by, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [title, description, start_time, end_time, venue, capacity || 100, category, req.user.userId, 'published']
        );
        
        res.status(201).json({ success: true, message: 'Event created', data: { id: result.insertId } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============ EVENT REGISTRATION ENDPOINTS (FIXED) ============
app.post('/api/v1/events/:id/register', authenticate, async (req, res) => {
    try {
        const eventId = req.params.id;
        const userId = req.user.userId;
        
        console.log(`Attempting to register user ${userId} for event ${eventId}`);
        
        // Check if user exists
        const [userCheck] = await db.query('SELECT id FROM users WHERE id = ?', [userId]);
        if (userCheck.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        // Check if event exists
        const [event] = await db.query('SELECT id, capacity, current_registrations FROM events WHERE id = ?', [eventId]);
        if (event.length === 0) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }
        
        // Check if already registered
        const [registered] = await db.query(
            'SELECT id FROM event_registrations WHERE user_id = ? AND event_id = ?', 
            [userId, eventId]
        );
        if (registered.length > 0) {
            return res.status(400).json({ success: false, message: 'Already registered' });
        }
        
        // Check capacity
        if (event[0].current_registrations >= event[0].capacity) {
            return res.status(400).json({ success: false, message: 'Event is full' });
        }
        
        // Insert registration
        await db.query(
            'INSERT INTO event_registrations (user_id, event_id) VALUES (?, ?)', 
            [userId, eventId]
        );
        
        // Update event count
        await db.query(
            'UPDATE events SET current_registrations = current_registrations + 1 WHERE id = ?', 
            [eventId]
        );
        
        console.log(`User ${userId} successfully registered for event ${eventId}`);
        res.json({ success: true, message: 'Registered successfully' });
        
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

app.delete('/api/v1/events/:id/register', authenticate, async (req, res) => {
    try {
        const eventId = req.params.id;
        const userId = req.user.userId;
        
        const [registered] = await db.query('SELECT id FROM event_registrations WHERE user_id = ? AND event_id = ?', [userId, eventId]);
        if (registered.length === 0) {
            return res.status(400).json({ success: false, message: 'Not registered for this event' });
        }
        
        await db.query('DELETE FROM event_registrations WHERE user_id = ? AND event_id = ?', [userId, eventId]);
        await db.query('UPDATE events SET current_registrations = current_registrations - 1 WHERE id = ?', [eventId]);
        
        res.json({ success: true, message: 'Registration cancelled successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get('/api/v1/users/events', authenticate, async (req, res) => {
    try {
        const [events] = await db.query(`
            SELECT e.*, er.registration_date 
            FROM events e
            JOIN event_registrations er ON e.id = er.event_id
            WHERE er.user_id = ?
            ORDER BY e.start_time DESC
        `, [req.user.userId]);
        res.json({ success: true, data: events });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============ RESOURCE BOOKING ENDPOINTS ============
app.get('/api/v1/resources', authenticate, async (req, res) => {
    try {
        const [resources] = await db.query('SELECT * FROM resources ORDER BY type, name');
        res.json({ success: true, data: resources });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get('/api/v1/resources/:id', authenticate, async (req, res) => {
    try {
        const [resources] = await db.query('SELECT * FROM resources WHERE id = ?', [req.params.id]);
        if (resources.length === 0) {
            return res.status(404).json({ success: false, message: 'Resource not found' });
        }
        res.json({ success: true, data: resources[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/api/v1/bookings', authenticate, async (req, res) => {
    try {
        const { resource_id, booking_date, start_time, end_time, purpose } = req.body;
        
        // Check for conflicts
        const [conflicts] = await db.query(
            `SELECT * FROM bookings 
             WHERE resource_id = ? AND booking_date = ? AND status IN ('pending', 'approved')
             AND ((start_time <= ? AND end_time > ?) OR (start_time < ? AND end_time >= ?))`,
            [resource_id, booking_date, start_time, start_time, end_time, end_time]
        );
        
        if (conflicts.length > 0) {
            return res.status(409).json({ success: false, message: 'Resource already booked for this time' });
        }
        
        const [result] = await db.query(
            `INSERT INTO bookings (user_id, resource_id, booking_date, start_time, end_time, purpose) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [req.user.userId, resource_id, booking_date, start_time, end_time, purpose]
        );
        
        res.status(201).json({ success: true, message: 'Booking created', data: { id: result.insertId } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get('/api/v1/users/bookings', authenticate, async (req, res) => {
    try {
        const [bookings] = await db.query(`
            SELECT b.*, r.name as resource_name, r.type as resource_type, r.location 
            FROM bookings b
            JOIN resources r ON b.resource_id = r.id
            WHERE b.user_id = ?
            ORDER BY b.booking_date DESC, b.start_time
        `, [req.user.userId]);
        res.json({ success: true, data: bookings });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.delete('/api/v1/bookings/:id', authenticate, async (req, res) => {
    try {
        const [booking] = await db.query('SELECT user_id, status FROM bookings WHERE id = ?', [req.params.id]);
        if (booking.length === 0) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }
        
        if (booking[0].user_id !== req.user.userId && req.user.role !== 'university_admin') {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }
        
        await db.query('UPDATE bookings SET status = "cancelled" WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'Booking cancelled' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============ ADMIN DASHBOARD ============
app.get('/api/v1/admin/stats', authenticate, async (req, res) => {
    try {
        if (req.user.role !== 'university_admin') {
            return res.status(403).json({ success: false, message: 'Admin access required' });
        }
        
        const [totalEvents] = await db.query('SELECT COUNT(*) as count FROM events');
        const [totalUsers] = await db.query('SELECT COUNT(*) as count FROM users');
        const [totalRegistrations] = await db.query('SELECT COUNT(*) as count FROM event_registrations');
        const [popularEvents] = await db.query(`
            SELECT e.title, e.capacity, COUNT(er.id) as registrations
            FROM events e
            LEFT JOIN event_registrations er ON e.id = er.event_id
            GROUP BY e.id
            ORDER BY registrations DESC
            LIMIT 5
        `);
        
        res.json({
            success: true,
            data: {
                totalEvents: totalEvents[0].count,
                totalUsers: totalUsers[0].count,
                totalRegistrations: totalRegistrations[0].count,
                popularEvents
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============ ERROR HANDLER ============
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ success: false, message: err.message });
});

// ============ START SERVER ============
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`✅ Health check: http://localhost:${PORT}/health`);
    console.log(`📝 API: http://localhost:${PORT}/api/v1\n`);
});