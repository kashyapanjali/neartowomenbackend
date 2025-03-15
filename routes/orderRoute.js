const { OrderItem } = require('../models/order-itemSchema');
const { Order } = require('../models/orderSchema');
const express = require('express');
const router = express.Router();

// Start to create the api of orders

router.get('/', async (req, res) => {
  const orderList = await Order.find();

  if (!orderList) {
    res.status(500).json({ success: false });
  }
  res.send(orderList);
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

  let order = new Order({
    orderItems: orderItemsIdsResolved,
    shippingAddress1: req.body.shippingAddress1,
    shippingAddress2: req.body.shippingAddress2,
    city: req.body.city,
    zip: req.body.zip,
    country: req.body.country,
    phone: req.body.phone,
    status: req.body.status,
    totalPrice: req.body.totalPrice,
    user: req.body.user,
  });

  order = await order.save();
  if (!order) {
    return res.status(400).send({ message: 'the order can be created' });
  }
  res.send(order);
});

module.exports = router;
