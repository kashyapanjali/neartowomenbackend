const express = require('express');
const { User } = require('../models/userSchema');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

//register the user

router.post('/', async (req, res) => {
  if (!req.body.password) {
    return res.status(400).json({ error: 'Password is required' });
  }

  let user = new User({
    name: req.body.name,
    email: req.body.email,
    passwordHash: bcrypt.hashSync(req.body.password, 10), //10 is secret key
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

//login the user

router.post('/login', async (req, res) => {
  const user = await User.findOne({
    email: req.body.email,
  });

  const secret = process.env.SECRET_KEY;
  if (!user) {
    return res.status(400).send('The user not found');
  }

  if (user && bcrypt.compareSync(req.body.password, user.passwordHash)) {
    const token = jwt.sign(
      {
        userId: user.id,
      },
      secret,
      { expiresIn: '1d' }
    );

    res.status(200).send({ user: user.email, token: token });
  } else {
    res.status(400).send('password is wrong');
  }
});

module.exports = router;
