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

dotenv.config();
const app = express();
app.use(cors()); // Enables CORS
app.options('*', cors());

//middleware
app.use(bodyParser.json());
app.use(morgan('tiny'));
app.use(authJwt());
app.use('/public/uploads', express.static(__dirname + '/public/uploads'));
app.use(errorHandler);

const url = process.env.API_URL; // Default fallback if API_URL is undefined

connectDB();

app.use(`${url}/products`, productRoute);
app.use(`${url}/category`, categoryRoute);
app.use(`${url}/users`, userRoute);
app.use(`${url}/orders`, orderRoute);

// app.get(`${url}/name`, (req, res) => {
// 	res.send("Hello API");
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
