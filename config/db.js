const mongoose = require("mongoose");

const connectDB = async () => {
	try {
		await mongoose.connect(process.env.MONGO_DB_ATLAS_URL, {
			dbName: "quick-shop",
		});
		console.log("MongoDB connected successfully");
	} catch (error) {
		console.error("MongoDB connection failed:", error);
		process.exit(1); // Exit process with failure
	}
};

module.exports = connectDB;
