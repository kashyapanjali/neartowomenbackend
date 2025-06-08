// routes/purchaseRoute.js
const express = require('express');
const router = express.Router();
const { Order } = require('../models/orderSchema');
const { OrderItem } = require('../models/order-itemSchema');
const { Cart } = require('../models/cartSchema');
const { Product } = require('../models/productSchema');
const checkRole = require('../helpers/checkRole');

// Purchase from cart
router.post('/cart/:userId', checkRole(['user']), async (req, res) => {
  try {
    // Get cart
    const cart = await Cart.findOne({ user: req.params.userId })
      .populate('items.product');

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    // Create order items
    const orderItems = await Promise.all(
      cart.items.map(async (item) => {
        const orderItem = new OrderItem({
          quantity: item.quantity,
          products: item.product._id
        });
        return await orderItem.save();
      })
    );

    // Calculate total price
    const totalPrice = orderItems.reduce((total, item) => {
      return total + (item.quantity * item.products.price);
    }, 0);

    // Create order
    const order = new Order({
      orderItems: orderItems.map(item => item._id),
      shippingAddress: req.body.shippingAddress,
      city: req.body.city,
      zip: req.body.zip,
      phone: req.body.phone,
      status: 'pending',
      totalPrice,
      user: req.params.userId
    });

    await order.save();

    // Clear cart
    cart.items = [];
    await cart.save();

    res.status(201).json({
      message: 'Order created successfully',
      order
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Direct purchase (without cart)
router.post('/direct/:userId', checkRole(['user']), async (req, res) => {
  try {
    const { productId, quantity, shippingAddress, city, zip, phone } = req.body;

    // Validate product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Create order item
    const orderItem = new OrderItem({
      quantity,
      products: productId
    });
    await orderItem.save();

    // Calculate total price
    const totalPrice = quantity * product.price;

    // Create order
    const order = new Order({
      orderItems: [orderItem._id],
      shippingAddress,
      city,
      zip,
      phone,
      status: 'pending',
      totalPrice,
      user: req.params.userId
    });

    await order.save();

    res.status(201).json({
      message: 'Order created successfully',
      order
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user's orders
router.get('/user/:userId', checkRole(['user']), async (req, res) => {
  try {
    const orders = await Order.find({ user: req.params.userId })
      .populate({
        path: 'orderItems',
        populate: {
          path: 'products',
          populate: 'category'
        }
      })
      .sort({ dateOrder: -1 });

    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get order details
router.get('/:orderId', checkRole(['user']), async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate({
        path: 'orderItems',
        populate: {
          path: 'products',
          populate: 'category'
        }
      });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;