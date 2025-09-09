const express = require('express');
const router = express.Router();
const { Order } = require('../models/orderSchema');
const checkRole = require('../helpers/checkRole');


//for payment gateway methods
const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay 
let razorpay;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}


router.post('/gateway/create/:orderId', checkRole(['user', 'admin']), async (req, res) => {
  try {
    // Initialize Razorpay here to ensure env vars are loaded
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({ 
        message: 'Payment gateway not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables.' 
      });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const order = await Order.findById(req.params.orderId).select('user totalPrice status');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    if (order.user.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    if (order.status === 'paid') {
      return res.status(400).json({ message: 'Order is already paid' });
    }

    const amountPaise = Math.round(order.totalPrice * 100);
    
    // Create Razorpay order
    const rzpOrder = await razorpay.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt: String(order._id),
      notes: { 
        userId: String(order.user),
        orderId: String(order._id)
      },
      payment_capture: 1
    });

    res.status(200).json({
      keyId: process.env.RAZORPAY_KEY_ID,
      gatewayOrderId: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      orderId: order._id,
      totalPrice: order.totalPrice
    });

  } catch (error) {
    console.error('Razorpay order creation error:', error);
    res.status(500).json({ 
      message: 'Failed to create payment order',
      error: error.message 
    });
  }
});


// Verify Razorpay payment signature and mark order as paid
router.post('/gateway/verify', checkRole(['user', 'admin']), async (req, res) => {
  try {
    // Check if Razorpay is configured
    if (!process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({ 
        message: 'Payment gateway not configured. Please set RAZORPAY_KEY_SECRET environment variable.' 
      });
    }

    const { 
      orderId, 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      upiApp,
      upiId 
    } = req.body;

    // Validate required fields
    if (!orderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ 
        message: 'Missing required payment verification parameters' 
      });
    }

    // Verify Razorpay signature
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');
    
    if (expected !== razorpay_signature) {
      return res.status(400).json({ message: 'Invalid payment signature' });
    }

    // Find and validate order
    const order = await Order.findById(orderId).select('user totalPrice status paymentDetails');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.user.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (order.status === 'paid') {
      return res.status(400).json({ message: 'Order is already paid' });
    }

    // Update order with payment details
    order.status = 'paid';
    order.paymentDetails = {
      transactionId: razorpay_payment_id,
      paymentStatus: 'completed',
      paymentDate: new Date(),
      amount: order.totalPrice,
      currency: 'INR',
      upiDetails: {
        app: upiApp || null,
        upiId: upiId || null
      }
    };

    await order.save();

    res.status(200).json({ 
      message: 'Payment verified and order marked as paid',
      orderId: order._id,
      transactionId: razorpay_payment_id,
      amount: order.totalPrice,
      status: 'paid'
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ 
      message: 'Payment verification failed',
      error: error.message 
    });
  }
});

// Dummy payment verification for testing// this will remove after successful kyc
// router.post('/gateway/verify-dummy', checkRole(['user']), async (req, res) => {
//   try {
//     const { orderId } = req.body;

//     const order = await Order.findById(orderId);
//     if (!order) return res.status(404).json({ message: 'Order not found' });

//     if (order.status === 'paid') {
//       return res.status(400).json({ message: 'Order is already paid' });
//     }

//     order.status = 'paid';
//     order.paymentDetails = {
//       transactionId: `DUMMY${Date.now()}`,
//       paymentStatus: 'completed',
//       paymentDate: new Date(),
//       amount: order.totalPrice,
//       currency: 'INR',
//       upiDetails: { app: 'gpay', upiId: 'test@upi' } 
//     };

//     await order.save();

//     res.status(200).json({
//       message: 'Dummy payment verified successfully',
//       order
//     });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });


// List supported UPI apps
router.get('/supported-apps', (req, res) => {
  res.json({
    supportedApps: [
      { id: 'gpay', name: 'Google Pay' },
      { id: 'phonepe', name: 'PhonePe' },
      { id: 'paytm', name: 'Paytm' },
      { id: 'bhim', name: 'BHIM' },
      { id: 'amazonpay', name: 'Amazon Pay' }
    ]
  });
});

