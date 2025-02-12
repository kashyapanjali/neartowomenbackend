const express = require("express");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const connectDB = require("./config/db");
const cors = require("cors");
const productRoute = require("./routes/productRoute");

dotenv.config();
const app = express();

app.use(bodyParser.json());
app.use(cors()); // Enables CORS
app.use(morgan("tiny"));

const url = process.env.API_URL; // Default fallback if API_URL is undefined

connectDB();

app.use(`${url}/`, productRoute);

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
