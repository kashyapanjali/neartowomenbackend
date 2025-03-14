const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  richDescription: { type: String, default: '' },
  image: { type: String, default: '' },
  images: [{ type: String }], // Array of image URLs
  brand: { type: String, default: '' }, // Array of image URLs
  price: { type: Number, default: 0 },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  },
  countInStock: { type: Number, required: true, min: 0, max: 300 },
  rating: { type: Number, default: 0 },
  numReviews: { type: Number, default: 0 },
  isFeatures: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

productSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

productSchema.set('toJSON', {
  virtuals: true,
});

const Product = mongoose.model('Product', productSchema);

module.exports = { Product };
