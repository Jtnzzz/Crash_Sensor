const express = require("express");
const router = express.Router();
const PoliceStation = require("../models/policeStation"); // Pastikan casing konsisten

// GET: Daftar semua pos polisi
router.get("/", async (req, res) => {
  try {
    const stations = await PoliceStation.find({}); // Perbaiki tanda kurung
    res.json(stations);
  } catch (err) {
    res.status(500).json({ error: err.message }); // Perbaiki kurung kurawal
  }
});

// GET: Pos polisi terdekat
router.get("/nearby", async (req, res) => {
  const { lng, lat } = req.query; // Perbaiki penulisan parameter
  try {
    const stations = await PoliceStation.find({
      koordinat: { // Perbaiki penulisan field
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(lng), parseFloat(lat)] // Perbaiki typo
          },
          $maxDistance: 5000
        }
      }
    });
    res.json(stations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;