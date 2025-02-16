const express = require("express");
const { Product } = require("../models/productSchema");
const router = express.Router();

//model router
//add the product
router.post("/addproduct", async (req, res) => {
	try {
		const product = new Product(req.body);
		await product.save();
		res.status(201).json({ message: "Product added successfully!", product });
	} catch (error) {
		res.status(400).json({ error: error.message });
	}
});

// Route to get all products
router.get("/getproducts", async (req, res) => {
	try {
		const products = await Product.find();
		res.status(200).json(products);
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
});

//find the product by id
router.get("/getproduct/:id", async (req, res) => {
	try {
		const product = await Product.findById(req.params.id);
		if (!product) {
			return res.status(404).json({ message: "Product not found" });
		}
		res.status(200).json(product);
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
});

//delete by id
router.delete("/deleteproduct/:id", async (req, res) => {
	try {
		const deleteProduct = await Product.findByIdAndDelete(req.params.id);
		if (!deleteProduct) {
			return res.status(404).json({ message: "Product not found" });
		}
		res.status(200).json({ message: "Product deleted" });
	} catch (err) {
		res.status(500).json({ message: "err.message" });
	}
});

// Route to update a product by ID
router.put("/updateproduct/:id", async (req, res) => {
	try {
		const updatedProduct = await Product.findByIdAndUpdate(
			req.params.id,
			req.body,
			{ new: true }
		);
		if (!updatedProduct) {
			return res.status(404).json({ message: "Product not found" });
		}
		res.status(200).json(updatedProduct); // Send the updated product as the response
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
});

module.exports = router;
