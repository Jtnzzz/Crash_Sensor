const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const connectDB = require('./db');
const hospitalRoutes = require('./routes/hospitals');
const policeRoutes = require('./routes/police');
const fireStationRoutes = require('./routes/firestation');
const crashRoutes = require('./routes/Crash');
const upload = require('./middleware/upload');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());

// Koneksi Database
connectDB();

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
// ENDPOINT: Video Player HTML
// ======================
app.get('/video-player', (req, res) => {
  const htmlContent = `
  <!DOCTYPE html>
  <html>
  <head>
      <title>Video Player</title>
      <style>
          body { 
              font-family: Arial, sans-serif; 
              margin: 20px; 
              padding: 0;
              background-color: #f5f5f5;
          }
          h1 { color: #333; }
          .video-container {
              display: grid;
              grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
              gap: 20px;
              margin-top: 20px;
          }
          .video-item {
              background: white;
              padding: 15px;
              border-radius: 8px;
              box-shadow: 0 2px 5px rgba(0,0,0,0.1);
          }
          video {
              width: 100%;
              background: #000;
              border-radius: 4px;
          }
          .download-btn {
              display: inline-block;
              margin-top: 10px;
              padding: 8px 15px;
              background: #4CAF50;
              color: white;
              text-decoration: none;
              border-radius: 4px;
          }
          .loading {
              text-align: center;
              padding: 20px;
              font-style: italic;
              color: #666;
          }
      </style>
  </head>
  <body>
      <h1>Daftar Video</h1>
      <div id="video-list" class="loading">Memuat daftar video...</div>
      
      <script>
          fetch('/api/videos')
              .then(response => {
                  if (!response.ok) throw new Error('Network response was not ok');
                  return response.json();
              })
              .then(videos => {
                  const container = document.getElementById('video-list');
                  container.className = 'video-container';
                  
                  if (videos.length === 0) {
                      container.innerHTML = '<p>Tidak ada video tersedia</p>';
                      return;
                  }
                  
                  videos.forEach(video => {
                      const videoElement = document.createElement('div');
                      videoElement.className = 'video-item';
                      videoElement.innerHTML = \`
                          <h3>\${video.filename}</h3>
                          <video controls>
                              <source src="\${video.url}" type="video/mp4">
                              Browser tidak mendukung tag video.
                          </video>
                          <div>
                              <a href="\${video.url}" download class="download-btn">Download</a>
                          </div>
                      \`;
                      container.appendChild(videoElement);
                  });
              })
              .catch(error => {
                  console.error('Error:', error);
                  document.getElementById('video-list').innerHTML = 
                      '<p style="color: red;">Gagal memuat daftar video. Silakan refresh halaman.</p>';
              });
      </script>
  </body>
  </html>
  `;
  
  res.send(htmlContent);
});

// ======================
// STREAMING VIDEO
// ======================
app.get('/uploads/:filename', async (req, res) => {
  try {
    const sanitizedFilename = req.params.filename.replace(/[^a-zA-Z0-9._-]/g, '');
    const filePath = path.join(__dirname, 'uploads', sanitizedFilename);

    const stat = await fs.stat(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
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
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
      });
      fsSync.createReadStream(filePath).pipe(res);
    }
  } catch (err) {
    console.error('Streaming error:', err);
    res.status(404).send('Video tidak ditemukan');
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
      list_video: "GET /api/videos",
      video_player: "GET /video-player"
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
