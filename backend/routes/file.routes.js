const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer();
// const { generatePresignedUrl, downloadFiles,listFiles } = require('../controllers/file.controller');
const { uploadFileToS3, downloadFiles,listFiles } = require('../controllers/file.controller');
const authenticateToken = require('../middleware/jwt/authenticate');

// router.use(authenticateToken);
// Generate presigned URL for upload
// router.post('/generate-upload-url', authenticateToken, generatePresignedUrl);
router.post('/upload-file', authenticateToken ,upload.single('file'), uploadFileToS3);
router.get('/list', authenticateToken, listFiles);
 
// Download multiple files
router.post('/download', authenticateToken, downloadFiles);
 
module.exports = router;