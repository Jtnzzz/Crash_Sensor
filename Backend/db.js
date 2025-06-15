const mongoose = require("mongoose");
require("dotenv").config();

// Di db.js, tambahkan logging
const connectDB = async () => {
  try {
    console.log("Mencoba terhubung ke:", process.env.MONGODB_URI);
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("🟢 MongoDB Atlas Connected!");
    
    // Verifikasi database dan koleksi
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log("Koleksi yang tersedia:", collections.map(c => c.name));
  } catch (err) {
    console.error("🔴 MongoDB Connection Error:", err.message);
    process.exit(1);
  }
};

module.exports = connectDB;