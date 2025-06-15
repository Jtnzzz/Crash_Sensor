const mongoose = require('mongoose');
const CrashReport = require("../models/crashReport");

// Simpan data kecelakaan ke MongoDB
exports.receiveCrashData = async (req, res) => {
  try {
    const { device_id, location, impact } = req.body;
    
    const report = new CrashReport({
      deviceId: device_id,
      location: {
        type: "Point",
        coordinates: location.split(',').map(Number)
      },
      impactForce: impact,
      timestamp: new Date()
    });

    await report.save();
    
    // Kirim respons ke ESP32
    res.status(200).json({ 
      status: "success",
      message: "Data tersimpan di database",
      reportId: report._id 
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};