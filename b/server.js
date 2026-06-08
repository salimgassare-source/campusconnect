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
    host: 'acela.proxy.rlwy.net',
    port: 21461,
    user: 'root',
    password: 'KCtROLyyShBxhBuYFHzOlARhFhLHpsGC',
    database: 'railway',
    waitForConnections: true,
    connectionLimit: 10
}).promise();

// Test database connection
(async function testDb() {
    try {
        const [result] = await db.query('SELECT 1');
        console.log('✅ Database connected');
    } catch (err) {
        console.error('❌ Database error:', err.message);
    }
})();

// ============ HEALTH CHECK ============
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server running', database: 'connected' });
});

// ============ REGISTER ROUTE ============
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
            'secretkey123',
            { expiresIn: '7d' }
        );
        
        res.json({ success: true, message: 'Registration successful', data: { userId: result.insertId, name, email, role, token } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============ LOGIN ROUTE ============
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
            'secretkey123',
            { expiresIn: '7d' }
        );
        
        res.json({ success: true, message: 'Login successful', data: { userId: user.id, name: user.name, email: user.email, role: user.role, token } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============ EVENTS ROUTE ============
app.get('/api/v1/events', async (req, res) => {
    try {
        const [events] = await db.query('SELECT * FROM events ORDER BY start_time DESC');
        res.json({ success: true, data: events });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============ START SERVER ============
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
});