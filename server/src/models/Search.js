import mongoose from "mongoose";

const searchSchema = new mongoose.Schema(
  {
    city: {
      type: String,
      required: true,
      trim: true
    },
    country: {
      type: String,
      trim: true,
      default: ""
    }
  },
  { timestamps: true }
);

export const Search = mongoose.model("Search", searchSchema);
