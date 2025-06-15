const multer = require('multer');
const path = require('path');

// Konfigurasi penyimpanan
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/');
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname).toLowerCase();
    const filename = `${file.fieldname}_${timestamp}${ext}`;  // Fixed template literal
    cb(null, filename);
  }
});

// Filter file (gambar + video)
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['.jpeg', '.jpg', '.png', '.gif', '.mp4', '.mov', '.avi'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Hanya file gambar (JPEG/JPG/PNG/GIF) dan video (MP4/MOV/AVI) yang diizinkan!'), false);
  }
};

// Inisialisasi multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB
  }
});

module.exports = upload;