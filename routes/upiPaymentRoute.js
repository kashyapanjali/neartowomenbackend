const express = require('express');
const router = express.Router();
const { Order } = require('../models/orderSchema');
const checkRole = require('../helpers/checkRole');

// Process UPI payment for an order
router.post('/process/:orderId', checkRole(['user']), async (req, res) => {
  try {
    const { orderId } = req.params;
    const { upiId, upiApp } = req.body; // upiApp can be 'paytm', 'gpay', 'phonepe'

    // Validate UPI ID format
    if (!upiId || !upiId.includes('@')) {
      return res.status(400).json({ message: 'Invalid UPI ID format' });
    }

    // Validate UPI app
    const validApps = ['paytm', 'gpay', 'phonepe'];
    if (!validApps.includes(upiApp)) {
      return res.status(400).json({ message: 'Invalid UPI app' });
    }

    // Find the order
    const order = await Order.findById(orderId)
      .populate('user', 'name email')
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

    // Check if order is already paid
    if (order.status === 'paid') {
      return res.status(400).json({ message: 'Order is already paid' });
    }

    // Simulate UPI payment processing
    const paymentResult = {
      success: true,
      transactionId: `UPI${Date.now()}`,
      amount: order.totalPrice,
      currency: 'INR',
      upiApp,
      upiId,
      paymentDate: new Date()
    };

    // Update order with payment details
    order.status = 'paid';
    order.paymentDetails = {
      transactionId: paymentResult.transactionId,
      paymentMethod: 'upi',
      paymentStatus: 'completed',
      paymentDate: paymentResult.paymentDate,
      amount: paymentResult.amount,
      currency: paymentResult.currency,
      upiDetails: {
        app: upiApp,
        upiId: upiId
      }
    };

    await order.save();

    res.status(200).json({
      message: 'UPI payment processed successfully',
      payment: paymentResult,
      order: {
        id: order._id,
        status: order.status,
        totalPrice: order.totalPrice
      }
    });
  } catch (error) {
    console.error('UPI payment processing error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get UPI payment status for an order
router.get('/status/:orderId', checkRole(['user']), async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .select('status paymentDetails totalPrice');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.status(200).json({
      orderId: order._id,
      status: order.status,
      paymentDetails: order.paymentDetails || null,
      totalAmount: order.totalPrice
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get UPI payment history for a user
router.get('/history/:userId', checkRole(['user']), async (req, res) => {
  try {
    const orders = await Order.find({ 
      user: req.params.userId,
      status: 'paid',
      'paymentDetails.paymentMethod': 'upi'
    })
    .select('status paymentDetails totalPrice dateOrder')
    .sort({ dateOrder: -1 });

    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;