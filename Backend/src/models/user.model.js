import mongoose from "mongoose";

const userSchema = mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 20,
    },
    fullname: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    avatar: {
      type: String,
      default: null,
    },
    bio: {
      type: String,
      default: "",
      trim: true,
      maxlength: 250,
    },
    theme: {
      type: String,
      enum: ["dark", "light", "system"],
      default: "light",
    },
    timezone: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    lastLogin: {
      type: Date,
    },
  },
  { timestamps: true },
);

const userModel = mongoose.model("user", userSchema);

export default userModel;
