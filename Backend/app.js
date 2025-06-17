require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

// ======================
// MIDDLEWARE
// ======================
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting (100 requests per 15 minutes)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP',
});
app.use(limiter);

// ======================
// MULTER UPLOAD CONFIG
// ======================
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = 'uploads/';
      fs.mkdir(uploadDir, { recursive: true })
        .then(() => cb(null, uploadDir))
        .catch(err => cb(err));
    },
    filename: (req, file, cb) => {
      const safeFilename = Date.now() + '-' + file.originalname.replace(/[^a-zA-Z0-9.-]/g, '');
      cb(null, safeFilename);
    },
  }),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'video/mp4') {
      cb(null, true);
    } else {
      cb(new Error('Only MP4 videos are allowed'), false);
    }
  },
});

// ======================
// ROUTES
// ======================

// Upload Video
app.post('/api/upload', upload.single('video'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  res.json({
    message: 'Upload successful',
    filename: req.file.filename,
    url: `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`,
  });
});

// List Videos
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
            createdAt: stat.birthtime,
          };
        })
    );
    res.json(videos);
  } catch (err) {
    console.error('Failed to list videos:', err);
    res.status(500).json({ error: 'Failed to fetch videos' });
  }
});

// Stream Video (Support Range Requests)
app.get('/uploads/:filename', async (req, res) => {
  try {
    const sanitizedFilename = req.params.filename.replace(/[^a-zA-Z0-9._-]/g, '');
    const filePath = path.join(__dirname, 'uploads', sanitizedFilename);

    const stat = await fs.stat(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Length,Content-Range');

    if (range) {
      // Handle Range Requests (for seeking)
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize) {
        return res.status(416).send('Requested range not satisfiable');
      }

      const chunkSize = end - start + 1;
      const file = fsSync.createReadStream(filePath, { start, end });

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': 'video/mp4',
      });

      file.pipe(res);
    } else {
      // Full video request
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
      });
      fsSync.createReadStream(filePath).pipe(res);
    }
  } catch (err) {
    console.error('Video streaming error:', err);
    res.status(404).send('Video not found');
  }
});

// HTML Video Player
app.get('/video-player', (req, res) => {
  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <title>Video Player</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 20px; }
      video { max-width: 100%; background: #000; }
      .video-item { margin-bottom: 20px; }
    </style>
  </head>
  <body>
    <h1>Video Player</h1>
    <div id="video-container"></div>
    <script>
      fetch('/api/videos')
        .then(res => res.json())
        .then(videos => {
          const container = document.getElementById('video-container');
          videos.forEach(video => {
            const videoElement = document.createElement('div');
            videoElement.className = 'video-item';
            videoElement.innerHTML = \`
              <h3>\${video.filename}</h3>
              <video controls width="800">
                <source src="\${video.url}" type="video/mp4">
                Your browser does not support the video tag.
              </video>
              <p>Size: \${(video.size / (1024 * 1024)).toFixed(2)} MB</p>
            \`;
            container.appendChild(videoElement);
          });
        })
        .catch(err => {
          console.error('Error loading videos:', err);
          document.getElementById('video-container').innerHTML = '<p>Failed to load videos</p>';
        });
    </script>
  </body>
  </html>
  `;
  res.send(html);
});

// Root Endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Video Streaming API',
    endpoints: {
      upload: 'POST /api/upload',
      list_videos: 'GET /api/videos',
      stream_video: 'GET /uploads/:filename',
      player: 'GET /video-player',
    },
  });
});

// Error Handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
