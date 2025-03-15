const mongoose = require('mongoose');

const orderItemSchema = mongoose.Schema({
  quantity: {
    type: Number,
    required: true,
  },
  products: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
  },
});

const OrderItem = mongoose.model('OrderItem', orderItemSchema);
module.exports = { OrderItem };
