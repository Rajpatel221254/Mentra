import mongoose from "mongoose";
import {
  ALLOWED_COLORS,
  ALLOWED_ICONS,
} from "../constants/learning.constants.js";

const subjectSchema = new mongoose.Schema(
  {
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "workspace",
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
      default: "green",
    },
    icon: {
      type: String,
      enum: ALLOWED_ICONS,
      default: "notebook",
    },
    order: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  { timestamps: true },
);

subjectSchema.index(
  { workspace: 1, title: 1 },
  { unique: true, collation: { locale: "en", strength: 2 } },
);
subjectSchema.index({ workspace: 1, order: 1, createdAt: 1 });

const SubjectModel = mongoose.model("subject", subjectSchema);

export default SubjectModel;
