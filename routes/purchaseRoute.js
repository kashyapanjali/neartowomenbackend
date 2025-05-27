// routes/purchaseRoute.js
const express = require('express');
const router = express.Router();
const { Order } = require('../models/orderSchema');
const { Product } = require('../models/productSchema');
const { Cart } = require('../models/cartSchema');
const checkRole = require('../helpers/checkRole');

// Method 1: Purchase from Cart
router.post('/cart-purchase', checkRole(['user']), async (req, res) => {
  try {
    const { userId, shippingAddress, city, zip, phone } = req.body;
    
    // Get user's cart
    const cart = await Cart.findOne({ user: userId }).populate('cartItems.product');
    if (!cart || cart.cartItems.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // Validate stock and calculate total
    let totalAmount = 0;
    for (const item of cart.cartItems) {
      const product = await Product.findById(item.product._id);
      if (!product) {
        return res.status(404).json({ message: `Product ${item.product._id} not found` });
      }
      if (product.countInStock < item.quantity) {
        return res.status(400).json({ message: `Not enough stock for ${product.name}` });
      }
      totalAmount += product.price * item.quantity;
    }

    // Create order
    const order = new Order({
      user: userId,
      orderItems: cart.cartItems.map(item => ({
        product: item.product._id,
        quantity: item.quantity
      })),
      shippingAddress,
      city,
      zip,
      phone,
      totalPrice: totalAmount,
      status: 'pending'
    });

    // Save order
    const savedOrder = await order.save();

    // Update product stock
    for (const item of cart.cartItems) {
      await Product.findByIdAndUpdate(item.product._id, {
        $inc: { countInStock: -item.quantity }
      });
    }

    // Clear cart after successful purchase
    await Cart.findOneAndDelete({ user: userId });

    res.status(201).json({
      message: 'Order placed successfully from cart',
      order: savedOrder
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Method 2: Direct Purchase (Buy Now)
router.post('/buy-now', checkRole(['user']), async (req, res) => {
  try {
    const { 
      userId, 
      productId, 
      quantity,
      shippingAddress, 
      city, 
      zip, 
      phone 
    } = req.body;

    // Validate product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Validate stock
    if (product.countInStock < quantity) {
      return res.status(400).json({ message: 'Not enough stock available' });
    }

    // Calculate total
    const totalAmount = product.price * quantity;

    // Create order
    const order = new Order({
      user: userId,
      orderItems: [{
        product: productId,
        quantity: quantity
      }],
      shippingAddress,
      city,
      zip,
      phone,
      totalPrice: totalAmount,
      status: 'pending'
    });

    // Update product stock
    await Product.findByIdAndUpdate(productId, {
      $inc: { countInStock: -quantity }
    });

    // Save order
    const savedOrder = await order.save();

    res.status(201).json({
      message: 'Order placed successfully',
      order: savedOrder
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user's orders
router.get('/my-orders/:userId', checkRole(['user']), async (req, res) => {
  try {
    const orders = await Order.find({ user: req.params.userId })
      .populate({
        path: 'orderItems',
        populate: {
          path: 'product',
          populate: 'category'
        }
      })
      .sort({ dateOrder: -1 });
    
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all orders (Admin only)
router.get('/all-orders', checkRole(['admin']), async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('user', 'name email')
      .populate({
        path: 'orderItems',
        populate: {
          path: 'product',
          populate: 'category'
        }
      })
      .sort({ dateOrder: -1 });
    
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update order status (Admin only)
router.put('/order-status/:orderId', checkRole(['admin']), async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.orderId,
      { status },
      { new: true }
    );
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;