require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const connectDB = require('./db');
const hospitalRoutes = require('./routes/hospitals');
const policeRoutes = require('./routes/police');
const fireStationRoutes = require('./routes/firestation');
const crashRoutes = require('./routes/Crash');
const multer = require('multer');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// ======================
// MIDDLEWARE
// ======================
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later'
});
app.use(limiter);

// ======================
// MULTER CONFIGURATION (UPLOAD MIDDLEWARE)
// ======================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    fs.mkdir(uploadDir, { recursive: true })
      .then(() => cb(null, uploadDir))
      .catch(err => cb(err));
  },
  filename: (req, file, cb) => {
    const safeFilename = Date.now() + '-' + 
      file.originalname.replace(/[^a-zA-Z0-9.-]/g, '');
    cb(null, safeFilename);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'video/mp4') {
    cb(null, true);
  } else {
    cb(new Error('Hanya file MP4 yang diperbolehkan'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
    files: 1
  },
  fileFilter: fileFilter
});

// ======================
// DATABASE CONNECTION
// ======================
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
app.post('/api/upload', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Tidak ada file yang diunggah' });
    }

    res.status(201).json({
      message: 'Upload berhasil',
      filename: req.file.filename,
      url: `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`,
      size: req.file.size
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Server error during upload' });
  }
});

// ======================
// ENDPOINT: List Video
// ======================
app.get('/api/videos', async (req, res) => {
  try {
    const files = await fs.readdir(path.join(__dirname, 'uploads'));
    const videos = await Promise.all(
      files
        .filter(file => file.endsWith('.mp4'))
        .map(async file => {
          const stat = await fs.stat(path.join(__dirname, 'uploads', file));
          return {
            filename: file,
            url: `${req.protocol}://${req.get('host')}/uploads/${file}`,
            size: stat.size,
            createdAt: stat.birthtime
          };
        })
    );
    res.json(videos);
  } catch (err) {
    console.error('Video list error:', err);
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
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
          body { 
              font-family: Arial, sans-serif; 
              margin: 0;
              padding: 20px;
              background-color: #f5f5f5;
          }
          h1 { 
              color: #333; 
              text-align: center;
              margin-bottom: 30px;
          }
          .video-container {
              display: grid;
              grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
              gap: 20px;
          }
          .video-item {
              background: white;
              padding: 15px;
              border-radius: 8px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              transition: transform 0.2s;
          }
          .video-item:hover {
              transform: translateY(-5px);
          }
          video {
              width: 100%;
              background: #000;
              border-radius: 4px;
              margin-bottom: 10px;
          }
          .video-info {
              margin-bottom: 10px;
          }
          .video-title {
              font-weight: bold;
              margin-bottom: 5px;
          }
          .video-meta {
              font-size: 0.9em;
              color: #666;
          }
          .download-btn {
              display: inline-block;
              padding: 8px 15px;
              background: #4CAF50;
              color: white;
              text-decoration: none;
              border-radius: 4px;
              transition: background 0.2s;
          }
          .download-btn:hover {
              background: #3e8e41;
          }
          .loading {
              text-align: center;
              padding: 40px;
              font-size: 1.2em;
              color: #666;
          }
          .error {
              color: #d32f2f;
              text-align: center;
              padding: 20px;
              background: #ffebee;
              border-radius: 4px;
          }
          @media (max-width: 600px) {
              .video-container {
                  grid-template-columns: 1fr;
              }
          }
      </style>
  </head>
  <body>
      <h1>Daftar Video</h1>
      <div id="video-list" class="loading">Memuat daftar video...</div>
      
      <script>
          async function loadVideos() {
              try {
                  const response = await fetch('/api/videos');
                  
                  if (!response.ok) {
                      throw new Error('Gagal memuat video');
                  }
                  
                  const videos = await response.json();
                  const container = document.getElementById('video-list');
                  
                  if (videos.length === 0) {
                      container.innerHTML = '<p class="error">Tidak ada video tersedia</p>';
                      return;
                  }
                  
                  container.className = 'video-container';
                  container.innerHTML = '';
                  
                  videos.forEach(video => {
                      const videoElement = document.createElement('div');
                      videoElement.className = 'video-item';
                      
                      const sizeInMB = (video.size / (1024 * 1024)).toFixed(2);
                      const date = new Date(video.createdAt).toLocaleString();
                      
                      videoElement.innerHTML = \`
                          <div class="video-info">
                              <div class="video-title">\${video.filename}</div>
                              <div class="video-meta">
                                  \${sizeInMB} MB • \${date}
                              </div>
                          </div>
                          <video controls>
                              <source src="\${video.url}" type="video/mp4">
                              Browser tidak mendukung tag video.
                          </video>
                          <div>
                              <a href="\${video.url}" download class="download-btn">
                                  Download
                              </a>
                          </div>
                      \`;
                      container.appendChild(videoElement);
                  });
              } catch (error) {
                  console.error('Error:', error);
                  document.getElementById('video-list').innerHTML = 
                      '<p class="error">Gagal memuat daftar video. Silakan refresh halaman.</p>';
              }
          }
          
          // Load videos when page loads
          document.addEventListener('DOMContentLoaded', loadVideos);
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
        'Cache-Control': 'public, max-age=31536000'
      });

      file.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
        'Cache-Control': 'public, max-age=31536000'
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
    },
    status: "active",
    version: "1.0.0"
  });
});

// ======================
// ERROR HANDLING
// ======================
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ 
      error: 'Upload error', 
      message: err.message 
    });
  }
  
  res.status(500).json({ 
    error: 'Server error', 
    message: err.message 
  });
});

// ======================
// START SERVER
// ======================
app.listen(PORT, () => {
  console.log(`🟢 Server running on http://0.0.0.0:${PORT}`);
  console.log(`🔗 Video Player: http://0.0.0.0:${PORT}/video-player`);
});
