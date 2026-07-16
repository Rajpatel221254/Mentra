/**
 * AI Validator
 *
 * Input validation for all AI endpoints using express-validator.
 * Follows the same pattern as existing validators in the project.
 */

import { body, param, query } from "express-validator";
import { MAX_MESSAGE_LENGTH, MAX_CONVERSATION_TITLE_LENGTH } from "../constants/ai.constants.js";

// ── Shared ────────────────────────────────────────────────────────────────────

export const conversationIdValidator = [
  param("id").isMongoId().withMessage("Conversation ID is invalid"),
];

// ── Conversation ──────────────────────────────────────────────────────────────

export const createConversationValidator = [
  body("title")
    .optional()
    .trim()
    .isLength({ min: 1, max: MAX_CONVERSATION_TITLE_LENGTH })
    .withMessage(`Title must be between 1 and ${MAX_CONVERSATION_TITLE_LENGTH} characters`),

  body("context").optional().isObject().withMessage("context must be an object"),

  body("context.workspaceId")
    .optional({ nullable: true })
    .isMongoId()
    .withMessage("context.workspaceId must be a valid ID"),

  body("context.subjectId")
    .optional({ nullable: true })
    .isMongoId()
    .withMessage("context.subjectId must be a valid ID"),

  body("context.folderId")
    .optional({ nullable: true })
    .isMongoId()
    .withMessage("context.folderId must be a valid ID"),

  body("context.resourceId")
    .optional({ nullable: true })
    .isMongoId()
    .withMessage("context.resourceId must be a valid ID"),
];

export const renameConversationValidator = [
  ...conversationIdValidator,
  body("title")
    .trim()
    .isLength({ min: 1, max: MAX_CONVERSATION_TITLE_LENGTH })
    .withMessage(`Title must be between 1 and ${MAX_CONVERSATION_TITLE_LENGTH} characters`),
];

export const listConversationsValidator = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("page must be a positive integer")
    .toInt(),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage("limit must be between 1 and 50")
    .toInt(),
];

// ── Chat ──────────────────────────────────────────────────────────────────────

export const sendMessageValidator = [
  body("conversationId")
    .isMongoId()
    .withMessage("conversationId is required and must be a valid ID"),

  body("message")
    .isString()
    .withMessage("message must be a string")
    .trim()
    .isLength({ min: 1, max: MAX_MESSAGE_LENGTH })
    .withMessage(`message must be between 1 and ${MAX_MESSAGE_LENGTH} characters`),
];

// ── Messages Pagination ───────────────────────────────────────────────────────

export const getMessagesValidator = [
  ...conversationIdValidator,
  query("before")
    .optional()
    .isISO8601()
    .withMessage("before must be a valid ISO 8601 date"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("limit must be between 1 and 100")
    .toInt(),
];
