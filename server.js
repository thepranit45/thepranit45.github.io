const express = require('express');
const multer = require('multer');
const { google } = require('googleapis');
const fs = require('fs');
const cors = require('cors');

const app = express();
app.use(cors());
const upload = multer({ dest: 'temp/' }); // temp folder for multer

// Google Drive authentication
const auth = new google.auth.GoogleAuth({
    keyFile: 'credentials.json', // Service account JSON
    scopes: ['https://www.googleapis.com/auth/drive.file']
});
const driveService = google.drive({ version: 'v3', auth });

// Replace with your Google Drive folder ID
const DRIVE_FOLDER_ID = '1nofWPyOGAsfo2ytaTfEgfD6njClA8DAB?usp=drive_link';

// Function to upload file to Google Drive
async function uploadFileToDrive(filePath, fileName, folderId) {
    const fileMetadata = { name: fileName, parents: [folderId] };
    const media = { mimeType: 'application/octet-stream', body: fs.createReadStream(filePath) };
    const response = await driveService.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id, webContentLink'
    });
    fs.unlinkSync(filePath); // delete temp file
    return response.data;
}

// POST /upload endpoint
app.post('/upload', upload.array('files'), async (req, res) => {
    try {
        const uploadedFiles = [];
        for (const file of req.files) {
            const data = await uploadFileToDrive(file.path, file.originalname, DRIVE_FOLDER_ID);
            uploadedFiles.push({
                name: file.originalname,
                url: data.webContentLink
            });
        }
        res.json({ success: true, files: uploadedFiles });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
