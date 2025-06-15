const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const { detectNearbyFacilities, logCrashReport } = require("../services/alertService");

// ✅ Tambahkan ping endpoint
router.get("/ping", (req, res) => {
  res.status(200).json({ message: "Server aktif" });
});

router.post("/upload", upload.fields([
  { name: "file1" },
  { name: "file2" },
  { name: "file3" },
]), async (req, res) => {
  try {
    const { coordinates } = req.body;
    if (!coordinates || !Array.isArray(coordinates)) {
      return res.status(400).json({ error: "Koordinat tidak valid" });
    }

    const facilities = await detectNearbyFacilities(coordinates);
    await logCrashReport(coordinates, facilities);

    console.log("🚨 Kecelakaan diterima!");
    console.log("📍 Lokasi:", coordinates);
    console.log("📦 File:", req.files);

    res.status(200).json({
      message: "File dan data lokasi berhasil diterima",
      fasilitas: facilities.map(f => ({
        id: f._id,
        nama: f.nama,
        jenis: f.constructor.modelName
      }))
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
