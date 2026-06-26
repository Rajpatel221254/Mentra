import {
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuid } from "uuid";
import path from "path";

import { s3 } from "../config/aws.s3.js";

class StorageService {
  /**
   * Upload a file to AWS S3
   * @param {Object} file - Multer file object
   * @param {String} folder - Folder name (avatars, resources, etc.)
   * @returns {Promise<Object>}
   */
  async uploadFile(file, folder = "uploads") {
    try {
      if (!file) {
        throw new Error("No file provided.");
      }

      const extension = path.extname(file.originalname).toLowerCase();
      const filename = `${uuid()}${extension}`;

      const key = `${folder}/${filename}`;

      const command = new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      });

      await s3.send(command);

      return {
        key,
        bucket: process.env.AWS_BUCKET_NAME,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
      };
    } catch (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }
  }

  /**
   * Delete a file from S3
   * @param {String} key
   */
  async deleteFile(key) {
    try {
      const command = new DeleteObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
      });

      await s3.send(command);

      return true;
    } catch (error) {
      throw new Error(`Delete failed: ${error.message}`);
    }
  }

  /**
   * Generate a temporary signed URL
   * @param {String} key
   * @param {Number} expiresIn
   * @returns {Promise<String>}
   */
  async getSignedUrl(key, expiresIn = 300) {
    try {
      const command = new GetObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
      });

      return await getSignedUrl(s3, command, {
        expiresIn,
      });
    } catch (error) {
      throw new Error(`Failed to generate signed URL: ${error.message}`);
    }
  }

  /**
   * Check if file exists
   * @param {String} key
   * @returns {Promise<Boolean>}
   */
  async fileExists(key) {
    try {
      const command = new HeadObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
      });

      await s3.send(command);

      return true;
    } catch (error) {
      return false;
    }
  }
}

export default new StorageService();
