const express = require('express');
const { Product } = require('../models/productSchema');
const { Category } = require('../models/categorySchema');
const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');

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
    const fileName = file.originalname.split(' ').join('-'); //fetch image by suffix and prefix name
    const extension = FILE_TYPE_MAP[file.mimetype]; //this is define the image of extension so that image validate clearly
    cb(null, `${fileName}-${Date.now()}.${extension}`);
  },
});

const uploadOptions = multer({ storage: storage });

//model router
//add the product
router.post('/', uploadOptions.single('image'), async (req, res) => {
  try {
    const category = await Category.findById(req.body.category);
    if (!category) return res.status(400).send('Invalid Category');

    const file = req.file;
    if (!file) return res.status(400).send('No image in the request');

    const fileName = req.file.filename;
    const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;
    
    const product = new Product({
      name: req.body.name,
      description: req.body.description,
      image: `${basePath}${fileName}`,
      price: req.body.price,
      category: req.body.category,
      countInStock: req.body.countInStock,
      productType: req.body.productType,
      isAvailable: req.body.isAvailable,
      discount: req.body.discount
    });

    const savedProduct = await product.save();
    if (!savedProduct) {
      return res.status(500).send('The product cannot be created');
    }
    
    res.status(201).json({
      message: 'Product added successfully!',
      product: savedProduct,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Route to get all products
router.get('/', async (req, res) => {
  try {
    //localhost:3000/api/v1/products?categories=2342342,234234
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
router.delete('/:id', async (req, res) => {
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
router.put('/:id', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).send('Invalid Product ID');
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
        price: req.body.price,
        category: req.body.category,
        countInStock: req.body.countInStock,
        productType: req.body.productType,
        isAvailable: req.body.isAvailable,
        discount: req.body.discount
      },
      { new: true }
    );
    if (!updatedProduct) {
      return res.status(500).send({ message: 'Product cannot be updated' });
    }
    res.status(200).send(updatedProduct);
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

// Quick commerce specific routes
router.get('/quick-delivery', async (req, res) => {
  try {
    const products = await Product.find({
      isAvailable: true,
      isExpressDelivery: true
    }).populate('category');
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/subscription-available', async (req, res) => {
  try {
    const products = await Product.find({
      isSubscriptionAvailable: true
    }).populate('category');
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/on-sale', async (req, res) => {
  try {
    const products = await Product.find({
      discount: { $gt: 0 },
      discountEndDate: { $gt: new Date() }
    }).populate('category');
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add product review
router.post('/:id/reviews', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const review = {
      user: req.body.userId,
      rating: req.body.rating,
      comment: req.body.comment
    };

    product.reviews.push(review);
    
    // Update product rating
    const totalRating = product.reviews.reduce((acc, item) => acc + item.rating, 0);
    product.rating = totalRating / product.reviews.length;
    product.numReviews = product.reviews.length;

    await product.save();
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get products by type
router.get('/type/:type', async (req, res) => {
  try {
    const products = await Product.find({
      productType: req.params.type
    }).populate('category');
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search products
router.get('/search/:query', async (req, res) => {
  try {
    const searchQuery = req.params.query;
    const products = await Product.find({
      $or: [
        { name: { $regex: searchQuery, $options: 'i' } },
        { description: { $regex: searchQuery, $options: 'i' } },
        { brand: { $regex: searchQuery, $options: 'i' } }
      ]
    }).populate('category');
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
