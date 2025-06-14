// routes/purchaseRoute.js
const express = require('express');
const router = express.Router();
const { Order } = require('../models/orderSchema');
const { OrderItem } = require('../models/order-itemSchema');
const { Cart } = require('../models/cartSchema');
const { Product } = require('../models/productSchema');
const checkRole = require('../helpers/checkRole');
const mongoose = require('mongoose');

// Purchase from cart
router.post('/cart/:userId', checkRole(['user']), async (req, res) => {
  try {
    // Get cart
    const cart = await Cart.findOne({ user: req.params.userId })
      .populate('cartItems.product');

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    // Create order items
    const orderItems = await Promise.all(
      cart.cartItems.map(async (item) => {
        const orderItem = new OrderItem({
          quantity: item.quantity,
          products: item.product._id
        });
        return await orderItem.save();
      })
    );

    // Calculate total price using the populated cart items
    const totalPrice = cart.cartItems.reduce((total, item) => {
      return total + (item.quantity * item.product.price);
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
    cart.cartItems = [];
    cart.totalAmount = 0;
    await cart.save();

    res.status(201).json({
      message: 'Order created successfully',
      order
    });
  } catch (error) {
    console.error('Purchase error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Direct purchase (without cart)
router.post('/direct/:userId', checkRole(['user']), async (req, res) => {
  try {
    const { productId, quantity, shippingAddress, city, zip, phone } = req.body;

    // Validate required fields
    if (!productId || !quantity || !shippingAddress || !city || !zip || !phone) {
      return res.status(400).json({
        message: 'Missing required fields'});
    }
    // Validate MongoDB ObjectId
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ 
        message: 'Product not found',
        productId: productId,
        details: 'Please verify the product ID is correct and exists in the database'
      });
    }

    // Validate stock
    if (product.countInStock < quantity) {
      return res.status(400).json({ 
        message: 'Not enough stock available',
        availableStock: product.countInStock,
        requestedQuantity: quantity
      });
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

    // Update product stock
    product.countInStock -= quantity;
    await product.save();

    res.status(201).json({
      message: 'Order created successfully',
      order: {
        id: order._id,
        totalPrice: order.totalPrice,
        status: order.status,
        dateOrder: order.dateOrder,
        product: {
          id: product._id,
          name: product.name,
          price: product.price
        }
      }
    });
  } catch (error) {
    console.error('Direct purchase error:', error);
    res.status(500).json({ 
      message: error.message,
      details: 'An error occurred while processing your purchase'
    });
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