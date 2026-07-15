import mongoose from "mongoose";
import FolderModel from "../models/folder.model.js";
import ResourceModel from "../models/resource.model.js";
import { getOwnedSubject } from "./subject.service.js";
import storageService from "./storage.service.js";
import { ApiError } from "../utils/api-error.js";
import { MAX_FOLDER_DEPTH } from "../constants/learning.constants.js";

// ── Helpers ────────────────────────────────────────────────────────

function assertObjectId(id, label) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, `${label} is invalid`);
  }
}

function duplicateTitleError(error) {
  if (error?.code === 11000) {
    throw new ApiError(409, "A folder with this name already exists in the same location");
  }
  throw error;
}

/**
 * Walk up the parentFolder chain and return the depth.
 * Also returns the ancestor IDs (used for circular-reference checks).
 */
async function getAncestorChain(folderId) {
  const ancestors = [];
  let currentId = folderId;

  while (currentId) {
    if (ancestors.length >= MAX_FOLDER_DEPTH) {
      throw new ApiError(422, `Folder nesting cannot exceed ${MAX_FOLDER_DEPTH} levels`);
    }

    const folder = await FolderModel.findById(currentId).select("parentFolder").lean();
    if (!folder) break;

    ancestors.push(folder._id.toString());
    currentId = folder.parentFolder;
  }

  return ancestors;
}

// ── Ownership ──────────────────────────────────────────────────────

/**
 * Validate the full ownership chain: User → Workspace → Subject → Folder.
 * Returns the folder document.
 */
export async function getOwnedFolder(ownerId, folderId) {
  assertObjectId(folderId, "Folder id");

  const folder = await FolderModel.findById(folderId);
  if (!folder) {
    throw new ApiError(404, "Folder not found");
  }

  if (folder.owner.toString() !== ownerId.toString()) {
    throw new ApiError(403, "You do not have access to this folder");
  }

  // Validate subject → workspace → owner chain
  await getOwnedSubject(ownerId, folder.subject);

  return folder;
}

// ── CRUD ───────────────────────────────────────────────────────────

export async function createFolder(ownerId, payload) {
  const subject = await getOwnedSubject(ownerId, payload.subject);

  // If creating inside a parent, validate the parent
  let parentFolder = null;
  if (payload.parentFolder) {
    const parent = await getOwnedFolder(ownerId, payload.parentFolder);

    // Parent must belong to the same subject
    if (parent.subject.toString() !== subject._id.toString()) {
      throw new ApiError(422, "Parent folder does not belong to this subject");
    }

    // Check depth
    const ancestors = await getAncestorChain(parent._id);
    if (ancestors.length >= MAX_FOLDER_DEPTH) {
      throw new ApiError(422, `Folder nesting cannot exceed ${MAX_FOLDER_DEPTH} levels`);
    }

    parentFolder = parent._id;
  }

  try {
    const folder = await FolderModel.create({
      subject: subject._id,
      parentFolder,
      owner: ownerId,
      title: payload.title,
      color: payload.color,
      icon: payload.icon,
      order: payload.order,
    });

    return folder;
  } catch (error) {
    duplicateTitleError(error);
  }
}

export async function renameFolder(ownerId, folderId, title) {
  const folder = await getOwnedFolder(ownerId, folderId);
  folder.title = title;

  try {
    await folder.save();
    return folder;
  } catch (error) {
    duplicateTitleError(error);
  }
}

export async function getFolder(ownerId, folderId) {
  const folder = await getOwnedFolder(ownerId, folderId);

  // Fetch direct children (subfolders + resources) in parallel
  const [subfolders, resources] = await Promise.all([
    FolderModel.find({ parentFolder: folder._id })
      .sort({ order: 1, createdAt: 1 })
      .lean(),
    ResourceModel.find({ folder: folder._id, isArchived: false })
      .sort({ order: 1, createdAt: 1 })
      .lean(),
  ]);

  return {
    ...folder.toObject(),
    subfolders: subfolders.map(toFolderResponse),
    resources: resources.map(toResourceSummary),
  };
}

// ── Delete (recursive cascade) ─────────────────────────────────────

