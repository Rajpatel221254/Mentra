export const ALLOWED_COLORS = [
  "blue",
  "green",
  "purple",
  "pink",
  "orange",
  "red",
  "yellow",
  "teal",
  "cyan",
  "gray",
];

export const ALLOWED_ICONS = [
  "book-open",
  "graduation-cap",
  "calculator",
  "flask-conical",
  "languages",
  "code",
  "palette",
  "music",
  "globe",
  "briefcase",
  "atom",
  "pen-tool",
  "notebook",
  "brain",
  "target",
  "folder",
  "file",
  "file-text",
  "image",
  "video",
  "archive",
];

// ── Resource Types ──────────────────────────────────────────────
export const RESOURCE_TYPES = ["NOTE", "FILE"];

// ── Editor Types ────────────────────────────────────────────────
export const EDITOR_TYPES = ["richtext", "markdown", "plain"];

// ── File Upload ─────────────────────────────────────────────────
export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

export const ALLOWED_FILE_MIMES = [
  // Images
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  // PDF
  "application/pdf",
  // Word
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  // Excel
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  // PowerPoint
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  // ZIP / Archive
  "application/zip",
  "application/x-zip-compressed",
  // Video
  "video/mp4",
  "video/webm",
  "video/quicktime",
  // Text / Code
  "text/plain",
  "text/csv",
  "application/json",
];

export const ALLOWED_FILE_EXTENSIONS = [
  ".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg",
  ".pdf",
  ".doc", ".docx",
  ".xls", ".xlsx",
  ".ppt", ".pptx",
  ".zip",
  ".mp4", ".webm", ".mov",
  ".txt", ".csv", ".json",
];

// ── Folder ──────────────────────────────────────────────────────
export const MAX_FOLDER_DEPTH = 10;

// ── Sort ────────────────────────────────────────────────────────
export const RESOURCE_SORT_MAP = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  updated: { updatedAt: -1 },
  title_asc: { title: 1 },
  title_desc: { title: -1 },
  largest: { size: -1 },
  smallest: { size: 1 },
};
