const Joi = require('joi');

// Simple validation schemas for email, password, and username
const validationSchemas = {
  // User registration schema
  register: Joi.object({
    name: Joi.string()
      .min(2)
      .max(20)
      .required()
      .messages({
        'string.min': 'Username must be at least 2 characters long',
        'string.max': 'Username cannot exceed 20 characters',
        'any.required': 'Username is required'
      }),
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required'
      }),
    password: Joi.string()
      .min(6)
      .required()
      .messages({
        'string.min': 'Password must be at least 6 characters long',
        'any.required': 'Password is required'
      })
  }),

  // User login schema
  login: Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required'
      }),
    password: Joi.string()
      .required()
      .messages({
        'any.required': 'Password is required'
      })
  })
};

// Validation middleware function
const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errorMessage
      });
    }
    
    next();
  };
};

// Simple validation functions for individual fields
const validateEmail = (email) => {
  const emailSchema = Joi.string().email();
  const { error } = emailSchema.validate(email);
  return {
    isValid: !error,
    error: error ? 'Please provide a valid email address' : null
  };
};

const validatePassword = (password) => {
  const passwordSchema = Joi.string().min(6);
  const { error } = passwordSchema.validate(password);
  return {
    isValid: !error,
    error: error ? 'Password must be at least 6 characters long' : null
  };
};

const validateUsername = (name) => {
  const nameSchema = Joi.string().min(2).max(50);
  const { error } = nameSchema.validate(name);
  return {
    isValid: !error,
    error: error ? 'Username must be 2-50 characters long' : null
  };
};

module.exports = {
  validationSchemas,
  validateRequest,
  validateEmail,
  validatePassword,
  validateUsername
};

