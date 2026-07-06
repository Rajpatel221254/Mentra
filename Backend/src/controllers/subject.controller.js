import {
  createSubject,
  deleteSubject,
  getSubject,
  listWorkspaceSubjects,
  reorderSubjects,
  toSubjectResponse,
  updateSubject,
} from "../services/subject.service.js";
import { asyncHandler } from "../utils/async-handler.js";

export const createSubjectController = asyncHandler(async (req, res) => {
  const subject = await createSubject(req.user._id, req.body);

  res.status(201).json({
    success: true,
    message: "Subject created successfully",
    subject: toSubjectResponse(subject),
  });
});

export const listWorkspaceSubjectsController = asyncHandler(async (req, res) => {
  const subjects = await listWorkspaceSubjects(
    req.user._id,
    req.params.workspaceId,
  );

  res.status(200).json({
    success: true,
    subjects: subjects.map(toSubjectResponse),
  });
});

export const getSubjectController = asyncHandler(async (req, res) => {
  const subject = await getSubject(req.user._id, req.params.id);

  res.status(200).json({
    success: true,
    subject: toSubjectResponse(subject),
  });
});

export const updateSubjectController = asyncHandler(async (req, res) => {
  const subject = await updateSubject(req.user._id, req.params.id, req.body);

  res.status(200).json({
    success: true,
    message: "Subject updated successfully",
    subject: toSubjectResponse(subject),
  });
});

export const deleteSubjectController = asyncHandler(async (req, res) => {
  await deleteSubject(req.user._id, req.params.id);

  res.status(200).json({
    success: true,
    message: "Subject deleted successfully",
  });
});

export const reorderSubjectsController = asyncHandler(async (req, res) => {
  const subjects = await reorderSubjects(
    req.user._id,
    req.body.workspaceId,
    req.body.subjects,
  );

  res.status(200).json({
    success: true,
    message: "Subjects reordered successfully",
    subjects: subjects.map(toSubjectResponse),
  });
});
