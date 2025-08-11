const express = require('express');
const { Category } = require('../models/categorySchema');
const router = express.Router();
const checkRole = require('../helpers/checkRole');


//router for all get category
router.get('/', async (req, res) => {
  const categoryList = await Category.find();
  if (!categoryList) {
    return res.status(500).json({ succes: false });
  }
  res.status(200).send(categoryList);
});


//router for get category by id
router.get('/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res
        .status(404)
        .json({ message: 'category with the given id is not found' });
    }
    res.status(200).json({ category });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


//router for update the category
router.put('/:id', checkRole(['admin']), async (req, res) => {
  try {
    if (!req.body.name) {
      return res
        .status(400)
        .json({ success: false, message: 'Category name is required' });
    }
    const category = await Category.findByIdAndUpdate(
      req.params.id, // Get ID from URL
      {
        name: req.body.name,
      },
      { new: true }
    );
    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: 'Category not found!' });
    }
    res.status(200).json({ success: true, category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});


//router for add product by category
router.post('/', checkRole(['admin']), async (req, res) => { 
    let category = new Category({
    name: req.body.name,
  });
  category = await category.save();

  if (!category) {
    return res.status(404).send('the category cannot be created!');
  }
  res.send(category);
});


//delete category
router.delete('/:id', checkRole(['admin']), async (req, res) => {
  try {
    const deleteCategory = await Category.findByIdAndDelete(req.params.id);
    if (deleteCategory) {
      return res
        .status(200)
        .json({ success: true, message: 'the category is deleted' });
    } else {
      return res
        .status(404)
        .json({ success: false, message: 'category not found' });
    }
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
