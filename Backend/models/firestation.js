const mongoose = require("mongoose");

const fireStationSchema = new mongoose.Schema({
  nama: { type: String, required: true },
  alamat: { type: String, required: true },
  telepon: [String],
  layanan: [String], // Contoh: ["Pemadaman", "Penyelamatan", "Tanggap Darurat"]
  koordinat: {
    type: { type: String, default: "Point" },
    coordinates: [Number]
  }
});

fireStationSchema.index({ koordinat: "2dsphere" });
module.exports = mongoose.model("FireStation", fireStationSchema);