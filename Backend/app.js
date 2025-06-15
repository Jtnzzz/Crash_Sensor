const express = require('express');
const path = require('path');
const connectDB = require('./db'); // Pastikan file db.js ada

// Import route files
const hospitalRoutes = require('./routes/hospitals');
const policeRoutes = require('./routes/police');
const fireStationRoutes = require('./routes/firestation');
const crashRoutes = require('./routes/Crash');
const uploadRoutes = require('./routes/Upload'); // ✅ Tambahkan route upload

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware untuk parsing JSON
app.use(express.json());

// Middleware untuk menyajikan file statis dari folder 'uploads'
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Debugging environment variables
console.log("Environment Variables:");
console.log("PORT:", process.env.PORT);
console.log("MONGODB_URI:", process.env.MONGODB_URI ? "***tersedia***" : "TIDAK TERSEDIA");

// Koneksi ke database
connectDB();

// Routes utama
app.use("/api/v1/hospitals", hospitalRoutes);
app.use("/api/v1/police", policeRoutes);
app.use("/api/v1/damkar", fireStationRoutes);
app.use("/api/crash", crashRoutes);
app.use("/upload", uploadRoutes); // ✅ Route untuk upload video dari Orange Pi

// Endpoint test
app.get("/", (req, res) => {
  res.json({
    message: "Smart Crash Alert API",
    endpoints: {
      hospitals: "GET /api/v1/hospitals",
      police: "GET /api/v1/police",
      damkar: "GET /api/v1/damkar",
      report_crash: "POST /api/crash",
      upload_video: "POST /upload"
    } 
  });
});

// Error handler (jika ada error server)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Terjadi kesalahan server!' });
});

// Jalankan server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🟢 Server running on http://0.0.0.0:${PORT}`);
});
