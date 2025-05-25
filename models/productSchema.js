const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String, 
    required: true 
  },
  image: { 
    type: String, 
    default: '' 
  },
  price: { 
    type: Number, 
    required: true 
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  countInStock: { 
    type: Number, 
    required: true, 
    min: 0, 
    max: 255 
  },
  // Basic product type for women's products
  productType: {
    type: String,
    enum: ['menstrual', 'supplement', 'makeup', 'skincare', 'haircare', 'hygiene'],
    required: true
  },
  // Basic delivery info
  isAvailable: { 
    type: Boolean, 
    default: true 
  },
  // Basic discount
  discount: { 
    type: Number, 
    default: 0 
  },
  dateCreated: { 
    type: Date, 
    default: Date.now 
  }
});

productSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

productSchema.set('toJSON', {
  virtuals: true
});

const Product = mongoose.model('Product', productSchema);
module.exports = { Product };
