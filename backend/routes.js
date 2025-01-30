const express = require('express');
const authRoutes = require('./routes/authRoutes');
const router = express.Router();

router.use('/auth', authRoutes);
router.use('/files', require('./routes/file.routes'));

module.exports = router;