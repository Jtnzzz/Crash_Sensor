const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const connectDB = require('./db');
const hospitalRoutes = require('./routes/hospitals');
const policeRoutes = require('./routes/police');
const fireStationRoutes = require('./routes/firestation');
const crashRoutes = require('./routes/Crash');
const upload = require('./middleware/upload'); // Multer middleware
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware parsing JSON
app.use(express.json());

// Koneksi ke database MongoDB
connectDB();

// Debugging ENV
console.log("Environment Variables:");
console.log("PORT:", process.env.PORT);
console.log("MONGODB_URI:", process.env.MONGODB_URI ? "***tersedia***" : "TIDAK TERSEDIA");

// Serve file statis dari folder uploads (untuk video)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ======================
// ROUTES API
// ======================
app.use("/api/v1/hospitals", hospitalRoutes);
app.use("/api/v1/police", policeRoutes);
app.use("/api/v1/damkar", fireStationRoutes);
app.use("/api/crash", crashRoutes);

// ======================
// ENDPOINT: Upload Video
// ======================
app.post('/api/upload', upload.single('video'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Tidak ada file yang diunggah' });
  }
  res.json({
    message: 'Upload berhasil',
    filename: req.file.filename,
    url: `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`
  });
});

// ======================
// ENDPOINT: List Video
// ======================
app.get('/api/videos', async (req, res) => {
  try {
    const files = await fs.readdir(path.join(__dirname, 'uploads'));
    const videos = files
      .filter(file => file.endsWith('.mp4'))
      .map(file => ({
        filename: file,
        url: `${req.protocol}://${req.get('host')}/uploads/${file}`
      }));
    res.json(videos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal membaca daftar video' });
  }
});

// ======================
// TEST Endpoint Root
// ======================
app.get("/", (req, res) => {
  res.json({
    message: "Smart Crash Alert API",
    endpoints: {
      hospitals: "GET /api/v1/hospitals",
      police: "GET /api/v1/police",
      damkar: "GET /api/v1/damkar",
      report_crash: "POST /api/crash",
      upload_video: "POST /api/upload",
      list_video: "GET /api/videos"
    }
  });
});

// ======================
// Error Handling
// ======================
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Terjadi kesalahan server!' });
});

// ======================
// START SERVER
// ======================
app.listen(PORT, () => {
  console.log(`🟢 Server running on http://0.0.0.0:${PORT}`);
});
