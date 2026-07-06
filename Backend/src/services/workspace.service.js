import mongoose from "mongoose";
import WorkspaceModel from "../models/workspace.model.js";
import SubjectModel from "../models/subject.model.js";
import { ApiError } from "../utils/api-error.js";

const SORT_MAP = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  updated: { updatedAt: -1 },
  title_asc: { title: 1 },
  title_desc: { title: -1 },
};

function assertObjectId(id, label) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, `${label} is invalid`);
  }
}

function normalizePagination(query) {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 50);
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

function duplicateTitleError(error, message) {
  if (error?.code === 11000) {
    throw new ApiError(409, message);
  }

  throw error;
}

export async function createWorkspace(ownerId, payload) {
  try {
    const workspace = await WorkspaceModel.create({
      owner: ownerId,
      title: payload.title,
      description: payload.description,
      color: payload.color,
      icon: payload.icon,
      coverImage: payload.coverImage,
    });

    return workspace;
  } catch (error) {
    duplicateTitleError(error, "Workspace title already exists");
  }
}

export async function listUserWorkspaces(ownerId, query, archived = false) {
  const { page, limit, skip } = normalizePagination(query);
  const sort = SORT_MAP[query.sort] || SORT_MAP.updated;

  const filter = {
    owner: ownerId,
    isArchived: archived,
  };

  if (query.search) {
    filter.title = { $regex: query.search.trim(), $options: "i" };
  }

  const [items, total] = await Promise.all([
    WorkspaceModel.find(filter).sort(sort).skip(skip).limit(limit),
    WorkspaceModel.countDocuments(filter),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}

export async function getOwnedWorkspace(ownerId, workspaceId, options = {}) {
  assertObjectId(workspaceId, "Workspace id");

  const filter = {
    _id: workspaceId,
    owner: ownerId,
  };

  if (!options.includeArchived) {
    filter.isArchived = false;
  }

  const workspace = await WorkspaceModel.findOne(filter);

  if (!workspace) {
    throw new ApiError(404, "Workspace not found");
  }

  return workspace;
}

export async function updateWorkspace(ownerId, workspaceId, payload) {
  const workspace = await getOwnedWorkspace(ownerId, workspaceId, {
    includeArchived: true,
  });

  const allowedFields = ["title", "description", "color", "icon", "coverImage"];
  allowedFields.forEach((field) => {
    if (payload[field] !== undefined) {
      workspace[field] = payload[field];
    }
  });

  try {
    await workspace.save();
    return workspace;
  } catch (error) {
    duplicateTitleError(error, "Workspace title already exists");
  }
}

export async function deleteWorkspace(ownerId, workspaceId) {
  const workspace = await getOwnedWorkspace(ownerId, workspaceId, {
    includeArchived: true,
  });

  await SubjectModel.deleteMany({ workspace: workspace._id });
  await WorkspaceModel.deleteOne({ _id: workspace._id });
}

export async function archiveWorkspace(ownerId, workspaceId) {
  const workspace = await getOwnedWorkspace(ownerId, workspaceId, {
    includeArchived: true,
  });

  workspace.isArchived = true;
  await workspace.save();

  return workspace;
}

export async function restoreWorkspace(ownerId, workspaceId) {
  const workspace = await getOwnedWorkspace(ownerId, workspaceId, {
    includeArchived: true,
  });

  workspace.isArchived = false;
  await workspace.save();

  return workspace;
}

export function toWorkspaceResponse(workspace) {
  return {
    id: workspace._id,
    owner: workspace.owner,
    title: workspace.title,
    description: workspace.description,
    color: workspace.color,
    icon: workspace.icon,
    coverImage: workspace.coverImage,
    isArchived: workspace.isArchived,
    createdAt: workspace.createdAt,
    updatedAt: workspace.updatedAt,
  };
}
