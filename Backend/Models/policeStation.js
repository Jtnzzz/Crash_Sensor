const mongoose = require("mongoose");

const policeStationSchema = new mongoose.Schema({
  nama: { type: String, required: true },
  alamat: { type: String, required: true },
  telepon: [String],
  layanan: [String], // Contoh: ["Laka Lantas", "Pengaduan", "Pos Polisi"]
  koordinat: {
    type: { type: String, default: "Point" },
    coordinates: [Number] // [longitude, latitude]
  }
});

policeStationSchema.index({ koordinat: "2dsphere" });
module.exports = mongoose.model("PoliceStation", policeStationSchema);