const express = require('express');
const router = express.Router();
const { Order } = require('../models/orderSchema');
const { OrderItem } = require('../models/order-itemSchema');
const checkRole = require('../helpers/checkRole');


// Admin routes
// Get all orders (admin only)
router.get('/', checkRole(['admin']), async (req, res) => {
  try {
    const orderList = await Order.find()
      .populate('user', 'name email')
      .populate({
        path: 'orderItems',
        populate: {
          path: 'product',
          populate: 'category'
        }
      })
      .sort({ 'dateOrder': -1 });

    res.status(200).json(orderList);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// Get order by ID (admin only)
router.get('/:id', checkRole(['admin']), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
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
    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// Update order status (admin only)
router.put('/:id', checkRole(['admin']), async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
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



// Delete order (admin only)
router.delete('/:id', checkRole(['admin']), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Delete order items
    await Promise.all(
      order.orderItems.map(async (orderItemId) => {
        await OrderItem.findByIdAndDelete(orderItemId);
      })
    );

    // Delete order
    await Order.findByIdAndDelete(req.params.id);

    res.status(200).json({
      message: 'Order and its items deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});



// Get total sales (admin only)
router.get('/get/totalsales', checkRole(['admin']), async (req, res) => {
  try {
    const totalSales = await Order.aggregate([
      { $group: { _id: null, totalSales: { $sum: '$totalPrice' } } }
    ]);

    if (!totalSales.length) {
      return res.status(200).json({ totalSales: 0 });
    }
    res.status(200).json({ totalSales: totalSales[0].totalSales });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// Get order count (admin only)
router.get('/get/count', checkRole(['admin']), async (req, res) => {
  try {
    const orderCount = await Order.countDocuments();
    res.status(200).json({ orderCount });
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

module.exports = router;
