const multer = require('multer');
const path = require('path');

const createUpload = (allowedExts, maxSize) =>
  multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      if (allowedExts.includes(ext)) return cb(null, true);
      cb(new Error(`Allowed formats: ${allowedExts.join(', ')}`), false);
    },
    limits: { fileSize: maxSize },
  });

module.exports = { createUpload };
