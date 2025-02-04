// // backend/controllers/uploadController.js
// const AWS = require('aws-sdk');
// const multer = require('multer');
// const knex = require('../mysql/connection');
// const path = require('path');
// const fs = require('fs');
// const xl = require('excel4node');

// const s3 = new AWS.S3();
// const upload = multer({ dest: 'uploads/' });

// const uploadFile = async (req, res) => {
//   try {
//     const file = req.file;
//     const filePath = path.join(__dirname, '../uploads/', file.filename);
//     const fileStream = fs.createReadStream(filePath);

//     // Upload file to S3
//     const params = {
//       Bucket: process.env.AWS_BUCKET_NAME,
//       Key: file.filename,
//       Body: fileStream,
//       ContentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
//     };

//     const s3Response = await s3.upload(params).promise();

//     // Delete the local file after uploading
//     fs.unlinkSync(filePath);

//     res.json({ fileUrl: s3Response.Location });

//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// module.exports = { uploadFile };