// Create Razorpay order specifically for UPI payment
router.post('/gateway/create-upi/:orderId', checkRole(['user', 'admin']), async (req, res) => {
  try {
    const { upiApp, upiId } = req.body;
    
    // Validate UPI app
    const validApps = ['gpay', 'phonepe', 'paytm', 'bhim', 'amazonpay'];
    if (!validApps.includes(upiApp)) {
      return res.status(400).json({ 
        message: 'Invalid UPI app',
        supportedApps: validApps
      });
    }

    // Basic UPI ID validation
    if (!upiId || !upiId.includes('@')) {
      return res.status(400).json({ 
        message: 'Invalid UPI ID format',
        example: 'username@upi'
      });
    }

    // Initialize Razorpay
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({ 
        message: 'Payment gateway not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables.' 
      });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const order = await Order.findById(req.params.orderId).select('user totalPrice status');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    if (order.user.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    if (order.status === 'paid') {
      return res.status(400).json({ message: 'Order is already paid' });
    }

    const amountPaise = Math.round(order.totalPrice * 100);
    
    // Create Razorpay order with UPI-specific configuration
    const rzpOrder = await razorpay.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt: String(order._id),
      notes: { 
        userId: String(order.user),
        orderId: String(order._id),
        upiApp: upiApp,
        upiId: upiId
      },
      payment_capture: 1
    });

    res.status(200).json({
      keyId: process.env.RAZORPAY_KEY_ID,
      gatewayOrderId: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      orderId: order._id,
      totalPrice: order.totalPrice,
      upiApp: upiApp,
      upiId: upiId
    });

  } catch (error) {
    console.error('Razorpay UPI order creation error:', error);
    res.status(500).json({ 
      message: 'Failed to create UPI payment order',
      error: error.message 
    });
  }
});


// Process UPI payment for an order
router.post('/process/:orderId', checkRole(['user', 'admin']), async (req, res) => {
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
          path: 'product',
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

    // Ensure the order belongs to the authenticated user
    if (order.user.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied: You can only pay for your own orders' });
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
router.get('/status/:orderId', checkRole(['user', 'admin']), async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .select('status paymentDetails totalPrice dateOrder user');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Ensure the order belongs to the authenticated user
    if (order.user.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied: You can only view your own orders' });
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
router.get('/history/:userId', checkRole(['user', 'admin']), async (req, res) => {
  try {
    // Ensure the requested userId matches the authenticated user
    if (req.params.userId !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied: You can only view your own payment history' });
    }

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

// Razorpay webhook endpoint for payment status updates
router.post('/gateway/webhook', async (req, res) => {
  try {
    // Verify webhook signature //this show updation of product - shipped, delivered ...
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('RAZORPAY_WEBHOOK_SECRET not configured');
      return res.status(500).json({ message: 'Webhook secret not configured' });
    }

    const signature = req.headers['x-razorpay-signature'];
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (signature !== expectedSignature) {
      console.error('Invalid webhook signature');
      return res.status(400).json({ message: 'Invalid signature' });
    }

    const { event, payload } = req.body;

    if (event === 'payment.captured') {
      const payment = payload.payment.entity;
      const orderId = payment.notes?.orderId;
      
      if (orderId) {
        const order = await Order.findById(orderId);
        if (order && order.status !== 'paid') {
          order.status = 'paid';
          order.paymentDetails = {
            transactionId: payment.id,
            paymentStatus: 'completed',
            paymentDate: new Date(payment.created_at * 1000),
            amount: payment.amount / 100, // Convert from paise to rupees
            currency: payment.currency,
            upiDetails: {
              app: payment.notes?.upiApp || null,
              upiId: payment.notes?.upiId || null
            }
          };
          await order.save();
          console.log(`Order ${orderId} marked as paid via webhook`);
        }
      }
    }

    res.status(200).json({ message: 'Webhook processed successfully' });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ message: 'Webhook processing failed' });
  }
});

module.exports = router;