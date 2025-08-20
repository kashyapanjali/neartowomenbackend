const mongoose = require('mongoose');

const orderSchema = mongoose.Schema({
  orderItems: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'OrderItem',
      required: true,
    },
  ],

  // Link to chosen shipping address
  // User enters address at checkout
  shippingAddress: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    zip: { type: String, required: true }
  },

  phone: {
    type: String,
    required: true,
  },

  status: {
    type: String,
    required: true,
    default: 'pending',
    enum: ['pending', 'paid', 'shipped', 'delivered', 'cancelled']
  },

  totalPrice: {
    type: Number,
    required: true
  },

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  dateOrder: {
    type: Date,
    default: Date.now,
  },

  // UPI Payment-related fields
  paymentDetails: {
    transactionId: String,
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded']
    },
    paymentDate: Date,
    amount: Number,
    currency: {
      type: String,
      default: 'INR'
    },
    upiDetails: {
      app: {
        type: String,
        enum: ['paytm', 'gpay', 'phonepe']
      },
      upiId: String
    }
  }
});

orderSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

orderSchema.set('toJSON', {
  virtuals: true,
});

const Order = mongoose.model('Order', orderSchema);
module.exports = { Order };
