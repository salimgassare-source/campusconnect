import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FaHome, FaCalendar, FaBox, FaUsers, FaChartBar, FaUser, FaSignOutAlt } from 'react-icons/fa';
import './Navbar.css';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    
    const handleLogout = () => {
        logout();
        navigate('/login');
    };
    
    return (
        <nav className="navbar">
            <div className="nav-brand">
                <Link to="/">🎓 CampusConnect</Link>
            </div>
            
            <div className="nav-links">
                <Link to="/">
                    <FaHome /> Home
                </Link>
                <Link to="/events">
                    <FaCalendar /> Events
                </Link>
                <Link to="/resources">
                    <FaBox /> Resources
                </Link>
                <Link to="/clubs">
                    <FaUsers /> Clubs
                </Link>
                <Link to="/dashboard">
                    <FaChartBar /> Dashboard
                </Link>
                <Link to="/profile">
                    <FaUser /> Profile
                </Link>
                <button onClick={handleLogout} className="logout-link">
                    <FaSignOutAlt /> Logout
                </button>
            </div>
            
            <div className="nav-user">
                <span>{user?.name}</span>
                <small>({user?.role})</small>
            </div>
        </nav>
    );
};

export default Navbar;