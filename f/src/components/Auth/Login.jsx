import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FaEnvelope, FaLock } from 'react-icons/fa';
import './Auth.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const success = await login(email, password);
        setLoading(false);
        if (success) {
            navigate('/');
        }
    };
    
    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <h1>🎓 CampusConnect</h1>
                    <p>Welcome back! Please login to your account</p>
                </div>
                
                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <FaEnvelope className="input-icon" />
                        <input
                            type="email"
                            placeholder="Email Address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    
                    <div className="input-group">
                        <FaLock className="input-icon" />
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    
                    <button type="submit" disabled={loading} className="auth-btn">
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>
                
                <p className="auth-footer">
                    Don't have an account? <Link to="/register">Register here</Link>
                </p>
                
                <div className="demo-credentials">
                    <p>Demo Credentials:</p>
                    <p>Student: student@test.com / 123456</p>
                    <p>Admin: admin@campusconnect.com / Admin@2026</p>
                </div>
            </div>
        </div>
    );
};

export default Login;