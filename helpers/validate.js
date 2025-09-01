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

// Product validation schemas
const productValidationSchemas = {
  create: Joi.object({
    name: Joi.string()
      .min(2)
      .max(100)
      .required()
      .messages({
        'string.min': 'Product name must be at least 2 characters long',
        'string.max': 'Product name cannot exceed 100 characters',
        'any.required': 'Product name is required'
      }),
    description: Joi.string()
      .min(10)
      .max(1000)
      .required()
      .messages({
        'string.min': 'Description must be at least 10 characters long',
        'string.max': 'Description cannot exceed 1000 characters',
        'any.required': 'Description is required'
      }),
    price: Joi.number()
      .positive()
      .required()
      .messages({
        'number.base': 'Price must be a number',
        'number.positive': 'Price must be positive',
        'any.required': 'Price is required'
      }),
    category: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'Invalid category ID format',
        'any.required': 'Category is required'
      }),
    countInStock: Joi.number()
      .integer()
      .min(0)
      .max(300)
      .required()
      .messages({
        'number.base': 'Stock count must be a number',
        'number.integer': 'Stock count must be an integer',
        'number.min': 'Stock count cannot be negative',
        'number.max': 'Stock count cannot exceed 300',
        'any.required': 'Stock count is required'
      }),
    brand: Joi.string()
      .max(50)
      .optional()
      .messages({
        'string.max': 'Brand name cannot exceed 50 characters'
      }),
    isFeatures: Joi.boolean()
      .default(false)
  }),

  update: Joi.object({
    name: Joi.string()
      .min(2)
      .max(100)
      .optional(),
    description: Joi.string()
      .min(10)
      .max(1000)
      .optional(),
    price: Joi.number()
      .positive()
      .optional(),
    category: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .optional(),
    countInStock: Joi.number()
      .integer()
      .min(0)
      .max(300)
      .optional(),
    brand: Joi.string()
      .max(50)
      .optional(),
    isFeatures: Joi.boolean()
      .optional()
  })
};

module.exports = {
  validationSchemas,
  validateRequest,
  validateEmail,
  validatePassword,
  validateUsername,
  productValidationSchemas
};

