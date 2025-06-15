#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

const char* ssid = "YourWiFi";
const char* password = "YourPassword";
const String backendUrl = "https://your-backend.com/api/crash";

void sendCrashData(float lat, float lon, float impactForce) {
  WiFiClientSecure client;
  HTTPClient http;
  
  // Setup SSL (Opsional, tapi direkomendasikan)
  client.setInsecure(); // Skip SSL verification untuk testing

  // Buat payload JSON
  DynamicJsonDocument doc(200);
  doc["device_id"] = "ESP32-001";
  doc["location"] = String(lat, 6) + "," + String(lon, 6);
  doc["impact"] = impactForce;
  
  String payload;
  serializeJson(doc, payload);

  // Kirim request
  http.begin(client, backendUrl);
  http.addHeader("Content-Type", "application/json");
  int httpCode = http.POST(payload);

  // Handle response
  if (httpCode == HTTP_CODE_OK) {
    Serial.println("Data terkirim!");
    String response = http.getString();
    Serial.println(response);
  } else {
    Serial.printf("Error: %s\n", http.errorToString(httpCode).c_str());
  }
  
  http.end();
}