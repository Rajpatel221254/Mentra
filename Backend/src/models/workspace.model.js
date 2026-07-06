import mongoose from "mongoose";
import {
  ALLOWED_COLORS,
  ALLOWED_ICONS,
} from "../constants/learning.constants.js";

const workspaceSchema = new mongoose.Schema(
  {
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
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    color: {
      type: String,
      enum: ALLOWED_COLORS,
      default: "blue",
    },
    icon: {
      type: String,
      enum: ALLOWED_ICONS,
      default: "book-open",
    },
    coverImage: {
      type: String,
      default: null,
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true },
);

workspaceSchema.index(
  { owner: 1, title: 1 },
  { unique: true, collation: { locale: "en", strength: 2 } },
);
workspaceSchema.index({ owner: 1, isArchived: 1, updatedAt: -1 });
workspaceSchema.index({ owner: 1, title: "text" });

const WorkspaceModel = mongoose.model("workspace", workspaceSchema);

export default WorkspaceModel;
