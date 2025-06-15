const mongoose = require("mongoose");

const hospitalSchema = new mongoose.Schema({
  nama: { type: String, required: true },
  alamat: { type: String, required: true },
  telepon: { type: [String], required: true },
  layanan: { type: [String], default: [] },
  koordinat: {
    type: { type: String, default: "Point" },
    coordinates: { type: [Number], required: true }
  }
}, { timestamps: true });

hospitalSchema.index({ koordinat: "2dsphere" });
module.exports = mongoose.model("Hospital", hospitalSchema);