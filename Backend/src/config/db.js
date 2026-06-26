import mongoose from "mongoose";

export const connectToDB = async ()=>{
    await mongoose.connect(
      "mongodb+srv://rajpatel221254_db_user:nY2MbE2JaXkNtYTQ@cluster0.dfdtjig.mongodb.net/",
    );
    console.log("Database connected");
}