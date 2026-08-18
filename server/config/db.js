import mongoose from "mongoose";

const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/reel-recommender";
        await mongoose.connect(mongoUri);
        console.log("MongoDB Connected");
    } catch (error) {
        console.error("MongoDB Error:", error.message);
        console.warn("Continuing without MongoDB persistence. Start local MongoDB to save runs.");
    }
};

export default connectDB;
