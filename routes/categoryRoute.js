const express = require("express");
const { Category } = require("../models/categorySchema");
const router = express.Router();

router.get("/getcategory", async (req, res) => {
	const categoryList = await Category.find();
	if (!categoryList) {
		return res.status(500).json({ succes: false });
	}
	res.send(categoryList);
});

router.post("/addcategory", async (req, res) => {
	let category = new Category({
		name: req.body.name,
		color: req.body.color,
		icon: req.body.icon,
		image: req.body.image,
	});
	category = await category.save();

	if (!category) {
		return res.status(404).send("the category cannot be created!");
	}
	res.send(category);
});

//delete category
router.delete("/deletecategory/:id", async (req, res) => {
	try {
		const deleteCategory = await Category.findByIdAndDelete(req.params.id);
		if (deleteCategory) {
			return res
				.status(200)
				.json({ success: true, message: "the category is deleted" });
		} else {
			return res
				.status(404)
				.json({ success: false, message: "category not found" });
		}
	} catch (err) {
		return res.status(500).json({ success: false, message: err.message });
	}
});

module.exports = router;
