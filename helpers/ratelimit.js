const rateLimit = require('express-rate-limit');

// Define rate limit
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
        status: 'error',
        message: "Too many requests from this IP, please try again later."
    },
    standardHeaders: true, 
    legacyHeaders: false, 
});

// Different rate limits for different endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: {
        status: 'error',
        message: "Too many authentication attempts, please try again later."
    },
    standardHeaders: true,
    legacyHeaders: false,
});

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // limit each IP to 200 requests per windowMs for general API
    message: {
        status: 'error',
        message: "Too many API requests from this IP, please try again later."
    },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {
    limiter,
    authLimiter,
    apiLimiter
};

