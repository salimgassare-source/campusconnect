import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
    const [isLogin, setIsLogin] = useState(true);
    const [user, setUser] = useState(null);
    const [events, setEvents] = useState([]);
    const [myEvents, setMyEvents] = useState([]);
    const [resources, setResources] = useState([]);
    const [myBookings, setMyBookings] = useState([]);
    const [activeTab, setActiveTab] = useState('events');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [studentId, setStudentId] = useState('');
    const [course, setCourse] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [allUsers, setAllUsers] = useState([]);
    const [makeAdminEmail, setMakeAdminEmail] = useState('');
    
    // Create event form state
    const [newEvent, setNewEvent] = useState({
        title: '',
        description: '',
        start_time: '',
        end_time: '',
        venue: '',
        capacity: 100,
        category: ''
    });
    
    // Resource booking state
    const [selectedResource, setSelectedResource] = useState(null);
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [bookingForm, setBookingForm] = useState({
        booking_date: '',
        start_time: '',
        end_time: '',
        purpose: ''
    });

    // Dashboard stats
    const [dashboardStats, setDashboardStats] = useState({
        totalEvents: 0,
        totalUsers: 0,
        totalRegistrations: 0,
        popularEvents: [],
        users: []
    });

    const API_URL = 'https://campusconnect-1-867z.onrender.com/api/v1';

    useEffect(() => {
        const token = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');
        if (token && savedUser) {
            const userData = JSON.parse(savedUser);
            setUser(userData);
            fetchEvents(token);
            fetchMyEvents(token);
            fetchResources(token);
            fetchMyBookings(token);
            if (userData.role === 'university_admin') {
                fetchDashboardStats(token);
                fetchAllUsers(token);
            }
        }
    }, []);

    const fetchEvents = async (token) => {
        try {
            const response = await fetch(`${API_URL}/events`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) setEvents(data.data);
        } catch (error) {
            console.error('Error fetching events:', error);
        }
    };

    const fetchMyEvents = async (token) => {
        try {
            const response = await fetch(`${API_URL}/users/events`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) setMyEvents(data.data);
        } catch (error) {
            console.error('Error fetching my events:', error);
        }
    };

    const fetchResources = async (token) => {
        try {
            const response = await fetch(`${API_URL}/resources`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) setResources(data.data);
        } catch (error) {
            console.error('Error fetching resources:', error);
        }
    };

    const fetchMyBookings = async (token) => {
        try {
            const response = await fetch(`${API_URL}/users/bookings`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) setMyBookings(data.data);
        } catch (error) {
            console.error('Error fetching bookings:', error);
        }
    };

    const fetchDashboardStats = async (token) => {
        try {
            const response = await fetch(`${API_URL}/admin/stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) setDashboardStats(prev => ({ ...prev, ...data.data }));
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const fetchAllUsers = async (token) => {
        try {
            const response = await fetch(`${API_URL}/admin/users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) setDashboardStats(prev => ({ ...prev, users: data.data }));
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const handleMakeAdmin = async () => {
        if (!makeAdminEmail) {
            alert('Please enter an email address');
            return;
        }
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`${API_URL}/admin/make-admin`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ email: makeAdminEmail })
            });
            const data = await response.json();
            if (data.success) {
                alert(data.message);
                setMakeAdminEmail('');
                fetchAllUsers(token);
            } else {
                alert(data.message);
            }
        } catch (error) {
            alert('Failed to make admin');
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await response.json();
            if (data.success) {
                localStorage.setItem('token', data.data.token);
                localStorage.setItem('user', JSON.stringify(data.data));
                setUser(data.data);
                fetchEvents(data.data.token);
                fetchMyEvents(data.data.token);
                fetchResources(data.data.token);
                fetchMyBookings(data.data.token);
                if (data.data.role === 'university_admin') {
                    fetchDashboardStats(data.data.token);
                    fetchAllUsers(data.data.token);
                }
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Login failed. Please make sure the backend is running.');
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: name,
                    email: email,
                    password: password,
                    student_id: studentId,
                    course: course,
                    role: 'student'
                })
            });
            const data = await response.json();
            if (data.success) {
                alert('Registration successful! Please login.');
                setIsLogin(true);
                setName('');
                setEmail('');
                setPassword('');
                setStudentId('');
                setCourse('');
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Registration failed. Please try again.');
        }
    };

    const handleCreateEvent = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`${API_URL}/events`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newEvent)
            });
            const data = await response.json();
            if (data.success) {
                setSuccess('Event created successfully!');
                setNewEvent({
                    title: '',
                    description: '',
                    start_time: '',
                    end_time: '',
                    venue: '',
                    capacity: 100,
                    category: ''
                });
                fetchEvents(token);
                setActiveTab('events');
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Failed to create event');
        }
    };

    const registerForEvent = async (eventId) => {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`${API_URL}/events/${eventId}/register`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            const data = await response.json();
            if (data.success) {
                alert('Successfully registered for event!');
                fetchEvents(token);
                fetchMyEvents(token);
            } else {
                alert(data.message);
            }
        } catch (error) {
            alert('Registration failed');
        }
    };

    const cancelRegistration = async (eventId) => {
        if (!window.confirm('Are you sure you want to cancel your registration?')) return;
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`${API_URL}/events/${eventId}/register`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                alert('Registration cancelled successfully!');
                fetchEvents(token);
                fetchMyEvents(token);
            } else {
                alert(data.message);
            }
        } catch (error) {
            alert('Failed to cancel registration');
        }
    };

    const handleBookingSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`${API_URL}/bookings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    resource_id: selectedResource.id,
                    ...bookingForm
                })
            });
            const data = await response.json();
            if (data.success) {
                alert('Booking request submitted successfully!');
                setShowBookingModal(false);
                setBookingForm({ booking_date: '', start_time: '', end_time: '', purpose: '' });
                fetchMyBookings(token);
                fetchResources(token);
            } else {
                alert(data.message);
            }
        } catch (error) {
            alert('Booking failed');
        }
    };

    const cancelBooking = async (bookingId) => {
        if (!window.confirm('Are you sure you want to cancel this booking?')) return;
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`${API_URL}/bookings/${bookingId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                alert('Booking cancelled successfully!');
                fetchMyBookings(token);
                fetchResources(token);
            } else {
                alert(data.message);
            }
        } catch (error) {
            alert('Failed to cancel booking');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setEvents([]);
        setMyEvents([]);
        setResources([]);
        setMyBookings([]);
    };

    if (!user) {
        return (
            <div className="auth-container">
                <div className="auth-card">
                    <h1>🎓 CampusConnect</h1>
                    <p style={{ textAlign: 'center', marginBottom: '20px', color: '#666' }}>
                        University Event & Resource Management
                    </p>
                    
                    <div className="auth-tabs">
                        <button className={isLogin ? 'active' : ''} onClick={() => { setIsLogin(true); setError(''); }}>
                            Login
                        </button>
                        <button className={!isLogin ? 'active' : ''} onClick={() => { setIsLogin(false); setError(''); }}>
                            Register
                        </button>
                    </div>

                    {error && <div className="error">{error}</div>}

                    {isLogin ? (
                        <form onSubmit={handleLogin}>
                            <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required />
                            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                            <button type="submit">Login</button>
                        </form>
                    ) : (
                        <form onSubmit={handleRegister}>
                            <input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} required />
                            <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required />
                            <input type="password" placeholder="Password (min 6 characters)" value={password} onChange={(e) => setPassword(e.target.value)} required />
                            <input type="text" placeholder="Student ID" value={studentId} onChange={(e) => setStudentId(e.target.value)} required />
                            <input type="text" placeholder="Course" value={course} onChange={(e) => setCourse(e.target.value)} required />
                            <button type="submit">Register</button>
                        </form>
                    )}
                    
                    <div className="demo-info">
                        <p>Demo Credentials:</p>
                        <p>Admin: admin@campusconnect.com / Admin@2026</p>
                        <p>Or register as a new student</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <nav className="navbar">
                <div className="nav-brand">
                    <h1>🎓 CampusConnect</h1>
                </div>
                <div className="nav-tabs">
                    <button className={activeTab === 'events' ? 'active' : ''} onClick={() => setActiveTab('events')}>
                        📅 All Events
                    </button>
                    <button className={activeTab === 'myevents' ? 'active' : ''} onClick={() => setActiveTab('myevents')}>
                        🎯 My Events ({myEvents.length})
                    </button>
                    <button className={activeTab === 'resources' ? 'active' : ''} onClick={() => setActiveTab('resources')}>
                        🏢 Resources
                    </button>
                    <button className={activeTab === 'mybookings' ? 'active' : ''} onClick={() => setActiveTab('mybookings')}>
                        📋 My Bookings ({myBookings.length})
                    </button>
                    {(user.role === 'club_admin' || user.role === 'university_admin') && (
                        <button className={activeTab === 'create' ? 'active' : ''} onClick={() => setActiveTab('create')}>
                            ✨ Create Event
                        </button>
                    )}
                    {user.role === 'university_admin' && (
                        <button className={activeTab === 'dashboard' ? 'active' : ''} onClick={() => setActiveTab('dashboard')}>
                            📊 Dashboard
                        </button>
                    )}
                </div>
                <div className="nav-user">
                    <span>Welcome, {user.name}</span>
                    <span className="user-role">({user.role})</span>
                    <button onClick={handleLogout} className="logout-btn">Logout</button>
                </div>
            </nav>

            <div className="container">
                {/* All Events Tab */}
                {activeTab === 'events' && (
                    <>
                        <h2>📅 Upcoming Events</h2>
                        {events.length === 0 ? (
                            <div className="no-events">
                                <p>No events found.</p>
                                <p>Be the first to create an event!</p>
                            </div>
                        ) : (
                            <div className="events-grid">
                                {events.map((event) => (
                                    <div key={event.id} className="event-card">
                                        <h3>{event.title}</h3>
                                        <p className="event-description">{event.description}</p>
                                        <div className="event-details">
                                            <p><span className="emoji">📍</span> {event.venue}</p>
                                            <p><span className="emoji">📅</span> {new Date(event.start_time).toLocaleString()}</p>
                                            <p><span className="emoji">👥</span> {event.current_registrations || 0}/{event.capacity} registered</p>
                                            {event.category && <p><span className="emoji">🏷️</span> {event.category}</p>}
                                        </div>
                                        <button 
                                            onClick={() => registerForEvent(event.id)} 
                                            className="register-btn"
                                            disabled={event.current_registrations >= event.capacity}
                                        >
                                            {event.current_registrations >= event.capacity ? 'Full' : 'Register'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* My Events Tab */}
                {activeTab === 'myevents' && (
                    <>
                        <h2>🎯 My Registered Events</h2>
                        {myEvents.length === 0 ? (
                            <div className="no-events">
                                <p>You haven't registered for any events yet.</p>
                                <p>Go to "All Events" to register!</p>
                            </div>
                        ) : (
                            <div className="events-grid">
                                {myEvents.map((event) => (
                                    <div key={event.id} className="event-card registered">
                                        <h3>{event.title}</h3>
                                        <p className="event-description">{event.description}</p>
                                        <div className="event-details">
                                            <p><span className="emoji">📍</span> {event.venue}</p>
                                            <p><span className="emoji">📅</span> {new Date(event.start_time).toLocaleString()}</p>
                                            <p><span className="emoji">👥</span> {event.current_registrations || 0}/{event.capacity} registered</p>
                                        </div>
                                        <button onClick={() => cancelRegistration(event.id)} className="cancel-btn">
                                            Cancel Registration
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* Resources Tab */}
                {activeTab === 'resources' && (
                    <>
                        <h2>🏢 Available Resources</h2>
                        {resources.length === 0 ? (
                            <div className="no-events">
                                <p>No resources found.</p>
                                <p>Check back later for available venues and equipment.</p>
                            </div>
                        ) : (
                            <div className="events-grid">
                                {resources.map((resource) => (
                                    <div key={resource.id} className="event-card">
                                        <h3>{resource.name}</h3>
                                        <p className="event-description">{resource.description}</p>
                                        <div className="event-details">
                                            <p><span className="emoji">🏷️</span> {resource.type}</p>
                                            {resource.location && <p><span className="emoji">📍</span> {resource.location}</p>}
                                            {resource.capacity && <p><span className="emoji">👥</span> Capacity: {resource.capacity}</p>}
                                            <p><span className="emoji">✅</span> {resource.is_available ? 'Available' : 'Currently Booked'}</p>
                                        </div>
                                        <button 
                                            onClick={() => {
                                                setSelectedResource(resource);
                                                setShowBookingModal(true);
                                            }}
                                            className="register-btn"
                                            disabled={!resource.is_available}
                                        >
                                            Book Now
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* My Bookings Tab */}
                {activeTab === 'mybookings' && (
                    <>
                        <h2>📋 My Resource Bookings</h2>
                        {myBookings.length === 0 ? (
                            <div className="no-events">
                                <p>You haven't made any bookings yet.</p>
                                <p>Go to "Resources" to book a venue or equipment!</p>
                            </div>
                        ) : (
                            <div className="events-grid">
                                {myBookings.map((booking) => (
                                    <div key={booking.id} className="event-card">
                                        <h3>{booking.resource_name || 'Resource'}</h3>
                                        <div className="event-details">
                                            <p><span className="emoji">📅</span> Date: {new Date(booking.booking_date).toLocaleDateString()}</p>
                                            <p><span className="emoji">⏰</span> Time: {booking.start_time} - {booking.end_time}</p>
                                            <p><span className="emoji">📝</span> Purpose: {booking.purpose}</p>
                                            <p><span className="emoji">✅</span> Status: {booking.status}</p>
                                        </div>
                                        {booking.status === 'pending' && (
                                            <button onClick={() => cancelBooking(booking.id)} className="cancel-btn">
                                                Cancel Booking
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* Create Event Tab */}
                {activeTab === 'create' && (
                    <>
                        <h2>✨ Create New Event</h2>
                        {error && <div className="error">{error}</div>}
                        {success && <div className="success">{success}</div>}
                        <form onSubmit={handleCreateEvent} className="create-event-form">
                            <input 
                                type="text" 
                                placeholder="Event Title" 
                                value={newEvent.title} 
                                onChange={(e) => setNewEvent({...newEvent, title: e.target.value})} 
                                required 
                            />
                            <textarea 
                                placeholder="Description" 
                                value={newEvent.description} 
                                onChange={(e) => setNewEvent({...newEvent, description: e.target.value})} 
                                rows="3" 
                                required 
                            />
                            <input 
                                type="datetime-local" 
                                value={newEvent.start_time} 
                                onChange={(e) => setNewEvent({...newEvent, start_time: e.target.value})} 
                                required 
                            />
                            <input 
                                type="datetime-local" 
                                value={newEvent.end_time} 
                                onChange={(e) => setNewEvent({...newEvent, end_time: e.target.value})} 
                                required 
                            />
                            <input 
                                type="text" 
                                placeholder="Venue" 
                                value={newEvent.venue} 
                                onChange={(e) => setNewEvent({...newEvent, venue: e.target.value})} 
                                required 
                            />
                            <input 
                                type="number" 
                                placeholder="Capacity" 
                                value={newEvent.capacity} 
                                onChange={(e) => setNewEvent({...newEvent, capacity: parseInt(e.target.value)})} 
                                required 
                            />
                            <input 
                                type="text" 
                                placeholder="Category (e.g., Workshop, Conference, Sports)" 
                                value={newEvent.category} 
                                onChange={(e) => setNewEvent({...newEvent, category: e.target.value})} 
                                required 
                            />
                            <button type="submit">Create Event</button>
                        </form>
                    </>
                )}

                {/* Dashboard Tab with Admin Management */}
                {activeTab === 'dashboard' && user.role === 'university_admin' && (
                    <>
                        <h2>📊 Admin Dashboard</h2>
                        <div className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-icon">📅</div>
                                <div className="stat-info">
                                    <h3>Total Events</h3>
                                    <p className="stat-number">{dashboardStats.totalEvents}</p>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon">👥</div>
                                <div className="stat-info">
                                    <h3>Total Users</h3>
                                    <p className="stat-number">{dashboardStats.totalUsers}</p>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon">✅</div>
                                <div className="stat-info">
                                    <h3>Total Registrations</h3>
                                    <p className="stat-number">{dashboardStats.totalRegistrations}</p>
                                </div>
                            </div>
                        </div>

                        {/* Make Admin Section */}
                        <div style={{ background: 'white', padding: '20px', borderRadius: '15px', marginBottom: '30px' }}>
                            <h3 style={{ marginBottom: '15px' }}>👑 Make Someone Admin</h3>
                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                <input 
                                    type="email" 
                                    placeholder="Enter email address"
                                    value={makeAdminEmail}
                                    onChange={(e) => setMakeAdminEmail(e.target.value)}
                                    style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px' }}
                                />
                                <button 
                                    onClick={handleMakeAdmin}
                                    style={{ padding: '12px 24px', background: '#667eea', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                                >
                                    Make Admin
                                </button>
                            </div>
                        </div>

                        {/* Popular Events Section */}
                        <h3>🔥 Popular Events</h3>
                        {dashboardStats.popularEvents?.length === 0 ? (
                            <p>No registrations yet.</p>
                        ) : (
                            <div className="popular-events">
                                {dashboardStats.popularEvents?.map((event, index) => (
                                    <div key={index} className="popular-card">
                                        <div className="popular-header">
                                            <span className="popular-rank">#{index + 1}</span>
                                            <h4>{event.title}</h4>
                                        </div>
                                        <p>Registrations: {event.registrations} / {event.capacity}</p>
                                        <div className="progress-bar">
                                            <div className="progress-fill" style={{width: `${(event.registrations / event.capacity) * 100}%`}}></div>
                                        </div>
                                        <div className="progress-percentage">
                                            {Math.round((event.registrations / event.capacity) * 100)}% full
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* All Users Section */}
                        <h3 style={{ marginTop: '40px' }}>📋 All Users</h3>
                        <div className="events-grid" style={{ marginTop: '20px' }}>
                            {dashboardStats.users?.map((u) => (
                                <div key={u.id} className="event-card">
                                    <h4>{u.name}</h4>
                                    <p>Email: {u.email}</p>
                                    <p>Role: <strong style={{ color: u.role === 'university_admin' ? '#e74c3c' : '#667eea' }}>{u.role}</strong></p>
                                    <p>Joined: {new Date(u.created_at).toLocaleDateString()}</p>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Booking Modal */}
            {showBookingModal && selectedResource && (
                <div className="modal-overlay" onClick={() => setShowBookingModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>Book {selectedResource.name}</h2>
                        <form onSubmit={handleBookingSubmit}>
                            <input 
                                type="date" 
                                value={bookingForm.booking_date} 
                                onChange={(e) => setBookingForm({...bookingForm, booking_date: e.target.value})} 
                                required 
                            />
                            <input 
                                type="time" 
                                value={bookingForm.start_time} 
                                onChange={(e) => setBookingForm({...bookingForm, start_time: e.target.value})} 
                                required 
                            />
                            <input 
                                type="time" 
                                value={bookingForm.end_time} 
                                onChange={(e) => setBookingForm({...bookingForm, end_time: e.target.value})} 
                                required 
                            />
                            <textarea 
                                placeholder="Purpose of booking" 
                                value={bookingForm.purpose} 
                                onChange={(e) => setBookingForm({...bookingForm, purpose: e.target.value})} 
                                rows="3" 
                                required 
                            />
                            <button type="submit">Submit Booking Request</button>
                            <button type="button" onClick={() => setShowBookingModal(false)} className="cancel-btn">Cancel</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;