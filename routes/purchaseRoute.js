// routes/purchaseRoute.js
const express = require('express');
const router = express.Router();
const { Order } = require('../models/orderSchema');
const { OrderItem } = require('../models/order-itemSchema');
const { Cart } = require('../models/cartSchema');
const { Product } = require('../models/productSchema');
const checkRole = require('../helpers/checkRole');
const mongoose = require('mongoose');


// Ensure userId in params matches authenticated user
const validateUserAccess = (req, res, next) => {
  const tokenUserId = req.user?.userId;
  if (!tokenUserId) {
    return res.status(401).json({ message: 'Unauthorized: No user info in token' });
  }
  if (req.params.userId && req.params.userId !== tokenUserId) {
    return res.status(403).json({ message: 'Access denied: You can only access your own resources' });
  }
  next();
};

// Purchase from cart
router.post('/cart/:userId', checkRole(['user', 'admin']), validateUserAccess, async (req, res) => {
  try {
    // Get cart
    const cart = await Cart.findOne({ user: req.params.userId })
      .populate('cartItems.product');

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    // Validate stock availability
    for (let item of cart.cartItems) {
      if (item.product.countInStock < item.quantity) {
        return res.status(400).json({ 
          message: `Insufficient stock for ${item.product.name}. Available: ${item.product.countInStock}` 
        });
      }
    }

    // Create order items
    const orderItems = await Promise.all(
      cart.cartItems.map(async (item) => {
        const orderItem = new OrderItem({
          quantity: item.quantity,
          product: item.product._id
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

    // Update product inventory
    await Promise.all(
      cart.cartItems.map(async (item) => {
        await Product.findByIdAndUpdate(
          item.product._id,
          { $inc: { countInStock: -item.quantity } }
        );
      })
    );

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
router.post('/direct/:userId', checkRole(['user', 'admin']), validateUserAccess, async (req, res) => {
  try {
    const { productId, quantity, shippingAddress, phone } = req.body;

    // Validate required fields
    if (!productId || !quantity || !shippingAddress || !shippingAddress.street || !shippingAddress.city || !shippingAddress.zip || !phone) {
      return res.status(400).json({
        message: 'Missing required fields: productId, quantity, shippingAddress {street, city, zip}, phone'
      });
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
      product: productId
    });
    await orderItem.save();

    // Calculate total price
    const totalPrice = quantity * product.price;

    // Create order
    const order = new Order({
      orderItems: [orderItem._id],
      shippingAddress: {
        street: shippingAddress.street,
        city: shippingAddress.city,
        zip: shippingAddress.zip
      },
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

// Get user's order history
router.get('/user/:userId', checkRole(['user', 'admin']), validateUserAccess, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    // Build filter
    const filter = { user: req.params.userId };
    if (status) {
      filter.status = status;
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get orders with pagination
    const orders = await Order.find(filter)
      .populate({
        path: 'orderItems',
        populate: {
          path: 'product',
          select: 'name image price brand'
        }
      })
      .sort({ dateOrder: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count
    const totalOrders = await Order.countDocuments(filter);
    const totalPages = Math.ceil(totalOrders / parseInt(limit));
    
    res.status(200).json({
      orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalOrders,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Get order history error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get order details by order ID (user can only see their own orders)
router.get('/:orderId', checkRole(['user', 'admin']), async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate({
        path: 'orderItems',
        populate: {
          path: 'product',
          select: 'name image price brand description'
        }
      })
      .populate('user', 'name email');
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Check if user owns this order
    if (order.user._id.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied: You can only view your own orders' });
    }
    
    res.status(200).json(order);
  } catch (error) {
    console.error('Get order details error:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;