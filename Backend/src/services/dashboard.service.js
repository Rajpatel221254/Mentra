import WorkspaceModel from "../models/workspace.model.js";
import SubjectModel from "../models/subject.model.js";
import { toPublicUser } from "./auth.service.js";

export async function getDashboardSummary(user) {
  const [workspaceCount, recentWorkspace] = await Promise.all([
    WorkspaceModel.countDocuments({
      owner: user._id,
      isArchived: false,
    }),
    WorkspaceModel.findOne({
      owner: user._id,
      isArchived: false,
    }).sort({ updatedAt: -1 }),
  ]);

  const workspaceIds = await WorkspaceModel.find({
    owner: user._id,
    isArchived: false,
  }).distinct("_id");

  const subjectCount = workspaceIds.length
    ? await SubjectModel.countDocuments({ workspace: { $in: workspaceIds } })
    : 0;

  return {
    user: await toPublicUser(user),
    hasWorkspace: workspaceCount > 0,
    hasSubjects: subjectCount > 0,
    workspaceCount,
    subjectCount,
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
    recentActivity: [],
    emptyStates: {
      needsWorkspace: workspaceCount === 0,
      needsSubject: workspaceCount > 0 && subjectCount === 0,
    },
  };
}
