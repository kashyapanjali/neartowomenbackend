const { populate } = require('dotenv');
const { OrderItem } = require('../models/order-itemSchema');
const { Order } = require('../models/orderSchema');
const express = require('express');
const router = express.Router();

// Start to create the api of orders

//get all the order
router.get('/', async (req, res) => {
  const orderList = await Order.find()
    .populate('user', 'name')
    .sort({ 'dateOrder': -1 });

  if (!orderList) {
    res.status(500).json({ success: false });
  }
  res.send(orderList);
});

//get the order by id
router.get('/:id', async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('user', 'name') // only find user name
    .populate({
      path: 'orderItems',
      populate: {
        path: 'products',
        populate: 'category',
      },
    }); // details of orderItem and products with category
  if (!order) {
    res.status(500).json({ success: false });
  }
  res.send(order);
});

// post method of order with linked of orderitem of product
router.post('/', async (req, res) => {
  //first we define which orderItem of product is create
  const orderItemsIds = Promise.all(
    req.body.orderItems.map(async (orderItem) => {
      let newOrderItem = new OrderItem({
        quantity: orderItem.quantity,
        products: orderItem.products,
      });
      newOrderItem = await newOrderItem.save();
      return newOrderItem._id;
    })
  );

  const orderItemsIdsResolved = await orderItemsIds;
  //check the item id

  const totalPrices = await Promise.all(
    orderItemsIdsResolved.map(async (orderItemId) => {
      const orderItem = await OrderItem.findById(orderItemId).populate(
        'product',
        'price'
      );
      const totalPrice = orderItem.product.price * orderItem.quantity;
      return totalPrice;
    })
  );
  const totalPrice = totalPrices.reduce((a, b) => a + b, 0);

  console.log(totalPrice);

  let order = new Order({
    orderItems: orderItemsIdsResolved,
    shippingAddress: req.body.shippingAddress,
    city: req.body.city,
    zip: req.body.zip,
    phone: req.body.phone,
    status: req.body.status,
    totalPrice: totalPrice,
    user: req.body.user,
  });

  order = await order.save();
  if (!order) {
    return res.status(400).send({ message: 'the order can be created' });
  }
  res.send(order);
});

// Only update the status of products i.e shipped, deliver etc
router.put('/:id', async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id, // Get ID from URL
      {
        status: req.body.status,
      },
      { new: true }
    );
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: 'Order not found!' });
    }
    // Successfully updated
    res.status(200).json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

//delete the order by id
router.delete('/:id', async (req, res) => {
  try {
    // Find the order by ID
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: 'Order not found' });
    }

    // Delete ONLY the order items associated with this order
    await Promise.all(
      order.orderItems.map(async (orderItemId) => {
        await OrderItem.findByIdAndDelete(orderItemId);
      })
    );

    // Delete the order itself
    await Order.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Order and its items deleted successfully',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// total sales
router.get('/get/totalsales', async (req, res) => {
  const totalSales = await Order.aggregate([
    { $group: { _id: null, totalSales: { $sum: 'totalPrice' } } },
  ]);

  if (!totalSales) {
    return res.satus(400).send('The order sales canno be generated');
  }
  res.send({ totalSales: totalSales.pop().totalSales });
});

//count how many number of orders of users
router.get('/get/count', async (req, res) => {
  const orderCount = await Order.countDocuments();
  if (!orderCount) {
    res.status(500).json({ success: false });
  }
  res.send({
    orderCount: orderCount,
  });
});

//to find the user order
router.get('/get/userorders/:userid', async (req, res) => {
  const userOrderList = await Order.find({ user: req.params.userid })
    .populate({
      path: 'orderItems',
      populate: {
        path: 'products',
        populate: 'category',
      },
    })
    .sort({ 'dateOrdered': -1 });
  if (!userOrderList) {
    res.status(500).json({ success: false });
  }
  res.send(userOrderList);
});

module.exports = router;
