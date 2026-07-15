import WorkspaceModel from "../models/workspace.model.js";
import SubjectModel from "../models/subject.model.js";
import FolderModel from "../models/folder.model.js";
import ResourceModel from "../models/resource.model.js";
import { toPublicUser } from "./auth.service.js";

export async function getDashboardSummary(user) {
  const ownerId = user._id;

  const [
    workspaceCount,
    recentWorkspace,
    workspaceIds,
  ] = await Promise.all([
    WorkspaceModel.countDocuments({ owner: ownerId, isArchived: false }),
    WorkspaceModel.findOne({ owner: ownerId, isArchived: false }).sort({ updatedAt: -1 }),
    WorkspaceModel.find({ owner: ownerId, isArchived: false }).distinct("_id"),
  ]);

  const subjectCount = workspaceIds.length
    ? await SubjectModel.countDocuments({ workspace: { $in: workspaceIds } })
    : 0;

  // ── Phase 2 queries ──────────────────────────────────────────
  const [
    folderCount,
    noteCount,
    fileCount,
    recentNotes,
    recentFiles,
    recentFolders,
    favoriteResources,
    storageAgg,
  ] = await Promise.all([
    FolderModel.countDocuments({ owner: ownerId }),
    ResourceModel.countDocuments({ owner: ownerId, type: "NOTE", isArchived: false }),
    ResourceModel.countDocuments({ owner: ownerId, type: "FILE", isArchived: false }),

    // Recent notes (last 5)
    ResourceModel.find({ owner: ownerId, type: "NOTE", isArchived: false })
      .sort({ updatedAt: -1 })
      .limit(5)
      .select("title subject folder editorType wordCount readingTime updatedAt")
      .lean(),

    // Recent files (last 5)
    ResourceModel.find({ owner: ownerId, type: "FILE", isArchived: false })
      .sort({ updatedAt: -1 })
      .limit(5)
      .select("title subject folder originalName mimeType extension size updatedAt")
      .lean(),

    // Recent folders (last 5)
    FolderModel.find({ owner: ownerId })
      .sort({ updatedAt: -1 })
      .limit(5)
      .select("title subject color icon updatedAt")
      .lean(),

    // Favorite resources (last 10)
    ResourceModel.find({ owner: ownerId, isFavorite: true, isArchived: false })
      .sort({ updatedAt: -1 })
      .limit(10)
      .select("title type subject folder isFavorite updatedAt")
      .lean(),

    // Total storage used (sum of file sizes)
    ResourceModel.aggregate([
      { $match: { owner: ownerId, type: "FILE", size: { $ne: null } } },
      { $group: { _id: null, totalSize: { $sum: "$size" } } },
    ]),
  ]);

  const storageUsed = storageAgg.length ? storageAgg[0].totalSize : 0;

  return {
    user: await toPublicUser(user),
    hasWorkspace: workspaceCount > 0,
    hasSubjects: subjectCount > 0,
    workspaceCount,
    subjectCount,
    folderCount,
    noteCount,
    fileCount,
    storageUsed,
    recentWorkspace: recentWorkspace
      ? {
          id: recentWorkspace._id,
          title: recentWorkspace.title,
          description: recentWorkspace.description,
          color: recentWorkspace.color,
          icon: recentWorkspace.icon,
          updatedAt: recentWorkspace.updatedAt,
        }
      : null,
    recentNotes: recentNotes.map((n) => ({
      id: n._id,
      title: n.title,
      subject: n.subject,
      folder: n.folder,
      editorType: n.editorType,
      wordCount: n.wordCount,
      readingTime: n.readingTime,
      updatedAt: n.updatedAt,
    })),
    recentFiles: recentFiles.map((f) => ({
      id: f._id,
      title: f.title,
      subject: f.subject,
      folder: f.folder,
      originalName: f.originalName,
      mimeType: f.mimeType,
      extension: f.extension,
      size: f.size,
      updatedAt: f.updatedAt,
    })),
    recentFolders: recentFolders.map((f) => ({
      id: f._id,
      title: f.title,
      subject: f.subject,
      color: f.color,
      icon: f.icon,
      updatedAt: f.updatedAt,
    })),
    favoriteResources: favoriteResources.map((r) => ({
      id: r._id,
      title: r.title,
      type: r.type,
      subject: r.subject,
      folder: r.folder,
      updatedAt: r.updatedAt,
    })),
    recentActivity: [],
    emptyStates: {
      needsWorkspace: workspaceCount === 0,
      needsSubject: workspaceCount > 0 && subjectCount === 0,
      needsFolder: subjectCount > 0 && folderCount === 0,
      needsContent: folderCount > 0 && noteCount === 0 && fileCount === 0,
    },
  };
}
