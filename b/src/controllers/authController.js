const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');
const { generateToken } = require('../config/jwt');

const register = async (req, res, next) => {
    try {
        const { name, email, password, student_id, course, role = 'student' } = req.body;
        
        // Check if user exists
        const [existing] = await pool.query(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );
        
        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email'
            });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Insert user
        const [result] = await pool.query(
            `INSERT INTO users (name, email, password_hash, role, student_id, course) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [name, email, hashedPassword, role, student_id || null, course || null]
        );
        
        // Generate token
        const token = generateToken(result.insertId, email, role);
        
        // Log activity
        await pool.query(
            `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, ip_address) 
             VALUES (?, ?, ?, ?, ?)`,
            [result.insertId, 'REGISTER', 'user', result.insertId, req.ip]
        );
        
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                userId: result.insertId,
                name,
                email,
                role,
                token
            }
        });
    } catch (error) {
        next(error);
    }
};

const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        
        // Get user
        const [users] = await pool.query(
            `SELECT id, name, email, password_hash, role 
             FROM users 
             WHERE email = ? AND is_active = TRUE`,
            [email]
        );
        
        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }
        
        const user = users[0];
        
        // Verify password
        const isValid = await bcrypt.compare(password, user.password_hash);
        
        if (!isValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }
        
        // Update last login
        await pool.query(
            'UPDATE users SET last_login = NOW() WHERE id = ?',
            [user.id]
        );
        
        // Generate token
        const token = generateToken(user.id, user.email, user.role);
        
        // Log activity
        await pool.query(
            `INSERT INTO activity_logs (user_id, action, ip_address) 
             VALUES (?, ?, ?)`,
            [user.id, 'LOGIN', req.ip]
        );
        
        res.json({
            success: true,
            message: 'Login successful',
            data: {
                userId: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                token
            }
        });
    } catch (error) {
        next(error);
    }
};

const getProfile = async (req, res, next) => {
    try {
        const [users] = await pool.query(
            `SELECT id, name, email, role, student_id, course, profile_image_url, 
                    created_at, last_login
             FROM users 
             WHERE id = ?`,
            [req.user.userId]
        );
        
        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        res.json({
            success: true,
            data: users[0]
        });
    } catch (error) {
        next(error);
    }
};

const updateProfile = async (req, res, next) => {
    try {
        const { name, student_id, course, profile_image_url } = req.body;
        
        await pool.query(
            `UPDATE users 
             SET name = ?, student_id = ?, course = ?, profile_image_url = ?
             WHERE id = ?`,
            [name, student_id, course, profile_image_url, req.user.userId]
        );
        
        res.json({
            success: true,
            message: 'Profile updated successfully'
        });
    } catch (error) {
        next(error);
    }
};

const changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        const [users] = await pool.query(
            'SELECT password_hash FROM users WHERE id = ?',
            [req.user.userId]
        );
        
        const isValid = await bcrypt.compare(currentPassword, users[0].password_hash);
        
        if (!isValid) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }
        
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        await pool.query(
            'UPDATE users SET password_hash = ? WHERE id = ?',
            [hashedPassword, req.user.userId]
        );
        
        res.json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    register,
    login,
    getProfile,
    updateProfile,
    changePassword
};