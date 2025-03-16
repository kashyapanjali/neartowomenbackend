const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },

  email: {
    type: String,
    required: true,
  },

  passwordHash: {
    type: String,
    required: true,
  },

  phone: {
    type: String,
    required: true,
  },

  isAdmin: {
    type: Boolean,
    required: false,
  },

  street: {
    type: String,
    default: '',
  },

  zip: {
    type: String,
    default: '',
  },

  city: {
    type: String,
    default: '',
  },
});

userSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

userSchema.set('toJSON', {
  virtual: true,
});

const User = mongoose.model('User', userSchema);

module.exports = { User };
