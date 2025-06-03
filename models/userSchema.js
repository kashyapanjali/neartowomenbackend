const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },

  email: {
    type: String,
    required: true,
    unique: true
  },

  passwordHash: {
    type: String,
    required: true,
  },

  phone: {
    type: String,
    default: '',
  },

  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },

  // Single address field for basic user info
  address: {
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
    }
  },

  isActive: {
    type: Boolean,
    default: true
  },

  // Multiple addresses for shipping
  shippingAddresses: [{
    street: String,
    city: String,
    zip: String,
    isDefault: Boolean
  }],

  paymentMethods: [{
    type: String,
    cardNumber: String,
    expiryDate: String,
    isDefault: Boolean
  }]
});

userSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

userSchema.set('toJSON', {
  virtual: true,
});

const User = mongoose.model('User', userSchema);

module.exports = { User };
