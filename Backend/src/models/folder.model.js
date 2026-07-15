import mongoose from "mongoose";
import {
  ALLOWED_COLORS,
  ALLOWED_ICONS,
} from "../constants/learning.constants.js";

const folderSchema = new mongoose.Schema(
  {
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "subject",
      required: true,
      index: true,
    },
    parentFolder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "folder",
      default: null,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80,
    },
    color: {
      type: String,
      enum: ALLOWED_COLORS,
      default: "blue",
    },
    icon: {
      type: String,
      enum: ALLOWED_ICONS,
      default: "folder",
    },
    order: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  { timestamps: true },
);

// Prevent duplicate folder names inside the same parent
folderSchema.index(
  { subject: 1, parentFolder: 1, title: 1 },
  { unique: true, collation: { locale: "en", strength: 2 } },
);

// Sorted listing within a parent
folderSchema.index({ subject: 1, parentFolder: 1, order: 1, createdAt: 1 });

// Dashboard — recent folders by owner
folderSchema.index({ owner: 1, updatedAt: -1 });

const FolderModel = mongoose.model("folder", folderSchema);

export default FolderModel;
