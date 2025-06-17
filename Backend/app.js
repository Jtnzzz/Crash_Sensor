const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs'); // untuk streaming
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

// Koneksi ke MongoDB
connectDB();

// Debugging ENV
console.log("Environment Variables:");
console.log("PORT:", process.env.PORT);
console.log("MONGODB_URI:", process.env.MONGODB_URI ? "***tersedia***" : "TIDAK TERSEDIA");

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
// STREAMING VIDEO DENGAN RANGE
// ======================
app.get('/uploads/:filename', async (req, res) => {
  try {
    const sanitizedFilename = req.params.filename.replace(/"/g, '');
    const filePath = path.join(__dirname, 'uploads', sanitizedFilename);

    const stat = await fs.stat(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      // Jika ada Range, streaming sebagian (streaming cepat)
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize) {
        res.status(416).send("Requested range not satisfiable");
        return;
      }

      const chunksize = end - start + 1;
      const file = fsSync.createReadStream(filePath, { start, end });

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'video/mp4',
      });

      file.pipe(res);
    } else {
      // Jika tidak ada Range, kirim seluruh file
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
        'Accept-Ranges': 'bytes'
      });

      fsSync.createReadStream(filePath).pipe(res);
    }
  } catch (err) {
    console.error('❌ Streaming error:', err);
    res.status(500).send('Internal Server Error');
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
// ERROR HANDLING
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
