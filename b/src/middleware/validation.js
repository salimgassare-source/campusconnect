const { body, validationResult } = require('express-validator');

const validate = (validations) => {
    return async (req, res, next) => {
        await Promise.all(validations.map(validation => validation.run(req)));
        
        const errors = validationResult(req);
        if (errors.isEmpty()) {
            return next();
        }
        
        res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array()
        });
    };
};

// Validation rules
const registerValidation = [
    body('name').notEmpty().trim().isLength({ min: 2, max: 100 }),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('student_id').optional().trim(),
    body('course').optional().trim()
];

const loginValidation = [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
];

const eventValidation = [
    body('title').notEmpty().trim().isLength({ min: 3, max: 200 }),
    body('description').optional().trim(),
    body('start_time').isISO8601(),
    body('end_time').isISO8601(),
    body('venue').optional().trim(),
    body('capacity').optional().isInt({ min: 1 }),
    body('category').optional().trim()
];

module.exports = { validate, registerValidation, loginValidation, eventValidation };