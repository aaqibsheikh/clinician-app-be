const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const auth = new google.auth.GoogleAuth({
  keyFile: path.resolve(__dirname, '..', process.env.GOOGLE_SERVICE_ACCOUNT_KEY),
  scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

async function createFolder(name, parentId) {
  const res = await drive.files.list({
    q: `'${parentId}' in parents and name='${name}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id, name)',
  });

  if (res.data.files.length > 0) {
    return res.data.files[0].id; // Folder already exists
  }

  const fileMetadata = {
    name,
    mimeType: 'application/vnd.google-apps.folder',
    parents: [parentId],
  };

  const folder = await drive.files.create({
    resource: fileMetadata,
    fields: 'id',
  });

  return folder.data.id;
}

async function uploadToDrive(filePath, fileName, rootFolderId, clinicianName) {
  if (!fs.existsSync(filePath)) throw new Error('File path does not exist.');
  if (!rootFolderId) throw new Error('Missing Google Drive root folder ID.');

  const cleanName = clinicianName?.trim().replace(/\s+/g, '_') || 'Unknown';
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];

  // Step 1: Get or create clinician folder
  const clinicianFolderId = await createFolder(cleanName, rootFolderId);

  // Step 2: Get or create timestamp folder
  const timestampFolderId = await createFolder(timestamp, clinicianFolderId);

  // Step 3: Upload file to timestamp folder
  const finalName = `${fileName.replace(/\s+/g, '_')}`;
  const fileMetadata = {
    name: finalName,
    parents: [timestampFolderId],
  };

  const media = {
    mimeType: 'application/octet-stream',
    body: fs.createReadStream(filePath),
  };

  const response = await drive.files.create({
    resource: fileMetadata,
    media,
    fields: 'id, name',
  });

  return response.data;
}

module.exports = { uploadToDrive };
