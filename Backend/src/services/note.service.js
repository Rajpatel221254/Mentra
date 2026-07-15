import ResourceModel from "../models/resource.model.js";
import SubjectModel from "../models/subject.model.js";
import { getOwnedFolder } from "./folder.service.js";
import { getOwnedResource, toResourceResponse } from "./resource.service.js";
import { ApiError } from "../utils/api-error.js";

// ── Helpers ────────────────────────────────────────────────────────

const WORDS_PER_MINUTE = 200;

/**
 * Compute word count from content string.
 * Strips HTML tags and counts whitespace-separated tokens.
 */
function computeWordCount(content) {
  if (!content) return 0;
  const text = content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return text ? text.split(" ").length : 0;
}

function computeReadingTime(wordCount) {
  return Math.max(1, Math.ceil(wordCount / WORDS_PER_MINUTE));
}

// ── Create ─────────────────────────────────────────────────────────

export async function createNote(ownerId, payload) {
  const folder = await getOwnedFolder(ownerId, payload.folder);

  // Resolve workspace from the subject
  const subject = await SubjectModel.findById(folder.subject)
    .select("workspace")
    .lean();

  const wordCount = computeWordCount(payload.content);

  const note = await ResourceModel.create({
    owner: ownerId,
    workspace: subject.workspace,
    subject: folder.subject,
    folder: folder._id,
    type: "NOTE",
    title: payload.title,
    description: payload.description,
    content: payload.content || "",
    editorType: payload.editorType || "richtext",
    coverImage: payload.coverImage || null,
    icon: payload.icon || null,
    tags: payload.tags || [],
    wordCount,
    readingTime: wordCount > 0 ? computeReadingTime(wordCount) : 0,
    lastEditedAt: new Date(),
    order: payload.order,
  });

  return note;
}

// ── Read ───────────────────────────────────────────────────────────

export async function getNote(ownerId, noteId) {
  const resource = await getOwnedResource(ownerId, noteId);

  if (resource.type !== "NOTE") {
    throw new ApiError(400, "This resource is not a note");
  }

  return resource;
}

// ── Update ─────────────────────────────────────────────────────────

export async function updateNote(ownerId, noteId, payload) {
  const note = await getNote(ownerId, noteId);

  const allowedFields = [
    "title", "description", "content", "editorType",
    "coverImage", "icon", "tags", "order",
  ];

  allowedFields.forEach((field) => {
    if (payload[field] !== undefined) {
      note[field] = payload[field];
    }
  });

  // Recompute word count + reading time if content changed
  if (payload.content !== undefined) {
    note.wordCount = computeWordCount(note.content);
    note.readingTime = note.wordCount > 0 ? computeReadingTime(note.wordCount) : 0;
  }

  note.lastEditedAt = new Date();

  await note.save();
  return note;
}

// ── Delete ─────────────────────────────────────────────────────────

export async function deleteNote(ownerId, noteId) {
  const note = await getNote(ownerId, noteId);

  // If note has a cover image stored in S3, delete it
  if (note.coverImage && note.coverImage.startsWith("notes/")) {
    const storageService = (await import("./storage.service.js")).default;
    await storageService.deleteFile(note.coverImage).catch(() => {});
  }

  await ResourceModel.deleteOne({ _id: note._id });
}

// ── Move ───────────────────────────────────────────────────────────

export async function moveNote(ownerId, noteId, targetFolderId) {
  const note = await getNote(ownerId, noteId);
  const targetFolder = await getOwnedFolder(ownerId, targetFolderId);

  // Must be same subject
  if (targetFolder.subject.toString() !== note.subject.toString()) {
    throw new ApiError(422, "Target folder must be in the same subject");
  }

  note.folder = targetFolder._id;
  await note.save();

  return note;
}

// ── Favorite ───────────────────────────────────────────────────────

export async function toggleNoteFavorite(ownerId, noteId) {
  const note = await getNote(ownerId, noteId);
  note.isFavorite = !note.isFavorite;
  await note.save();
  return note;
}

// ── Archive / Restore ──────────────────────────────────────────────

export async function archiveNote(ownerId, noteId) {
  const note = await getNote(ownerId, noteId);
  note.isArchived = true;
  await note.save();
  return note;
}

export async function restoreNote(ownerId, noteId) {
  const note = await getNote(ownerId, noteId);
  note.isArchived = false;
  await note.save();
  return note;
}

// ── Response ───────────────────────────────────────────────────────

export function toNoteResponse(note) {
  return toResourceResponse(note.toObject ? note.toObject() : note);
}
