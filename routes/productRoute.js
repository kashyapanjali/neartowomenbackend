const express = require("express");
const Product = require("../models/productSchema");
const router = express.Router();

//model router
router.post("/addproduct", async (req, res) => {
	try {
		const product = new Product(req.body);
		await product.save();
		res.status(201).json({ message: "Product added successfully!", product });
	} catch (error) {
		res.status(400).json({ error: error.message });
	}
});

module.exports = router;
