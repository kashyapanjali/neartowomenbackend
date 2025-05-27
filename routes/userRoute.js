const express = require('express');
const { User } = require('../models/userSchema');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const checkRole = require('../helpers/checkRole');

// Register new user
router.post('/register', async (req, res) => {
  try {
    if (!req.body.password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const user = new User({
      name: req.body.name,
      email: req.body.email,
      passwordHash: bcrypt.hashSync(req.body.password, 10),
      phone: req.body.phone,
      isAdmin: req.body.isAdmin || false,
      street: req.body.street,
      zip: req.body.zip,
      city: req.body.city,
    });

    const savedUser = await user.save();
    if (!savedUser) {
      return res.status(400).json({ error: 'User could not be registered' });
    }

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: savedUser._id,
        name: savedUser.name,
        email: savedUser.email,
        isAdmin: savedUser.isAdmin
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    if (user && bcrypt.compareSync(req.body.password, user.passwordHash)) {
      const token = jwt.sign(
        {
          userId: user.id,
          isAdmin: user.isAdmin,
        },
        process.env.secret,
        { expiresIn: '1d' }
      );

      res.status(200).json({
        message: 'Login successful',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          isAdmin: user.isAdmin
        },
        token: token
      });
    } else {
      res.status(400).json({ error: 'Invalid password' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all users (admin only)
router.get('/', checkRole(['admin']), async (req, res) => {
  try {
    const userList = await User.find().select('-passwordHash');
    res.status(200).json(userList);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user by id (user can view their own profile, admin can view any profile)
router.get('/:id', async (req, res) => {
  try {
    // Check if user is trying to access their own profile or is admin
    if (req.user.userId !== req.params.id && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Not authorized to access this profile' });
    }

    const user = await User.findById(req.params.id).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update user (user can update their own profile, admin can update any profile)
router.put('/:id', async (req, res) => {
  try {
    // Check if user is trying to update their own profile or is admin
    if (req.user.userId !== req.params.id && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Not authorized to update this profile' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        street: req.body.street,
        zip: req.body.zip,
        city: req.body.city,
      },
      { new: true }
    ).select('-passwordHash');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete user (admin only)
router.delete('/:id', checkRole(['admin']), async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user count (admin only)
router.get('/get/count', checkRole(['admin']), async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    res.status(200).json({ userCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
