const express = require("express");
const router = express.Router();
const Hospital = require("../models/hospitals");

// GET: Semua rumah sakit
router.get("/", async (req, res) => {
  try {
    const hospitals = await Hospital.find({});
    res.json(hospitals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// GET: Rumah sakit terdekat (nearby)
router.get("/nearby", async (req, res) => {
  try {
    const { lat, lng, maxDistance = 5000 } = req.query;

    // Validasi parameter
    if (!lat || !lng) {
      return res.status(400).json({ error: "Parameter lat dan lng wajib diisi" });
    }

    const hospitals = await Hospital.find({
      koordinat: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(lng), parseFloat(lat)], // [longitude, latitude]
          },
          $maxDistance: parseInt(maxDistance),
        },
      },
    });

    res.json(hospitals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;