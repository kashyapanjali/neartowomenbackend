const express = require('express');
const { User } = require('../models/userSchema');
const router = express.Router();
const bcrypt = require('bcryptjs');

//register the user

router.post('/', async (req, res) => {
  if (!req.body.password) {
    return res.status(400).json({ error: 'Password is required' });
  }

  let user = new User({
    name: req.body.name,
    email: req.body.email,
    passwordHash: bcrypt.hashSync(req.body.password, 10),
    phone: req.body.phone,
    isAdmin: req.body.isAdmin,
    street: req.body.street,
    apartment: req.body.apartment,
    zip: req.body.zip,
    city: req.body.city,
    country: req.body.country,
  });

  user = await user.save();
  if (!user) {
    return res.status(400).send('user not register');
  }

  res.send(user);
});

//find list of users
router.get('/', async (req, res) => {
  const userList = await User.find().select('-passwordHash');

  if (!userList) {
    return res.status(500).json({ success: false });
  }
  res.status(200).send(userList);
});

//find one user by id
router.get('/:id', async (req, res) => {
  const userOne = await User.findById(req.params.id).select('-passwordHash');

  if (!userOne) {
    return res.status(500).json({ success: false });
  }
  res.status(200).send(userOne);
});

module.exports = router;