/**
 * Collect all descendant folder IDs recursively.
 */
async function collectDescendantIds(folderId) {
  const ids = [];
  const queue = [folderId];

  while (queue.length) {
    const currentId = queue.shift();
    const children = await FolderModel.find({ parentFolder: currentId })
      .select("_id")
      .lean();

    for (const child of children) {
      ids.push(child._id);
      queue.push(child._id);
    }
  }

  return ids;
}

export async function deleteFolder(ownerId, folderId) {
  const folder = await getOwnedFolder(ownerId, folderId);

  // Collect this folder + all descendants
  const descendantIds = await collectDescendantIds(folder._id);
  const allFolderIds = [folder._id, ...descendantIds];

  // Delete S3 files for FILE resources in all affected folders
  const fileResources = await ResourceModel.find({
    folder: { $in: allFolderIds },
    type: "FILE",
    storageKey: { $ne: null },
  }).select("storageKey");

  await Promise.allSettled(
    fileResources.map((r) => storageService.deleteFile(r.storageKey)),
  );

  // Delete all resources in these folders, then the folders themselves
  await ResourceModel.deleteMany({ folder: { $in: allFolderIds } });
  await FolderModel.deleteMany({ _id: { $in: allFolderIds } });
}

// ── Move ───────────────────────────────────────────────────────────

export async function moveFolder(ownerId, folderId, targetParentId) {
  const folder = await getOwnedFolder(ownerId, folderId);

  // null means move to root of the subject
  let newParent = null;

  if (targetParentId) {
    assertObjectId(targetParentId, "Target parent folder id");

    // Cannot move to itself
    if (targetParentId === folderId) {
      throw new ApiError(422, "A folder cannot be moved into itself");
    }

    const targetParent = await getOwnedFolder(ownerId, targetParentId);

    // Must be same subject
    if (targetParent.subject.toString() !== folder.subject.toString()) {
      throw new ApiError(422, "Target folder must be in the same subject");
    }

    // Circular reference check: walk up from target to see if we hit the moving folder
    const ancestors = await getAncestorChain(targetParent._id);
    if (ancestors.includes(folder._id.toString())) {
      throw new ApiError(422, "Cannot move a folder into one of its own subfolders");
    }

    // Depth check: moving folder's subtree depth + target depth must not exceed max
    const targetDepth = ancestors.length;
    const subtreeDepth = await getMaxSubtreeDepth(folder._id);
    if (targetDepth + subtreeDepth + 1 > MAX_FOLDER_DEPTH) {
      throw new ApiError(
        422,
        `Moving this folder would exceed the maximum nesting depth of ${MAX_FOLDER_DEPTH}`,
      );
    }

    newParent = targetParent._id;
  }

  folder.parentFolder = newParent;

  try {
    await folder.save();
    return folder;
  } catch (error) {
    duplicateTitleError(error);
  }
}

/**
 * Get the maximum depth of a folder's subtree.
 */
async function getMaxSubtreeDepth(folderId) {
  let maxDepth = 0;
  const queue = [{ id: folderId, depth: 0 }];

  while (queue.length) {
    const { id, depth } = queue.shift();
    const children = await FolderModel.find({ parentFolder: id })
      .select("_id")
      .lean();

    for (const child of children) {
      const childDepth = depth + 1;
      if (childDepth > maxDepth) maxDepth = childDepth;
      queue.push({ id: child._id, depth: childDepth });
    }
  }

  return maxDepth;
}

// ── Reorder ────────────────────────────────────────────────────────

export async function reorderFolders(ownerId, subjectId, parentFolderId, folders) {
  const subject = await getOwnedSubject(ownerId, subjectId);

  const folderIds = folders.map((f) => f.id);
  if (new Set(folderIds).size !== folderIds.length) {
    throw new ApiError(422, "Duplicate folder ids are not allowed");
  }

  folderIds.forEach((id) => assertObjectId(id, "Folder id"));

  const parentFilter = parentFolderId || null;

  const ownedCount = await FolderModel.countDocuments({
    _id: { $in: folderIds },
    subject: subject._id,
    parentFolder: parentFilter,
    owner: ownerId,
  });

  if (ownedCount !== folderIds.length) {
    throw new ApiError(403, "One or more folders do not belong to this location");
  }

  await Promise.all(
    folders.map((f) =>
      FolderModel.updateOne(
        { _id: f.id },
        { $set: { order: f.order } },
      ),
    ),
  );

  return FolderModel.find({
    subject: subject._id,
    parentFolder: parentFilter,
  }).sort({ order: 1, createdAt: 1 });
}

