const Hospital = require("../models/hospitals");
const PoliceStation = require("../models/policeStation");
const FireStation = require("../models/fireStation");
const CrashReport = require("../models/crashReport");

// Deteksi fasilitas terdekat
exports.detectNearbyFacilities = async (coordinates) => {
  const [hospitals, police, damkar] = await Promise.all([
    Hospital.find({
      koordinat: { 
        $near: { 
          $geometry: { type: "Point", coordinates },
          $maxDistance: 5000
        }
      }
    }),
    PoliceStation.find({
      koordinat: { 
        $near: { 
          $geometry: { type: "Point", coordinates },
          $maxDistance: 5000
        }
      }
    }),
    FireStation.find({
      koordinat: { 
        $near: { 
          $geometry: { type: "Point", coordinates },
          $maxDistance: 5000
        }
      }
    })
  ]);
  
  return [...hospitals, ...police, ...damkar];
};

// Simpan laporan kecelakaan
exports.logCrashReport = async (coordinates, facilities) => {
  const report = await CrashReport.create({
    coordinates,
    respondedFacilities: facilities.map(f => f._id)
  });
  return report;
};