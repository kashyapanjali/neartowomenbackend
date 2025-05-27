const express = require('express');
const router = express.Router();
const { Cart } = require('../models/cartSchema');
const { Product } = require('../models/productSchema');

// Get user's cart
router.get('/:userId', async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.params.userId })
      .populate('items.product');
    if (!cart) {
      return res.status(200).json({ items: [], totalAmount: 0 });
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
    const { userId, productId, quantity } = req.body;
    
    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const item = cart.items.find(item => 
      item.product.toString() === productId
    );
    
    if (!item) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }

    // Validate stock
    const product = await Product.findById(productId);
    if (product.countInStock < quantity) {
      return res.status(400).json({ message: 'Not enough stock available' });
    }

    item.quantity = quantity;
    cart.totalAmount = cart.items.reduce((total, item) => {
      return total + (item.product.price * item.quantity);
    }, 0);

    await cart.save();
    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Remove item from cart

//delete by id : http://localhost:3000/api/cart
router.delete('/:userId', async (req, res) => {
  try {
    const { userId, productId } = req.body;
    
    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    cart.items = cart.items.filter(item => 
      item.product.toString() !== productId
    );

    cart.totalAmount = cart.items.reduce((total, item) => {
      return total + (item.product.price * item.quantity);
    }, 0);

    await cart.save();
    res.status(200).json(cart);
  } catch (error) {
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



