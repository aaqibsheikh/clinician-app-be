const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const {
  uploadToDrive,
  createFolder
} = require("../services/googleDriveService");

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post(
  "/",
  upload.fields([{ name: "photos" }, { name: "audio", maxCount: 1 }]),
  async (req, res) => {
    const { files, body } = req;
    const folderId = process.env.GOOGLE_DRIVE_UPLOAD_FOLDER;
    const timestamp = new Date().toISOString().split("T")[0];
    const cleanName = (body.clinicianName || "unknown")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]/gi, "_");

    const clinicianFolderId = await createFolder(cleanName, folderId);
    const assetFolderId = await createFolder(timestamp, clinicianFolderId);

    try {
      const clinicianName = body.clinicianName || "Unknown";
      const results = [];

      if (!files || (!files.photos && !files.audio)) {
        return res
          .status(400)
          .json({ success: false, message: "No files uploaded." });
      }

      if (!folderId) {
        return res.status(500).json({
          success: false,
          message: "Google Drive folder ID not configured."
        });
      }

      if (files.photos) {
        const photoUploads = files.photos.map(async (file) => {
          const uploaded = await uploadToDrive(
            file.path,
            file.originalname,
            assetFolderId
          );
          fs.unlinkSync(file.path);
          return uploaded;
        });

        const photoResults = await Promise.all(photoUploads);
        results.push(...photoResults);
      }

      if (files.audio) {
        const audioFile = files.audio[0];
        const uploaded = await uploadToDrive(
          audioFile.path,
          audioFile.originalname,
          assetFolderId
        );
        results.push(uploaded);
        fs.unlinkSync(audioFile.path);
      }

      return res.status(200).json({
        success: true,
        uploaded: results,
        message: "Files uploaded successfully."
      });
    } catch (error) {
      console.error("❌ Upload failed:", error);
      return res.status(500).json({
        success: false,
        message: "Upload failed due to server error.",
        error: error.message
      });
    }
  }
);

module.exports = router;
