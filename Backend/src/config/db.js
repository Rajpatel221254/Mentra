import mongoose from "mongoose";
import { config } from "./config";

export const connectToDB = async ()=>{
    await mongoose.connect(
      config.MONGO_URL,
    );
    console.log("Database connected");
}