const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();


const serviceAccountPath = path.resolve(__dirname, '..', 'service-account.json');

// Create file from base64 env var if it doesn't exist
if (!fs.existsSync(serviceAccountPath) && process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
  const decoded = Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_KEY, 'base64').toString('utf8');
  fs.writeFileSync(serviceAccountPath, decoded);
}

const auth = new google.auth.GoogleAuth({
  keyFile: serviceAccountPath,
  scopes: ['https://www.googleapis.com/auth/drive'],
});



// const auth = new google.auth.GoogleAuth({
//   keyFile: path.resolve(__dirname, '..', process.env.GOOGLE_SERVICE_ACCOUNT_KEY),
//   scopes: ['https://www.googleapis.com/auth/drive'],
// });

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

async function uploadToDrive(filePath, fileName, folderId) {
  if (!fs.existsSync(filePath)) throw new Error('File path does not exist.');
  if (!folderId) throw new Error('Missing Google Drive folder ID.');

  const finalName = fileName.replace(/\s+/g, '_');
  const fileMetadata = {
    name: finalName,
    parents: [folderId],
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

module.exports = {
  uploadToDrive,
  createFolder, // <-- add this line
};
