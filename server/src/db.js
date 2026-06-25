import mongoose from "mongoose";

export async function connectDb(uri) {
  if (!uri) {
    console.warn("MONGO_URI is not set. Search history is disabled.");
    return;
  }

  try {
    await mongoose.connect(uri);
    console.log("MongoDB connected");
  } catch (error) {
    console.warn("MongoDB connection failed. Search history is disabled.");
    console.warn(error.message);
  }
}
