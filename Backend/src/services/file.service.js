import mongoose from "mongoose";
import path from "path";
import ResourceModel from "../models/resource.model.js";
import SubjectModel from "../models/subject.model.js";
import { getOwnedFolder } from "./folder.service.js";
import { getOwnedResource, toResourceResponse } from "./resource.service.js";
import storageService from "./storage.service.js";
import { ApiError } from "../utils/api-error.js";
import {
  ALLOWED_FILE_EXTENSIONS,
  RESOURCE_SORT_MAP,
} from "../constants/learning.constants.js";

// ── Helpers ────────────────────────────────────────────────────────

function normalizePagination(query) {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 50);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

// ── Upload ─────────────────────────────────────────────────────────

export async function uploadFile(ownerId, payload, multerFile) {
  if (!multerFile) {
    throw new ApiError(400, "No file provided");
  }

  const folder = await getOwnedFolder(ownerId, payload.folder);

  // Validate extension
  const ext = path.extname(multerFile.originalname).toLowerCase();
  if (!ALLOWED_FILE_EXTENSIONS.includes(ext)) {
    throw new ApiError(422, `File extension "${ext}" is not allowed`);
  }

  // Resolve workspace from subject
  const subject = await SubjectModel.findById(folder.subject)
    .select("workspace")
    .lean();

  // Upload to S3 via existing StorageService
  const s3Result = await storageService.uploadFile(
    multerFile,
    `resources/${ownerId}/${folder.subject}`,
  );

  const file = await ResourceModel.create({
    owner: ownerId,
    workspace: subject.workspace,
    subject: folder.subject,
    folder: folder._id,
    type: "FILE",
    title: payload.title || multerFile.originalname,
    description: payload.description || "",
    tags: payload.tags ? (Array.isArray(payload.tags) ? payload.tags : [payload.tags]) : [],
    originalName: multerFile.originalname,
    storageKey: s3Result.key,
    mimeType: multerFile.mimetype,
    extension: ext,
    size: multerFile.size,
    uploadedAt: new Date(),
    order: payload.order,
  });

  return file;
}

// ── Read ───────────────────────────────────────────────────────────

export async function getFile(ownerId, fileId) {
  const resource = await getOwnedResource(ownerId, fileId);

  if (resource.type !== "FILE") {
    throw new ApiError(400, "This resource is not a file");
  }

  return resource;
}

// ── Delete ─────────────────────────────────────────────────────────

export async function deleteFile(ownerId, fileId) {
  const file = await getFile(ownerId, fileId);

  // Delete from S3
  if (file.storageKey) {
    await storageService.deleteFile(file.storageKey).catch(() => {});
  }
  if (file.thumbnail) {
    await storageService.deleteFile(file.thumbnail).catch(() => {});
  }

  await ResourceModel.deleteOne({ _id: file._id });
}

// ── Rename ─────────────────────────────────────────────────────────

export async function renameFile(ownerId, fileId, title) {
  const file = await getFile(ownerId, fileId);
  file.title = title;
  await file.save();
  return file;
}

// ── Move ───────────────────────────────────────────────────────────

export async function moveFile(ownerId, fileId, targetFolderId) {
  const file = await getFile(ownerId, fileId);
  const targetFolder = await getOwnedFolder(ownerId, targetFolderId);

  // Must be same subject
  if (targetFolder.subject.toString() !== file.subject.toString()) {
    throw new ApiError(422, "Target folder must be in the same subject");
  }

  file.folder = targetFolder._id;
  await file.save();

  return file;
}

// ── Download (Signed URL) ──────────────────────────────────────────

export async function getFileDownloadUrl(ownerId, fileId) {
  const file = await getFile(ownerId, fileId);

  if (!file.storageKey) {
    throw new ApiError(404, "File storage key not found");
  }

  const url = await storageService.getSignedUrl(file.storageKey, 3600); // 1 hour

  return {
    url,
    originalName: file.originalName,
    mimeType: file.mimeType,
    size: file.size,
  };
}

// ── Favorite ───────────────────────────────────────────────────────

export async function toggleFileFavorite(ownerId, fileId) {
  const file = await getFile(ownerId, fileId);
  file.isFavorite = !file.isFavorite;
  await file.save();
  return file;
}

// ── Archive / Restore ──────────────────────────────────────────────

export async function archiveFile(ownerId, fileId) {
  const file = await getFile(ownerId, fileId);
  file.isArchived = true;
  await file.save();
  return file;
}

export async function restoreFile(ownerId, fileId) {
  const file = await getFile(ownerId, fileId);
  file.isArchived = false;
  await file.save();
  return file;
}

// ── List ───────────────────────────────────────────────────────────

export async function listFiles(ownerId, folderId, query) {
  const folder = await getOwnedFolder(ownerId, folderId);
  const { page, limit, skip } = normalizePagination(query);
  const sort = RESOURCE_SORT_MAP[query.sort] || RESOURCE_SORT_MAP.updated;

  const filter = {
    folder: folder._id,
    type: "FILE",
    isArchived: false,
  };

  // MIME type filter
  if (query.mimeType) {
    filter.mimeType = query.mimeType;
  }

  // Extension filter
  if (query.extension) {
    filter.extension = query.extension.startsWith(".")
      ? query.extension.toLowerCase()
      : `.${query.extension.toLowerCase()}`;
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

// ── Response ───────────────────────────────────────────────────────

export function toFileResponse(file) {
  return toResourceResponse(file.toObject ? file.toObject() : file);
}
