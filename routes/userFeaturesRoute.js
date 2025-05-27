// routes/userFeaturesRoute.js
const express = require('express');
const router = express.Router();
const { User } = require('../models/userSchema');
const checkRole = require('../helpers/checkRole');

// Address management
router.post('/addresses/add', checkRole(['user']), async (req, res) => {
  try {
    const { userId, address } = req.body;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // If this is the first address, set it as default
    if (user.shippingAddresses.length === 0) {
      address.isDefault = true;
    }

    user.shippingAddresses.push(address);
    await user.save();
    
    res.status(200).json({ 
      message: 'Address added successfully', 
      addresses: user.shippingAddresses 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user's shipping addresses
router.get('/addresses/:userId', checkRole(['user']), async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user.shippingAddresses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Set default shipping address
router.put('/addresses/default/:userId', checkRole(['user']), async (req, res) => {
  try {
    const { addressId } = req.body;
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Reset all addresses to non-default
    user.shippingAddresses.forEach(addr => {
      addr.isDefault = false;
    });

    // Set the selected address as default
    const address = user.shippingAddresses.id(addressId);
    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }
    address.isDefault = true;

    await user.save();
    res.status(200).json({ 
      message: 'Default address updated', 
      addresses: user.shippingAddresses 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Payment methods
router.post('/payment-methods/add', checkRole(['user']), async (req, res) => {
  try {
    const { userId, paymentMethod } = req.body;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // If this is the first payment method, set it as default
    if (user.paymentMethods.length === 0) {
      paymentMethod.isDefault = true;
    }

    user.paymentMethods.push(paymentMethod);
    await user.save();
    
    res.status(200).json({ 
      message: 'Payment method added successfully', 
      paymentMethods: user.paymentMethods 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user's payment methods
router.get('/payment-methods/:userId', checkRole(['user']), async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user.paymentMethods);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;