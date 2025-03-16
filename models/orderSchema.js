const mongoose = require('mongoose');

const orderSchema = mongoose.Schema({
  orderItems: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'OrderItem',
      required: true,
    },
  ],

  shippingAddress: {
    //full address
    type: String,
    required: true,
  },

  city: {
    type: String,
    required: true,
  },

  zip: {
    type: String,
    required: true,
  },

  phone: {
    type: String,
    required: true,
  },

  status: {
    type: String,
    required: true,
    default: 'pending',
  },

  totalPrice: {
    type: Number,
  },

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },

  dateOrder: {
    type: Date,
    default: Date.now,
  },
});

orderSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

orderSchema.set('toJSON', {
  virtuals: true,
});

const Order = mongoose.model('Order', orderSchema);
module.exports = { Order };
