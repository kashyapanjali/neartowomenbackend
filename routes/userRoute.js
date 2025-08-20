const express = require('express');
const { User } = require('../models/userSchema');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const checkRole = require('../helpers/checkRole');

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user with core details
    const user = new User({
      name,
      email,
      passwordHash: bcrypt.hashSync(password, 10),
      role: 'user'
    });

    const savedUser = await user.save();
    // if (!savedUser) {
    //   return res.status(400).json({ message: 'User could not be created' });
    // }

    // Create empty user details
    // const userDetails = new UserDetails({
    //   user: savedUser._id
    // });
    // await userDetails.save();

    // Update user with userDetails reference
    // savedUser.userDetails = userDetails._id;
    // await savedUser.save();

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: savedUser.id,
        name: savedUser.name,
        email: savedUser.email,
        role: savedUser.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: error.message });
  }
});


// Register admin user
router.post('/register-admin', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create admin user with core details
    const user = new User({
      name,
      email,
      passwordHash: bcrypt.hashSync(password, 10),
      role: 'admin'
    });

    const savedUser = await user.save();
    // if (!savedUser) {
    //   return res.status(400).json({ message: 'Admin could not be created' });
    // }

    // Create empty user details
    // const userDetails = new UserDetails({
    //   user: savedUser._id
    // });
    // await userDetails.save();

    // Update user with userDetails reference
    // savedUser.userDetails = userDetails._id;
    // await savedUser.save();

    res.status(201).json({
      message: 'Admin registered successfully',
      user: {
        id: savedUser.id,
        name: savedUser.name,
        email: savedUser.email,
        role: savedUser.role
      }
    });
  } catch (error) {
    console.error('Admin registration error:', error);
    res.status(500).json({ message: error.message });
  }
});


// Login for both user and admin
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    const isPasswordValid = bcrypt.compareSync(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid password' });
    }

    //jwt generate for the users and admin
    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role
      },
      process.env.secret,
      { expiresIn: '1d' }
    );

    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message });
  }
});


// Get user profile
router.get('/', async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const user = await User.findById(req.user.userId)
      .select('-passwordHash');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      message: 'Profile retrieved successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      }
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ message: error.message });
  }
});


// Update user profile
router.put('/', async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const { name, phone, street, zip, city } = req.body;
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update core user details
    if (name) {
      user.name = name;
    }
    await user.save();

    // Update additional user details
    // if (user.userDetails) {
    //   if (phone) user.userDetails.phone = phone;
    //   if (street) user.userDetails.address.street = street;
    //   if (zip) user.userDetails.address.zip = zip;
    //   if (city) user.userDetails.address.city = city;
    //   await user.userDetails.save();
    // }

    res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        details: user.userDetails
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: error.message });
  }
});


// Get user count
router.get('/count', async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    res.status(200).json({ userCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// Admin routes
router.get('/admin', checkRole(['admin']), async (req, res) => {
  try {
    const userList = await User.find()
      .select('-passwordHash');
      res.status(200).json(userList);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


router.get('/admin/:id', checkRole(['admin']), async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-passwordHash');
      // .populate('userDetails');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


router.delete('/admin/:id', checkRole(['admin']), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete user details first
    // if (user.userDetails) {
    //   await UserDetails.findByIdAndDelete(user.userDetails);
    // }

    // Then delete user
    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
