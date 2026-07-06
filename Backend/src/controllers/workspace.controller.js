import {
  archiveWorkspace,
  createWorkspace,
  deleteWorkspace,
  getOwnedWorkspace,
  listUserWorkspaces,
  restoreWorkspace,
  toWorkspaceResponse,
  updateWorkspace,
} from "../services/workspace.service.js";
import { asyncHandler } from "../utils/async-handler.js";

export const createWorkspaceController = asyncHandler(async (req, res) => {
  const workspace = await createWorkspace(req.user._id, req.body);

  res.status(201).json({
    success: true,
    message: "Workspace created successfully",
    workspace: toWorkspaceResponse(workspace),
  });
});

export const listWorkspacesController = asyncHandler(async (req, res) => {
  const result = await listUserWorkspaces(req.user._id, req.query, false);

  res.status(200).json({
    success: true,
    workspaces: result.items.map(toWorkspaceResponse),
    pagination: result.pagination,
  });
});

export const listArchivedWorkspacesController = asyncHandler(async (req, res) => {
  const result = await listUserWorkspaces(req.user._id, req.query, true);

  res.status(200).json({
    success: true,
    workspaces: result.items.map(toWorkspaceResponse),
    pagination: result.pagination,
  });
});

export const getWorkspaceController = asyncHandler(async (req, res) => {
  const workspace = await getOwnedWorkspace(req.user._id, req.params.id, {
    includeArchived: true,
  });

  res.status(200).json({
    success: true,
    workspace: toWorkspaceResponse(workspace),
  });
});

export const updateWorkspaceController = asyncHandler(async (req, res) => {
  const workspace = await updateWorkspace(req.user._id, req.params.id, req.body);

  res.status(200).json({
    success: true,
    message: "Workspace updated successfully",
    workspace: toWorkspaceResponse(workspace),
  });
});

export const deleteWorkspaceController = asyncHandler(async (req, res) => {
  await deleteWorkspace(req.user._id, req.params.id);

  res.status(200).json({
    success: true,
    message: "Workspace deleted successfully",
  });
});

export const archiveWorkspaceController = asyncHandler(async (req, res) => {
  const workspace = await archiveWorkspace(req.user._id, req.params.id);

  res.status(200).json({
    success: true,
    message: "Workspace archived successfully",
    workspace: toWorkspaceResponse(workspace),
  });
});

export const restoreWorkspaceController = asyncHandler(async (req, res) => {
  const workspace = await restoreWorkspace(req.user._id, req.params.id);

  res.status(200).json({
    success: true,
    message: "Workspace restored successfully",
    workspace: toWorkspaceResponse(workspace),
  });
});