// ── Tree ───────────────────────────────────────────────────────────

/**
 * Build the full folder tree for a subject in two queries:
 *   1. All folders in the subject
 *   2. All non-archived resources in the subject
 * Then assemble in memory — O(n) regardless of depth.
 */
export async function getFolderTree(ownerId, subjectId) {
  const subject = await getOwnedSubject(ownerId, subjectId);

  const [folders, resources] = await Promise.all([
    FolderModel.find({ subject: subject._id })
      .sort({ order: 1, createdAt: 1 })
      .lean(),
    ResourceModel.find({ subject: subject._id, isArchived: false })
      .sort({ order: 1, createdAt: 1 })
      .lean(),
  ]);

  // Build a map: folderId → node
  const nodeMap = new Map();
  for (const folder of folders) {
    nodeMap.set(folder._id.toString(), {
      ...toFolderResponse(folder),
      subfolders: [],
      resources: [],
    });
  }

  // Attach resources to their folder nodes
  for (const resource of resources) {
    const node = nodeMap.get(resource.folder.toString());
    if (node) {
      node.resources.push(toResourceSummary(resource));
    }
  }

  // Build tree by linking children to parents
  const rootFolders = [];
  const rootResources = [];

  for (const folder of folders) {
    const node = nodeMap.get(folder._id.toString());
    const parentId = folder.parentFolder ? folder.parentFolder.toString() : null;

    if (parentId && nodeMap.has(parentId)) {
      nodeMap.get(parentId).subfolders.push(node);
    } else {
      rootFolders.push(node);
    }
  }

  // Resources at subject root (folder-less) — shouldn't happen in normal flow
  // but handle gracefully
  for (const resource of resources) {
    if (!nodeMap.has(resource.folder.toString())) {
      rootResources.push(toResourceSummary(resource));
    }
  }

  return {
    subject: {
      id: subject._id,
      title: subject.title,
      color: subject.color,
      icon: subject.icon,
    },
    folders: rootFolders,
    resources: rootResources,
  };
}

// ── List ───────────────────────────────────────────────────────────

export async function listSubjectFolders(ownerId, subjectId) {
  const subject = await getOwnedSubject(ownerId, subjectId);

  return FolderModel.find({ subject: subject._id })
    .sort({ order: 1, createdAt: 1 })
    .lean()
    .then((folders) => folders.map(toFolderResponse));
}

// ── Response Mappers ───────────────────────────────────────────────

export function toFolderResponse(folder) {
  return {
    id: folder._id,
    subject: folder.subject,
    parentFolder: folder.parentFolder,
    title: folder.title,
    color: folder.color,
    icon: folder.icon,
    order: folder.order,
    createdAt: folder.createdAt,
    updatedAt: folder.updatedAt,
  };
}

function toResourceSummary(resource) {
  const base = {
    id: resource._id,
    type: resource.type,
    title: resource.title,
    description: resource.description,
    isFavorite: resource.isFavorite,
    tags: resource.tags,
    order: resource.order,
    createdAt: resource.createdAt,
    updatedAt: resource.updatedAt,
  };

  if (resource.type === "NOTE") {
    base.editorType = resource.editorType;
    base.wordCount = resource.wordCount;
    base.readingTime = resource.readingTime;
    base.lastEditedAt = resource.lastEditedAt;
    base.icon = resource.icon;
  }

  if (resource.type === "FILE") {
    base.originalName = resource.originalName;
    base.mimeType = resource.mimeType;
    base.extension = resource.extension;
    base.size = resource.size;
    base.uploadedAt = resource.uploadedAt;
  }

  return base;
}
