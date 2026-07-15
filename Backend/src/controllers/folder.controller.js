import {
  createFolder,
  renameFolder,
  deleteFolder,
  moveFolder,
  getFolder,
  getFolderTree,
  reorderFolders,
  toFolderResponse,
} from "../services/folder.service.js";
import { asyncHandler } from "../utils/async-handler.js";

export const createFolderController = asyncHandler(async (req, res) => {
  const folder = await createFolder(req.user._id, req.body);

  res.status(201).json({
    success: true,
    message: "Folder created successfully",
    folder: toFolderResponse(folder),
  });
});

export const getFolderController = asyncHandler(async (req, res) => {
  const result = await getFolder(req.user._id, req.params.id);

  res.status(200).json({
    success: true,
    folder: result,
  });
});

export const renameFolderController = asyncHandler(async (req, res) => {
  const folder = await renameFolder(req.user._id, req.params.id, req.body.title);

  res.status(200).json({
    success: true,
    message: "Folder renamed successfully",
    folder: toFolderResponse(folder),
  });
});

export const deleteFolderController = asyncHandler(async (req, res) => {
  await deleteFolder(req.user._id, req.params.id);

  res.status(200).json({
    success: true,
    message: "Folder deleted successfully",
  });
});

export const moveFolderController = asyncHandler(async (req, res) => {
  const folder = await moveFolder(
    req.user._id,
    req.params.id,
    req.body.targetParentId || null,
  );

  res.status(200).json({
    success: true,
    message: "Folder moved successfully",
    folder: toFolderResponse(folder),
  });
});

export const getFolderTreeController = asyncHandler(async (req, res) => {
  const tree = await getFolderTree(req.user._id, req.params.subjectId);

  res.status(200).json({
    success: true,
    tree,
  });
});

export const reorderFoldersController = asyncHandler(async (req, res) => {
  const folders = await reorderFolders(
    req.user._id,
    req.body.subjectId,
    req.body.parentFolderId || null,
    req.body.folders,
  );

  res.status(200).json({
    success: true,
    message: "Folders reordered successfully",
    folders: folders.map(toFolderResponse),
  });
});
