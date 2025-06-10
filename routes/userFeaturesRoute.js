// routes/userFeaturesRoute.js
const express = require('express');
const router = express.Router();
const { User } = require('../models/userSchema');
const checkRole = require('../helpers/checkRole');

// Address management
router.post('/addresses', checkRole(['user']), async (req, res) => {
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

// UPI payment methods
router.post('/upi-methods', checkRole(['user']), async (req, res) => {
  try {
    const { userId, upiMethod } = req.body;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Validate UPI ID format
    if (!upiMethod.upiId || !upiMethod.upiId.includes('@')) {
      return res.status(400).json({ 
        message: 'Invalid UPI ID format',
        example: 'username@upi'
      });
    }

    // Validate UPI app
    const validApps = ['gpay', 'phonepe', 'paytm'];
    if (!validApps.includes(upiMethod.app)) {
      return res.status(400).json({ 
        message: 'Invalid UPI app',
        supportedApps: validApps
      });
    }

    // If this is the first UPI method, set it as default
    if (user.upiMethods.length === 0) {
      upiMethod.isDefault = true;
    }

    user.upiMethods.push(upiMethod);
    await user.save();
    
    res.status(200).json({ 
      message: 'UPI method added successfully', 
      upiMethods: user.upiMethods 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user's UPI methods
router.get('/upi-methods/:userId', checkRole(['user']), async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user.upiMethods);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Set default UPI method
router.put('/upi-methods/default/:userId', checkRole(['user']), async (req, res) => {
  try {
    const { upiMethodId } = req.body;
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Reset all UPI methods to non-default
    user.upiMethods.forEach(method => {
      method.isDefault = false;
    });

    // Set the selected UPI method as default
    const upiMethod = user.upiMethods.id(upiMethodId);
    if (!upiMethod) {
      return res.status(404).json({ message: 'UPI method not found' });
    }
    upiMethod.isDefault = true;

    await user.save();
    res.status(200).json({ 
      message: 'Default UPI method updated', 
      upiMethods: user.upiMethods 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;