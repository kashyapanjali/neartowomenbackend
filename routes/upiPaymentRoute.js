const express = require('express');
const router = express.Router();
const { Order } = require('../models/orderSchema');
const checkRole = require('../helpers/checkRole');

// List supported UPI apps
router.get('/supported-apps', (req, res) => {
  res.json({
    supportedApps: [
      { id: 'gpay', name: 'Google Pay' },
      { id: 'phonepe', name: 'PhonePe' },
      { id: 'paytm', name: 'Paytm' }
    ]
  });
});

// Process UPI payment for an order
router.post('/process/:orderId', checkRole(['user']), async (req, res) => {
  try {
    const { orderId } = req.params;
    const { upiId, upiApp } = req.body;

    // Basic UPI ID validation
    if (!upiId || !upiId.includes('@')) {
      return res.status(400).json({ 
        message: 'Invalid UPI ID format',
        example: 'username@upi'
      });
    }

    // Validate UPI app
    const validApps = ['gpay', 'phonepe', 'paytm'];
    if (!validApps.includes(upiApp)) {
      return res.status(400).json({ 
        message: 'Invalid UPI app',
        supportedApps: validApps
      });
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

    // Generate a unique transaction ID
    const transactionId = `UPI${Date.now()}`;

    // Simulate UPI payment processing
    const paymentResult = {
      success: true,
      transactionId: transactionId,
      amount: order.totalPrice,
      currency: 'INR',
      upiApp,
      upiId,
      paymentDate: new Date(),
      status: 'completed'
    };

    // Update order with payment details
    order.status = 'paid';
    order.paymentDetails = {
      transactionId: paymentResult.transactionId,
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
      payment: {
        transactionId: paymentResult.transactionId,
        amount: paymentResult.amount,
        status: paymentResult.status,
        upiApp: paymentResult.upiApp,
        upiId: paymentResult.upiId,
        paymentDate: paymentResult.paymentDate
      },
      order: {
        id: order._id,
        status: order.status,
        totalPrice: order.totalPrice
      }
    });
  } catch (error) {
    console.error('UPI payment processing error:', error);
    res.status(500).json({ 
      message: 'Payment processing failed',
      error: error.message 
    });
  }
});

// Get payment status for an order
router.get('/status/:orderId', checkRole(['user']), async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .select('status paymentDetails totalPrice dateOrder');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.status(200).json({
      orderId: order._id,
      status: order.status,
      paymentDetails: order.paymentDetails || null,
      totalAmount: order.totalPrice,
      dateOrder: order.dateOrder
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get payment history for a user
router.get('/history/:userId', checkRole(['user']), async (req, res) => {
  try {
    const orders = await Order.find({ 
      user: req.params.userId,
      status: 'paid'
    })
    .select('status paymentDetails totalPrice dateOrder')
    .sort({ dateOrder: -1 });

    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;