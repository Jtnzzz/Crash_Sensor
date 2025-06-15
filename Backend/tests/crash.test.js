const request = require("supertest");
const app = require("../app");
const CrashReport = require("../models/crashReport");

describe("POST /api/crash", () => {
  it("should log crash and return nearby facilities", async () => {
    const res = await request(app)
      .post("/api/crash")
      .send({ coordinates: [112.7966, -7.2892] });
    
    expect(res.status).toBe(200);
    expect(res.body.facilities.length).toBeGreaterThan(0);
    
    const report = await CrashReport.findOne();
    expect(report.coordinates).toEqual([112.7966, -7.2892]);
  });
});