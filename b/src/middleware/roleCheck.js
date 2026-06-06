const roleCheck = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }
        
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Insufficient permissions.',
                required: allowedRoles,
                yourRole: req.user.role
            });
        }
        
        next();
    };
};

const isAdmin = roleCheck('university_admin');
const isClubAdmin = roleCheck('club_admin', 'university_admin');
const isStudent = roleCheck('student', 'club_admin', 'university_admin');

module.exports = { roleCheck, isAdmin, isClubAdmin, isStudent };