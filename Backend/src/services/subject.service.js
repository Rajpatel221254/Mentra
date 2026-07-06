import mongoose from "mongoose";
import SubjectModel from "../models/subject.model.js";
import {
  getOwnedWorkspace,
} from "./workspace.service.js";
import { ApiError } from "../utils/api-error.js";

function assertObjectId(id, label) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, `${label} is invalid`);
  }
}

function duplicateTitleError(error) {
  if (error?.code === 11000) {
    throw new ApiError(409, "Subject title already exists in this workspace");
  }

  throw error;
}

async function getOwnedSubject(ownerId, subjectId) {
  assertObjectId(subjectId, "Subject id");

  const subject = await SubjectModel.findById(subjectId);
  if (!subject) {
    throw new ApiError(404, "Subject not found");
  }

  await getOwnedWorkspace(ownerId, subject.workspace, {
    includeArchived: true,
  });

  return subject;
}

export async function createSubject(ownerId, payload) {
  const workspace = await getOwnedWorkspace(ownerId, payload.workspace);

  try {
    const subject = await SubjectModel.create({
      workspace: workspace._id,
      title: payload.title,
      description: payload.description,
      color: payload.color,
      icon: payload.icon,
      order: payload.order,
    });

    return subject;
  } catch (error) {
    duplicateTitleError(error);
  }
}

export async function listWorkspaceSubjects(ownerId, workspaceId) {
  const workspace = await getOwnedWorkspace(ownerId, workspaceId);

  return SubjectModel.find({ workspace: workspace._id }).sort({
    order: 1,
    createdAt: 1,
  });
}

export async function getSubject(ownerId, subjectId) {
  return getOwnedSubject(ownerId, subjectId);
}

export async function updateSubject(ownerId, subjectId, payload) {
  const subject = await getOwnedSubject(ownerId, subjectId);

  const allowedFields = ["title", "description", "color", "icon", "order"];
  allowedFields.forEach((field) => {
    if (payload[field] !== undefined) {
      subject[field] = payload[field];
    }
  });

  try {
    await subject.save();
    return subject;
  } catch (error) {
    duplicateTitleError(error);
  }
}

export async function deleteSubject(ownerId, subjectId) {
  const subject = await getOwnedSubject(ownerId, subjectId);
  await SubjectModel.deleteOne({ _id: subject._id });
}

export async function reorderSubjects(ownerId, workspaceId, subjects) {
  const workspace = await getOwnedWorkspace(ownerId, workspaceId);
  const subjectIds = subjects.map((subject) => subject.id);

  if (new Set(subjectIds).size !== subjectIds.length) {
    throw new ApiError(422, "Duplicate subject ids are not allowed");
  }

  subjectIds.forEach((id) => assertObjectId(id, "Subject id"));

  const ownedCount = await SubjectModel.countDocuments({
    _id: { $in: subjectIds },
    workspace: workspace._id,
  });

  if (ownedCount !== subjectIds.length) {
    throw new ApiError(403, "One or more subjects do not belong to this workspace");
  }

  await Promise.all(
    subjects.map((subject) =>
      SubjectModel.updateOne(
        { _id: subject.id, workspace: workspace._id },
        { $set: { order: subject.order } },
      ),
    ),
  );

  return SubjectModel.find({ workspace: workspace._id }).sort({
    order: 1,
    createdAt: 1,
  });
}

export function toSubjectResponse(subject) {
  return {
    id: subject._id,
    workspace: subject.workspace,
    title: subject.title,
    description: subject.description,
    color: subject.color,
    icon: subject.icon,
    order: subject.order,
    createdAt: subject.createdAt,
    updatedAt: subject.updatedAt,
  };
}
