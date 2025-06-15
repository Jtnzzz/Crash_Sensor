const express = require("express");
const router = express.Router();
const FireStation = require("../models/fireStation"); // Casing konsisten

// GET: Daftar semua pos DAMKAR
router.get("/", async (req, res) => {
  try {
    const stations = await FireStation.find({});
    res.json(stations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET: DAMKAR terdekat
router.get("/nearby", async (req, res) => {
  const { lng, lat } = req.query;
  try {
    const stations = await FireStation.find({
      koordinat: { // Field name harus konsisten
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(lng), parseFloat(lat)]
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