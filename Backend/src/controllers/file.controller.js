import {
  uploadFile,
  getFile,
  deleteFile,
  renameFile,
  moveFile,
  getFileDownloadUrl,
  toggleFileFavorite,
  archiveFile,
  restoreFile,
  toFileResponse,
} from "../services/file.service.js";
import { asyncHandler } from "../utils/async-handler.js";

export const uploadFileController = asyncHandler(async (req, res) => {
  // Parse tags from multipart form data (may arrive as JSON string)
  if (typeof req.body.tags === "string") {
    try {
      req.body.tags = JSON.parse(req.body.tags);
    } catch {
      req.body.tags = [];
    }
  }

  const file = await uploadFile(req.user._id, req.body, req.file);

  res.status(201).json({
    success: true,
    message: "File uploaded successfully",
    resource: toFileResponse(file),
  });
});

export const getFileController = asyncHandler(async (req, res) => {
  const file = await getFile(req.user._id, req.params.id);

  res.status(200).json({
    success: true,
    resource: toFileResponse(file),
  });
});

export const deleteFileController = asyncHandler(async (req, res) => {
  await deleteFile(req.user._id, req.params.id);

  res.status(200).json({
    success: true,
    message: "File deleted successfully",
  });
});

export const renameFileController = asyncHandler(async (req, res) => {
  const file = await renameFile(req.user._id, req.params.id, req.body.title);

  res.status(200).json({
    success: true,
    message: "File renamed successfully",
    resource: toFileResponse(file),
  });
});

export const moveFileController = asyncHandler(async (req, res) => {
  const file = await moveFile(req.user._id, req.params.id, req.body.targetFolderId);

  res.status(200).json({
    success: true,
    message: "File moved successfully",
    resource: toFileResponse(file),
  });
});

export const getFileDownloadUrlController = asyncHandler(async (req, res) => {
  const result = await getFileDownloadUrl(req.user._id, req.params.id);

  res.status(200).json({
    success: true,
    download: result,
  });
});

export const toggleFileFavoriteController = asyncHandler(async (req, res) => {
  const file = await toggleFileFavorite(req.user._id, req.params.id);

  res.status(200).json({
    success: true,
    message: file.isFavorite ? "File added to favorites" : "File removed from favorites",
    resource: toFileResponse(file),
  });
});

export const archiveFileController = asyncHandler(async (req, res) => {
  const file = await archiveFile(req.user._id, req.params.id);

  res.status(200).json({
    success: true,
    message: "File archived successfully",
    resource: toFileResponse(file),
  });
});

export const restoreFileController = asyncHandler(async (req, res) => {
  const file = await restoreFile(req.user._id, req.params.id);

  res.status(200).json({
    success: true,
    message: "File restored successfully",
    resource: toFileResponse(file),
  });
});
