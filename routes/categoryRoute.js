const express = require('express');
const { Category } = require('../models/categorySchema');
const router = express.Router();

// Predefined women-specific categories
const WOMEN_CATEGORIES = [
  {
    name: 'Menstrual Care',
    color: '#FF69B4',
    icon: '🩸',
    image: '/public/uploads/menstrual-care.jpg'
  },
  {
    name: 'Women\'s Health Supplements',
    color: '#FFB6C1',
    icon: '💊',
    image: '/public/uploads/health-supplements.jpg'
  },
  {
    name: 'Makeup & Cosmetics',
    color: '#FFC0CB',
    icon: '💄',
    image: '/public/uploads/makeup.jpg'
  },
  {
    name: 'Skincare',
    color: '#FFE4E1',
    icon: '✨',
    image: '/public/uploads/skincare.jpg'
  },
  {
    name: 'Hair Care',
    color: '#DDA0DD',
    icon: '💇‍♀️',
    image: '/public/uploads/haircare.jpg'
  },
  {
    name: 'Personal Hygiene',
    color: '#E6E6FA',
    icon: '🧴',
    image: '/public/uploads/hygiene.jpg'
  }
];

// Initialize categories if they don't exist
router.post('/initialize', async (req, res) => {
  try {
    const existingCategories = await Category.find();
    if (existingCategories.length === 0) {
      const categories = await Category.insertMany(WOMEN_CATEGORIES);
      res.status(201).json(categories);
    } else {
      res.status(200).json({ message: 'Categories already initialized' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all categories
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find();
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get category by ID
router.get('/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.status(200).json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new category
router.post('/', async (req, res) => {
  try {
    const category = new Category({
      name: req.body.name,
      color: req.body.color,
      icon: req.body.icon,
      image: req.body.image
    });
    const savedCategory = await category.save();
    res.status(201).json(savedCategory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update category
router.put('/:id', async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name,
        color: req.body.color,
        icon: req.body.icon,
        image: req.body.image
      },
      { new: true }
    );
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.status(200).json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete category
router.delete('/:id', async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.status(200).json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
