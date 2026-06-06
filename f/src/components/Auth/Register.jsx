import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FaUser, FaEnvelope, FaLock, FaIdCard, FaGraduationCap } from 'react-icons/fa';
import './Auth.css';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        student_id: '',
        course: '',
        role: 'student'
    });
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();
    
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (formData.password !== formData.confirmPassword) {
            alert('Passwords do not match');
            return;
        }
        
        setLoading(true);
        const success = await register({
            name: formData.name,
            email: formData.email,
            password: formData.password,
            student_id: formData.student_id,
            course: formData.course,
            role: formData.role
        });
        setLoading(false);
        
        if (success) {
            navigate('/login');
        }
    };
    
    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <h1>🎓 CampusConnect</h1>
                    <p>Create your account</p>
                </div>
                
                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <FaUser className="input-icon" />
                        <input
                            type="text"
                            name="name"
                            placeholder="Full Name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    
                    <div className="input-group">
                        <FaEnvelope className="input-icon" />
                        <input
                            type="email"
                            name="email"
                            placeholder="Email Address"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    
                    <div className="input-group">
                        <FaLock className="input-icon" />
                        <input
                            type="password"
                            name="password"
                            placeholder="Password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    
                    <div className="input-group">
                        <FaLock className="input-icon" />
                        <input
                            type="password"
                            name="confirmPassword"
                            placeholder="Confirm Password"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    
                    <div className="input-group">
                        <FaIdCard className="input-icon" />
                        <input
                            type="text"
                            name="student_id"
                            placeholder="Student ID"
                            value={formData.student_id}
                            onChange={handleChange}
                        />
                    </div>
                    
                    <div className="input-group">
                        <FaGraduationCap className="input-icon" />
                        <input
                            type="text"
                            name="course"
                            placeholder="Course"
                            value={formData.course}
                            onChange={handleChange}
                        />
                    </div>
                    
                    <div className="input-group">
                        <select name="role" value={formData.role} onChange={handleChange}>
                            <option value="student">Student</option>
                            <option value="club_admin">Club Admin</option>
                        </select>
                    </div>
                    
                    <button type="submit" disabled={loading} className="auth-btn">
                        {loading ? 'Registering...' : 'Register'}
                    </button>
                </form>
                
                <p className="auth-footer">
                    Already have an account? <Link to="/login">Login here</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;