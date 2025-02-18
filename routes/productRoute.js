const express = require('express');
const { Product } = require('../models/productSchema');
const { Category } = require('../models/categorySchema');
const router = express.Router();
// const mongoose = require('mongoose');

//model router
//add the product
router.post('/addproduct', async (req, res) => {
  try {
    // Check if category exists
    const category = await Category.findById(req.body.category);
    if (!category) return res.status(400).send('Invalid Category');
    // Create product
    const product = new Product({
      name: req.body.name,
      description: req.body.description,
      richDescription: req.body.richDescription,
      image: req.body.image,
      brand: req.body.brand,
      price: req.body.price,
      category: req.body.category,
      countInStock: req.body.countInStock,
      rating: req.body.rating,
      numReviews: req.body.numReviews,
      isFeatures: req.body.isFeatures, // Ensure consistency with schema
    });
    // Save product
    const savedProduct = await product.save();
    if (!savedProduct) {
      return res.status(500).send('The product cannot be created');
    }
    // Send response
    res.status(201).json({
      message: 'Product added successfully!',
      product: savedProduct,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Route to get all products
router.get('/getproducts', async (req, res) => {
  try {
    const products = await Product.find().populate('category'); //.select("name -_id"); select by specific item like name,color,price etc
    res.status(200).json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//find the product by id
router.get('/getproduct/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('category'); //get product with category
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//delete by id
router.delete('/deleteproduct/:id', async (req, res) => {
  try {
    const deleteProduct = await Product.findByIdAndDelete(req.params.id);
    if (!deleteProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Route to update a product by ID
router.put('/updateproduct/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.body.category);
    if (!category) return res.status(400).send('Invalid Category');

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name,
        description: req.body.description,
        richDescription: req.body.richDescription,
        image: req.body.image,
        brand: req.body.brand,
        price: req.body.price,
        category: req.body.category,
        countInStock: req.body.countInStock,
        rating: req.body.rating,
        numReviews: req.body.numReviews,
        isFeatures: req.body.isFeatures, // Ensure consistency with schema
      },
      { new: true }
    );
    if (!updatedProduct) {
      return res.status(500).send({ message: 'Product cannot be updated' });
    }
    res.status(200).send(updatedProduct); // Send the updated category as the response
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
});

//for the Admin see how many products
router.get('/get/count', async (req, res) => {
  const countProduct = await Product.countDocuments();
  if (!countProduct) {
    res.status(500).json({ success: false });
  }

  res.send({
    countProduct: countProduct,
  });
});

module.exports = router;
