const express = require('express');
const { Product } = require('../models/productSchema');
const { Category } = require('../models/categorySchema');
const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');
const checkRole = require('../helpers/checkRole');


//validate the uploaded file from the users-------->
const FILE_TYPE_MAP = {
  'image/png': 'png',
  'image/jpeg': 'jpeg',
  'image/jpg': 'jpg',
};


//add multer to upload the gallery of image
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const isValid = FILE_TYPE_MAP[file.mimetype];
    let uploadError = new Error('invalid image type');

    if (isValid) {
      uploadError = null;
    }
    cb(uploadError, 'public/uploads');
  },
  filename: function (req, file, cb) {
    const fileName = file.originalname.split(' ').join('-'); 
    const extension = FILE_TYPE_MAP[file.mimetype];
    cb(null, `${fileName}-${Date.now()}.${extension}`);
  },
});


const uploadOptions = multer({ storage: storage });


//model router
//add the product
router.post('/', checkRole(['admin']), async (req, res) => {
  try {
    // Check if category exists
    const category = await Category.findById(req.body.category);
    if (!category) return res.status(400).send('Invalid Category');

    // Create product
    const product = new Product({
      name: req.body.name,
      description: req.body.description,
      image: req.body.image,
      brand: req.body.brand,
      price: req.body.price,
      category: req.body.category,
      countInStock: req.body.countInStock,
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
      product: savedProduct
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


// Route to get all products
router.get('/', async (req, res) => {
  try {
    //localhost:3000/api/products?categories=2342342,234234
    let filter = {};
    if (req.query.categories) {
      filter = { category: req.query.categories.split(',') };
    }
    const productList = await Product.find(filter).populate('category'); //.select("name -_id"); select by specific item like name,color,price etc
    res.status(200).json(productList);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// Search products - This must come BEFORE the /:id route
router.get('/search', async (req, res) => {
  try {
    const { 
      query, 
      minPrice, 
      maxPrice, 
      category, 
      brand,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 12
    } = req.query;
    
    // Build the search filter
    const filter = {};
    
    // Text search
    if (query) {
      filter.$or = [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { brand: { $regex: query, $options: 'i' } }
      ];
    }
    
    // Price range filter
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }
    
    // Category filter
    if (category) {
      filter.category = category;
    }
    
    // Brand filter
    if (brand) {
      filter.brand = { $regex: brand, $options: 'i' };
    }
    
    // Stock filter (only show in-stock products)
    filter.countInStock = { $gt: 0 };
    
    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Execute query with pagination
    const products = await Product.find(filter)
      .populate('category')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count for pagination
    const totalProducts = await Product.countDocuments(filter);
    const totalPages = Math.ceil(totalProducts / parseInt(limit));
    
    res.status(200).json({
      products,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalProducts,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get featured products
router.get('/featured/:count?', async (req, res) => {
  try {
    const count = parseInt(req.params.count) || 8;
    const featuredProducts = await Product.find({ isFeatures: true })
      .populate('category')
      .limit(count);
    
    res.status(200).json(featuredProducts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get products by category with pagination
router.get('/category/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { page = 1, limit = 12, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    // Validate category exists
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get products
    const products = await Product.find({ 
      category: categoryId, 
      countInStock: { $gt: 0 } 
    })
      .populate('category')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count
    const totalProducts = await Product.countDocuments({ 
      category: categoryId, 
      countInStock: { $gt: 0 } 
    });
    const totalPages = Math.ceil(totalProducts / parseInt(limit));
    
    res.status(200).json({
      category,
      products,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalProducts,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


//find the product by id
router.get('/:id', async (req, res) => {
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
router.delete('/:id', checkRole(['admin']), async (req, res) => {
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
router.put('/:id', checkRole(['admin']), async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(400).send('Invalid Product ID');
  }
  try {
    const category = await Category.findById(req.body.category);
    if (!category) return res.status(400).send('Invalid Category');

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name,
        description: req.body.description,
        image: req.body.image,
        brand: req.body.brand,
        price: req.body.price,
        category: req.body.category,
        countInStock: req.body.countInStock,
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
router.get('/get/count', checkRole(['admin']), async (req, res) => {
  const countProduct = await Product.countDocuments();
  if (!countProduct) {
    res.status(500).json({ success: false });
  }
  res.send({
    countProduct: countProduct,
  });
});


//check features
router.get('/get/Featured/:count', async (req, res) => {
  const count = req.params.count ? req.params.count : 0;
  const product = await Product.find({ isFeatures: true }).limit(+count);
  if (!product) {
    res.status(500).json({ success: false });
  }
  res.send(product);
});


router.put(
  'gallery-images/:id',
  uploadOptions.array('images', 10),
  async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
      res.status(400).send('Invalid Product ID');
    }
    const files = req.files;
    //array of images[]
    let imagesPaths = [];
    const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;

    if (files) {
      files.map((file) => {
        imagesPaths.push(`${basePath}${file.fileName}`);
      });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      {
        images: imagesPaths,
      },
      { new: true }
    );

    if (!product) {
      return res.status(500).send('the product is not updated');
    }
    res.send(product);
  }
);

module.exports = router;
