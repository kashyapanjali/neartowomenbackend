const express = require('express');
const router = express.Router();
const { Cart } = require('../models/cartSchema');
const { Product } = require('../models/productSchema');
const mongoose = require('mongoose');

// Helper function to validate user access
const validateUserAccess = (req, res, next) => {
  const requestedUserId = req.user?.userId;
  
  if (!requestedUserId) {
    return res.status(401).json({ message: 'Unauthorized: No user info in token' });
  }
  
  // authentication middleware that sets req.user, use it
  if (req.params.userId && req.params.userId !== requestedUserId) {
    return res.status(403).json({ message: 'Access denied: You can only access your own cart' });
  }
  
  next();
};

// Get user's cart : admin
router.get('/:userId', validateUserAccess, async (req, res) => {
  try {
    const userId = req.user.userId;
    const cart = await Cart.findOne({ user: userId })
      .populate('cartItems.product');
    if (!cart) {
      return res.status(200).json({ cartItems: [], totalAmount: 0 });
    }
    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// Add item to cart - total calculation
router.post('/', validateUserAccess, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { productId, quantity } = req.body;
    
    // Validate product exists and has enough stock
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    if (product.countInStock < quantity) {
      return res.status(400).json({ message: 'Not enough stock available' });
    }

    let cart = await Cart.findOne({ user: userId });
    
    if (!cart) {
      // Create new cart if doesn't exist
      cart = new Cart({
        user: userId,
        cartItems: [{ product: productId, quantity }],
        totalAmount: product.price * quantity
      });
    } else {
      // Update existing cart
      const existingItem = cart.cartItems.find(item => 
        item.product.toString() === productId
      );

      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        cart.cartItems.push({ product: productId, quantity });
      }
      
      // FIXED: Recalculate total amount by fetching all product prices
      let totalAmount = 0;
      for (let item of cart.cartItems) {
        const itemProduct = await Product.findById(item.product);
        if (itemProduct) {
          totalAmount += itemProduct.price * item.quantity;
        }
      }
      cart.totalAmount = totalAmount;
    }

    await cart.save();
    
    // Return populated cart
    const populatedCart = await Cart.findById(cart._id).populate('cartItems.product');
    res.status(200).json(populatedCart);
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update cart item quantity
router.put('/:userId', validateUserAccess, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { productId, quantity } = req.body;
    
    // Validate MongoDB ObjectId
    // if (!mongoose.Types.ObjectId.isValid(userId)) {
    //   return res.status(400).json({ message: 'Invalid user ID format' });
    // }
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'Invalid product ID format' });
    }

    // Get cart with populated product details
    const cart = await Cart.findOne({ user: userId }).populate('cartItems.product');
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const item = cart.cartItems.find(item => 
      item.product._id.toString() === productId
    );
    
    if (!item) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }

    // Validate stock
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    if (product.countInStock < quantity) {
      return res.status(400).json({ message: 'Not enough stock available' });
    }

    // Update quantity
    item.quantity = quantity;
    
    // Recalculate total amount using product prices
    cart.totalAmount = cart.cartItems.reduce((total, cartItem) => {
      const itemTotal = cartItem.product.price * cartItem.quantity;
      return total + itemTotal;
    }, 0);

    await cart.save();
    
    // Return only specific fields
    res.status(200).json({
      cartId: cart._id,
      productId: item.product._id,
      userId: cart.user,
      totalAmount: cart.totalAmount,
      quantity: item.quantity,
    });
  } catch (error) {
    console.error('Cart update error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Remove item from cart
//delete by id : http://localhost:3000/api/cart
router.delete('/:userId', validateUserAccess, async (req, res) => {
  try {
    const userId = req.user.userId;

    const { productId } = req.body;
    
    // Validate MongoDB ObjectId
    // if (!mongoose.Types.ObjectId.isValid(userId)) {
    //   return res.status(400).json({ message: 'Invalid user ID format' });
    // }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'Invalid product ID format' });
    }

    const cart = await Cart.findOne({ user: userId }).populate('cartItems.product');
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    cart.cartItems = cart.cartItems.filter(item => 
      item.product._id.toString() !== productId
    );

    // Recalculate total amount using product prices
    cart.totalAmount = cart.cartItems.reduce((total, cartItem) => {
      const itemTotal = cartItem.product.price * cartItem.quantity;
      return total + itemTotal;
    }, 0);

    await cart.save();
    
    // Return updated cart with populated product details
    const updatedCart = await Cart.findOne({ user: userId })
      .populate('cartItems.product');
      
    res.status(200).json(updatedCart);
  } catch (error) {
    console.error('Cart delete error:', error);
    res.status(500).json({ message: error.message });
  }
});


// Clear cart
router.delete('/clear/:userId', validateUserAccess, async (req, res) => {
  try {
    await Cart.findOneAndDelete({ user: req.user.userId  });
    res.status(200).json({ message: 'Cart cleared successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;



