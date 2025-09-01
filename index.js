const express = require('express');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const connectDB = require('./config/db');
const cors = require('cors');
const productRoute = require('./routes/productRoute');
const categoryRoute = require('./routes/categoryRoute');
const userRoute = require('./routes/userRoute');
const authJwt = require('./helpers/jwt');
const errorHandler = require('./helpers/error-handler');
const { limiter, authLimiter, apiLimiter } = require('./helpers/ratelimit');

const orderRoute = require('./routes/orderRoute');
const cartRoute = require('./routes/cartRoute');
const purchaseRoute = require('./routes/purchaseRoute');
const upiPaymentRoute = require('./routes/upiPaymentRoute');
// const userFeaturesRoute = require('./routes/userFeaturesRoute');

dotenv.config();
const app = express();

//for testing
console.log('RAZORPAY_KEY_ID:', process.env.RAZORPAY_KEY_ID);
console.log('RAZORPAY_KEY_SECRET:', process.env.RAZORPAY_KEY_SECRET);
// CORS configuration
app.use(cors());
app.options('*', cors());

// Body parser middleware
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Other middleware
app.use(morgan('tiny'));
app.use('/public/uploads', express.static(__dirname + '/public/uploads'));

// Apply JWT authentication middleware
app.use(authJwt());

const url = process.env.API_URL || '/api'; // Default fallback if API_URL is undefined

connectDB();

// Apply rate limiting
app.use(limiter); // Global rate limit

// Routes with specific rate limits
app.use(`${url}/users`, authLimiter, userRoute);
app.use(`${url}/products`, apiLimiter, productRoute);
app.use(`${url}/category`, apiLimiter, categoryRoute);
app.use(`${url}/orders`, apiLimiter, orderRoute);
app.use(`${url}/cart`, apiLimiter, cartRoute);
app.use(`${url}/purchase`, apiLimiter, purchaseRoute);
app.use(`${url}/upi-payments`, apiLimiter, upiPaymentRoute);

// Debug route to test if server is working
app.get(`${url}/test`, (req, res) => {
  res.json({ message: 'API is working!' });
});

// Error handler middleware - Apply AFTER routes
app.use(errorHandler);

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`App is running on http://localhost:${PORT}`);
  console.log(`API URL: ${url}`);
});