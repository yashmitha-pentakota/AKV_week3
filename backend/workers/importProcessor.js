// // backend/workers/processFile.js
// const XLSX = require('xlsx');
// const knex = require('knex')({ client: 'mysql' });

// const processFile = async (fileUrl) => {
//   const response = { success: true, errors: [] };

//   // Download file from S3
//   const s3 = new AWS.S3();
//   const params = {
//     Bucket: process.env.AWS_BUCKET_NAME,
//     Key: fileUrl,
//   };

//   const fileData = await s3.getObject(params).promise();

//   const workbook = XLSX.read(fileData.Body, { type: 'buffer' });
//   const sheet = workbook.Sheets[workbook.SheetNames[0]];
//   const jsonData = XLSX.utils.sheet_to_json(sheet);

//   // Validate and insert products into the inventory
//   for (let row of jsonData) {
//     if (row.product_name && row.price) {
//       try {
//         await knex('products').insert(row); // Insert into inventory
//       } catch (error) {
//         response.errors.push({ row: row, reason: error.message });
//       }
//     } else {
//       response.errors.push({ row: row, reason: 'Missing required fields' });
//     }
//   }

//   if (response.errors.length > 0) {
//     const errorLog = generateErrorLog(response.errors);
//     await uploadErrorLogToS3(errorLog);
//   }

//   return response;
// };

// const generateErrorLog = (errors) => {
//   const wb = new xl.Workbook();
//   const ws = wb.addWorksheet('Error Log');
//   ws.cell(1, 1).string('Row');
//   ws.cell(1, 2).string('Reason');

//   errors.forEach((error, index) => {
//     ws.cell(index + 2, 1).string(JSON.stringify(error.row));
//     ws.cell(index + 2, 2).string(error.reason);
//   });

//   const errorFilePath = 'errorLog.xlsx';
//   wb.write(errorFilePath);
//   return errorFilePath;
// };

// const uploadErrorLogToS3 = async (filePath) => {
//   const fileStream = fs.createReadStream(filePath);
//   const s3Params = {
//     Bucket: process.env.AWS_BUCKET_NAME,
//     Key: `errorLogs/${path.basename(filePath)}`,
//     Body: fileStream,
//     ContentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
//   };

//   await s3.upload(s3Params).promise();
// };

// module.exports = { processFile };
