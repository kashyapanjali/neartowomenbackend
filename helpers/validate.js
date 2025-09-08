// add validation only for login and signup
const Joi = require('joi');

// Signup validation
function validateSignup(data) {
  const schema = Joi.object({
    name: Joi.string().min(3).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required()
  });

  return schema.validate(data);
}

// Login validation
function validateLogin(data) {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  });

  return schema.validate(data);
}

module.exports = {
  validateSignup,
  validateLogin
};

