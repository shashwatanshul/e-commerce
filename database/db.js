import mongoose from "mongoose";

const connectDB = async () => {
    // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    if (mongoose.connection.readyState >= 1) {
        return;
    }
    try {
        await mongoose.connect(`${process.env.MONGO_URI}/Ekart`);
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.log("MongoDB connection failed", error);
    }
}

export default connectDB;