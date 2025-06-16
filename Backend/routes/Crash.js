const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const { detectNearbyFacilities, logCrashReport } = require("../services/alertService");

// ✅ Ping endpoint
router.get("/ping", (req, res) => {
  res.status(200).json({ message: "Server aktif" });
});

// ✅ Upload endpoint
router.post(
  "/upload",
  upload.fields([
    { name: "file1" },
    { name: "file2" },
    { name: "file3" },
  ]),
  async (req, res) => {
    try {
      let coordinates;
      try {
        const parsed = JSON.parse(req.body.coordinates);

        if (Array.isArray(parsed) && parsed.length === 2) {
          coordinates = parsed; // Format: [lon, lat]
        } else if (
          typeof parsed === "object" &&
          parsed.lat !== undefined &&
          parsed.lng !== undefined
        ) {
          coordinates = [parsed.lng, parsed.lat];
        } else {
          throw new Error("Invalid coordinate format");
        }
      } catch (e) {
        return res
          .status(400)
          .json({ error: "Koordinat tidak valid atau format tidak dikenali" });
      }

      // ✅ Lanjut proses
      const facilities = await detectNearbyFacilities(coordinates);
      await logCrashReport(coordinates, facilities);

      console.log("🚨 Kecelakaan diterima!");
      console.log("📍 Lokasi:", coordinates);
      console.log("📦 File:", req.files);

      res.status(200).json({
        message: "File dan data lokasi berhasil diterima",
        fasilitas: facilities.map((f) => ({
          id: f._id,
          nama: f.nama,
          jenis: f.constructor.modelName,
        })),
      });
    } catch (err) {
      console.error("[❌] Error saat upload:", err.message);
      res.status(500).json({ error: err.message });
    }
  }
);

module.exports = router;
