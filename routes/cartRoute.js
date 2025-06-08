const express = require('express');
const router = express.Router();
const { Cart } = require('../models/cartSchema');
const { Product } = require('../models/productSchema');
const mongoose = require('mongoose');

// Get user's cart
router.get('/:userId', async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.params.userId })
      .populate('cartItems.product');
    if (!cart) {
      return res.status(200).json({ cartItems: [], totalAmount: 0 });
    }
    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// Add item to cart
router.post('/', async (req, res) => {
  try {
    const { userId, productId, quantity } = req.body;
    
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
        // If item exists, increment the quantity
        existingItem.quantity += quantity;
      } else {
        // If item doesn't exist, add new item
        cart.cartItems.push({ product: productId, quantity });
      }
      
      // Recalculate total amount
      cart.totalAmount = cart.cartItems.reduce((total, item) => {
        return total + (item.product.price * item.quantity);
      }, 0);
    }

    await cart.save();
    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// Update cart item quantity
router.put('/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const { productId, quantity } = req.body;
    
    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }
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
router.delete('/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const { productId } = req.body;
    
    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }
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
router.delete('/clear/:userId', async (req, res) => {
  try {
    const cart = await Cart.findOneAndDelete({ user: req.params.userId });
    res.status(200).json({ message: 'Cart cleared successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;



