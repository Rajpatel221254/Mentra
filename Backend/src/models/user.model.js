import mongoose from "mongoose";
import bcrypt from "bcrypt";

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
      required: true
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
      select: false,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    avatar: {
      type: String,
      default: null,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    provider: {
      type: String,
      enum: ["local", "google", "local_google"],
      default: "local",
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

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = function (candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};


const userModel = mongoose.model("user", userSchema);

export default userModel;
