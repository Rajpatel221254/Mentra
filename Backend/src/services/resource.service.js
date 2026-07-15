import mongoose from "mongoose";
import ResourceModel from "../models/resource.model.js";
import { getOwnedSubject } from "./subject.service.js";
import { ApiError } from "../utils/api-error.js";
import { RESOURCE_SORT_MAP } from "../constants/learning.constants.js";

// ── Helpers ────────────────────────────────────────────────────────

function assertObjectId(id, label) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, `${label} is invalid`);
  }
}

function normalizePagination(query) {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 50);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

// ── Ownership ──────────────────────────────────────────────────────

/**
 * Validate the full ownership chain: User → Workspace → Subject → Folder → Resource.
 */
export async function getOwnedResource(ownerId, resourceId) {
  assertObjectId(resourceId, "Resource id");

  const resource = await ResourceModel.findById(resourceId);
  if (!resource) {
    throw new ApiError(404, "Resource not found");
  }

  if (resource.owner.toString() !== ownerId.toString()) {
    throw new ApiError(403, "You do not have access to this resource");
  }

  // Validate subject → workspace → owner chain
  await getOwnedSubject(ownerId, resource.subject);

  return resource;
}

// ── Search ─────────────────────────────────────────────────────────

/**
 * Full-text search within a single subject.
 * Supports filtering by type, tags, and text query on title + tags.
 */
export async function searchResources(ownerId, subjectId, query) {
  const subject = await getOwnedSubject(ownerId, subjectId);
  const { page, limit, skip } = normalizePagination(query);
  const sort = RESOURCE_SORT_MAP[query.sort] || RESOURCE_SORT_MAP.updated;

  const filter = {
    subject: subject._id,
    isArchived: false,
  };

  // Text search
  if (query.q && query.q.trim()) {
    filter.$text = { $search: query.q.trim() };
  }

  // Type filter
  if (query.type) {
    filter.type = query.type.toUpperCase();
  }

  // Tags filter (match any of the provided tags)
  if (query.tags) {
    const tagList = Array.isArray(query.tags)
      ? query.tags
      : query.tags.split(",").map((t) => t.trim()).filter(Boolean);

    if (tagList.length) {
      filter.tags = { $in: tagList };
    }
  }

  // Favorite filter
  if (query.favorite === "true") {
    filter.isFavorite = true;
  }

  const [items, total] = await Promise.all([
    ResourceModel.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    ResourceModel.countDocuments(filter),
  ]);

  return {
    items: items.map(toResourceResponse),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}

// ── Response Mapper ────────────────────────────────────────────────

export function toResourceResponse(resource) {
  const base = {
    id: resource._id,
    owner: resource.owner,
    workspace: resource.workspace,
    subject: resource.subject,
    folder: resource.folder,
    type: resource.type,
    title: resource.title,
    description: resource.description,
    isFavorite: resource.isFavorite,
    isArchived: resource.isArchived,
    tags: resource.tags,
    order: resource.order,
    createdAt: resource.createdAt,
    updatedAt: resource.updatedAt,
  };

  if (resource.type === "NOTE") {
    base.editorType = resource.editorType;
    base.coverImage = resource.coverImage;
    base.icon = resource.icon;
    base.wordCount = resource.wordCount;
    base.readingTime = resource.readingTime;
    base.lastEditedAt = resource.lastEditedAt;
  }

  if (resource.type === "FILE") {
    base.originalName = resource.originalName;
    base.storageKey = resource.storageKey;
    base.mimeType = resource.mimeType;
    base.extension = resource.extension;
    base.size = resource.size;
    base.thumbnail = resource.thumbnail;
    base.uploadedAt = resource.uploadedAt;
  }

  return base;
}
