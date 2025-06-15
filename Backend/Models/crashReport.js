const mongoose = require("mongoose");

const crashReportSchema = new mongoose.Schema({
  coordinates: {
    type: [Number], // [longitude, latitude]
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  respondedFacilities: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Hospital" || "PoliceStation" || "FireStation"
  }]
});

module.exports = mongoose.model("CrashReport", crashReportSchema);