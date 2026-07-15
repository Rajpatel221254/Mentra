import mongoose from "mongoose";
import {
  RESOURCE_TYPES,
  EDITOR_TYPES,
} from "../constants/learning.constants.js";

const resourceSchema = new mongoose.Schema(
  {
    // ── Ownership & hierarchy ──────────────────────────────────
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
      index: true,
    },
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "workspace",
      required: true,
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "subject",
      required: true,
      index: true,
    },
    folder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "folder",
      required: true,
      index: true,
    },

    // ── Common fields ──────────────────────────────────────────
    type: {
      type: String,
      enum: RESOURCE_TYPES,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
    isFavorite: {
      type: Boolean,
      default: false,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: (v) => v.length <= 20,
        message: "A resource can have at most 20 tags",
      },
    },
    order: {
      type: Number,
      min: 0,
      default: 0,
    },

    // ── NOTE-specific fields ───────────────────────────────────
    content: {
      type: String,
      default: "",
    },
    editorType: {
      type: String,
      enum: EDITOR_TYPES,
      default: "richtext",
    },
    coverImage: {
      type: String,
      default: null,
    },
    icon: {
      type: String,
      default: null,
    },
    wordCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    readingTime: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastEditedAt: {
      type: Date,
      default: null,
    },

    // ── FILE-specific fields ───────────────────────────────────
    originalName: {
      type: String,
      default: null,
    },
    storageKey: {
      type: String,
      default: null,
    },
    mimeType: {
      type: String,
      default: null,
    },
    extension: {
      type: String,
      default: null,
    },
    size: {
      type: Number,
      default: null,
    },
    thumbnail: {
      type: String,
      default: null,
    },
    uploadedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

// ── Indexes ──────────────────────────────────────────────────────

// List resources in a folder (sorted)
resourceSchema.index({ folder: 1, type: 1, isArchived: 1, order: 1 });

// Subject-level queries (search, listing by type)
resourceSchema.index({ subject: 1, type: 1, isArchived: 1 });

// Dashboard — favorites
resourceSchema.index({ owner: 1, isFavorite: 1, isArchived: 1, updatedAt: -1 });

// Dashboard — recent resources by type
resourceSchema.index({ owner: 1, type: 1, isArchived: 1, updatedAt: -1 });

// Archived resources
resourceSchema.index({ owner: 1, isArchived: 1, updatedAt: -1 });

// Text search within a subject (title + tags)
resourceSchema.index(
  { title: "text", tags: "text" },
  { weights: { title: 10, tags: 5 } },
);

// Storage key lookup (for S3 deduplication checks)
resourceSchema.index(
  { storageKey: 1 },
  { sparse: true },
);

const ResourceModel = mongoose.model("resource", resourceSchema);

export default ResourceModel;
