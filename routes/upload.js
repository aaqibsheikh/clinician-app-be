const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { uploadToDrive } = require('../services/googleDriveService');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.post('/', upload.fields([
  { name: 'photos' },
  { name: 'audio', maxCount: 1 }
]), async (req, res) => {
  try {
    const folderId = process.env.GOOGLE_DRIVE_UPLOAD_FOLDER;
    const { files, body } = req;
    const clinicianName = body.clinicianName || 'Unknown';
    const results = [];

    if (!files || (!files.photos && !files.audio)) {
      return res.status(400).json({ success: false, message: 'No files uploaded.' });
    }

    if (!folderId) {
      return res.status(500).json({ success: false, message: 'Google Drive folder ID not configured.' });
    }

    if (files.photos) {
      for (const file of files.photos) {
        const uploaded = await uploadToDrive(file.path, file.originalname, folderId, clinicianName);
        
        
        results.push(uploaded);
        fs.unlinkSync(file.path); // Cleanup
    }
}

    if (files.audio) {
      const audioFile = files.audio[0];
      const uploaded = await uploadToDrive(audioFile.path, audioFile.originalname, folderId, clinicianName);

      results.push(uploaded);
      fs.unlinkSync(audioFile.path);
    }

    return res.status(200).json({
      success: true,
      uploaded: results,
      message: 'Files uploaded successfully.',
    });
  } catch (error) {
    console.error('❌ Upload failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Upload failed due to server error.',
      error: error.message,
    });
  }
});

module.exports = router;
