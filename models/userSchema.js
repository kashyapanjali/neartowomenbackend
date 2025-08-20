const mongoose = require('mongoose');

// Core user schema for authentication
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

  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },

  isActive: {
    type: Boolean,
    default: true
  },
});

userSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

userSchema.set('toJSON', {
  virtual: true,
});

const User = mongoose.model('User', userSchema);

// Separate schema for additional user details
// const userDetailsSchema = new mongoose.Schema({
//   user: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true
//   },

//   phone: {
//     type: String,
//     default: '',
//   },

//   // Single address field for basic user info
//   addresses: [{
//     street: String,
//     city: String,
//     zip: String,
//     isDefault: { type: Boolean, default: false }
//   }],

//   // Multiple addresses for shipping
//   // shippingAddresses: [{
//   //   street: String,
//   //   city: String,
//   //   zip: String,
//   //   isDefault: Boolean
//   // }],

//   // UPI payment methods
//   upiMethods: [{
//     upiId: {
//       type: String,
//       required: true
//     },
//     app: {
//       type: String,
//       enum: ['paytm', 'gpay', 'phonepe'],
//       required: true
//     },
//     isDefault: {
//       type: Boolean,
//       default: false
//     }
//   }]
// });

// const UserDetails = mongoose.model('UserDetails', userDetailsSchema);

module.exports = { User};
