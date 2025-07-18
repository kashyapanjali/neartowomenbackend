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

const orderRoute = require('./routes/orderRoute');
const cartRoute = require('./routes/cartRoute');
const purchaseRoute = require('./routes/purchaseRoute');
const rateLimit = require('express-rate-limit');
const upiPaymentRoute = require('./routes/upiPaymentRoute');

dotenv.config();
const app = express();

// CORS configuration
app.use(cors());
app.options('*', cors());

// Body parser middleware
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Other middleware
app.use(morgan('tiny'));
app.use(authJwt());
app.use('/public/uploads', express.static(__dirname + '/public/uploads'));
app.use(errorHandler);

const url = process.env.API_URL || '/api'; // Default fallback if API_URL is undefined

connectDB();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use(limiter);

// Routes
app.use(`${url}/products`, productRoute);
app.use(`${url}/category`, categoryRoute);
app.use(`${url}/users`, userRoute);
app.use(`${url}/orders`, orderRoute);
app.use(`${url}/cart`, cartRoute);
app.use(`${url}/purchase`, purchaseRoute);
app.use(`${url}/upi-payments`, upiPaymentRoute);

// app.get(`${url}/name`, (req, res) => {
// 	res.send("Hello APIS");
// });
// app.post(`${url}/name`, (req, res) => {
// 	const newProduct = req.body;
// 	console.log(newProduct);
// 	res.send(newProduct);
// });

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`App is running on http://localhost:${PORT}`);
});
