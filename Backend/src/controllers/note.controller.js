import {
  createNote,
  getNote,
  updateNote,
  deleteNote,
  moveNote,
  toggleNoteFavorite,
  archiveNote,
  restoreNote,
  toNoteResponse,
} from "../services/note.service.js";
import { asyncHandler } from "../utils/async-handler.js";

export const createNoteController = asyncHandler(async (req, res) => {
  const note = await createNote(req.user._id, req.body);

  res.status(201).json({
    success: true,
    message: "Note created successfully",
    resource: toNoteResponse(note),
  });
});

export const getNoteController = asyncHandler(async (req, res) => {
  const note = await getNote(req.user._id, req.params.id);

  res.status(200).json({
    success: true,
    resource: toNoteResponse(note),
  });
});

export const updateNoteController = asyncHandler(async (req, res) => {
  const note = await updateNote(req.user._id, req.params.id, req.body);

  res.status(200).json({
    success: true,
    message: "Note updated successfully",
    resource: toNoteResponse(note),
  });
});

export const deleteNoteController = asyncHandler(async (req, res) => {
  await deleteNote(req.user._id, req.params.id);

  res.status(200).json({
    success: true,
    message: "Note deleted successfully",
  });
});

export const moveNoteController = asyncHandler(async (req, res) => {
  const note = await moveNote(req.user._id, req.params.id, req.body.targetFolderId);

  res.status(200).json({
    success: true,
    message: "Note moved successfully",
    resource: toNoteResponse(note),
  });
});

export const toggleNoteFavoriteController = asyncHandler(async (req, res) => {
  const note = await toggleNoteFavorite(req.user._id, req.params.id);

  res.status(200).json({
    success: true,
    message: note.isFavorite ? "Note added to favorites" : "Note removed from favorites",
    resource: toNoteResponse(note),
  });
});

export const archiveNoteController = asyncHandler(async (req, res) => {
  const note = await archiveNote(req.user._id, req.params.id);

  res.status(200).json({
    success: true,
    message: "Note archived successfully",
    resource: toNoteResponse(note),
  });
});

export const restoreNoteController = asyncHandler(async (req, res) => {
  const note = await restoreNote(req.user._id, req.params.id);

  res.status(200).json({
    success: true,
    message: "Note restored successfully",
    resource: toNoteResponse(note),
  });
});
