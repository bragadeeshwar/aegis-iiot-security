#include <WiFi.h>
#include <HTTPClient.h>

// Replace with your Network credentials
const char* ssid = "Hackathon";
const char* password = "Hack@2025";

// Your CLOUD Supabase settings (from lzjqvjjtkddyuehuypmi project)
const char* supabase_url = "https://lzjqvjjtkddyuehuypmi.supabase.co/functions/v1/ai-anomaly-detector";
const char* anon_key = "sb_publishable_lmGrwjvHNoivP5sq2af5Rg_VnUI1Fg4";

// Sensor Pins
const int vibrationPin = 34; // Analog pin for vibration sensor
const int tempPin = 35;      // Analog pin for LM35 or similar temp sensor
const int currentPin = 32;   // Analog pin for current sensor (ACS712)
const int motorControlPin = 26; // Digital OUTPUT pin to control the motor relay/driver

void setup() {
  Serial.begin(115200);

  // Connect to Wi-Fi
  WiFi.begin(ssid, password);
  Serial.println("Connecting to WiFi...");
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.print(".");
  }
  Serial.println("");
  Serial.println("WiFi connected.");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());

  pinMode(vibrationPin, INPUT);
  pinMode(tempPin, INPUT);
  pinMode(currentPin, INPUT);

  // Initialize motor control pin
  pinMode(motorControlPin, OUTPUT);
  digitalWrite(motorControlPin, HIGH); // Start in "Enabled" state
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    
    // Read actual sensors
    // Note: You may need to calibrate these conversions depending on your exact sensor models
    float vibration_raw = analogRead(vibrationPin);
    float vibration = vibration_raw * (3.3 / 4095.0); // Example conversion to voltage/g-force
    
    float temp_raw = analogRead(tempPin);
    float temperature = (temp_raw * (3.3 / 4095.0)) * 100.0; // Assuming LM35: 10mV/C, but ESP32 ADC is complex
    
    float current_raw = analogRead(currentPin);
    // ADC to voltage to current conversion for ACS712
    float current_voltage = current_raw * (3.3 / 4095.0);
    float current = abs((current_voltage - 1.65) / 0.185); // Assuming 5A version, offset 1.65V

    // Detect Motor Status based on current
    String motorStatus = current > 0.5 ? "running" : "stopped";

    // Prepare JSON payload
    HTTPClient http;
    http.begin(supabase_url);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("Authorization", String("Bearer ") + anon_key);

    String payload = "{\"device_id\":\"ESP32-Motor-Sensor\",\"temperature\":" + String(temperature) + 
                     ",\"vibration\":" + String(vibration) + 
                     ",\"current\":" + String(current) + 
                     ",\"motor_status\":\"" + motorStatus + "\"}";

    Serial.println("Sending Payload: " + payload);

    int httpResponseCode = http.POST(payload);

    if (httpResponseCode > 0) {
      Serial.print("HTTP Response code: ");
      Serial.println(httpResponseCode);
      String response = http.getString();
      Serial.println("Server Response: " + response);

      // Physical Isolation Logic: Check if the AI has isolated this device
      if (response.indexOf("\"status\":\"isolated\"") != -1) {
        Serial.println("⚠️ Aegis AI: DEVICE ISOLATED. SHUTTING DOWN MOTOR!");
        digitalWrite(motorControlPin, LOW); // Kill the physical motor power
      } else {
        // Device is safe or re-authorized
        digitalWrite(motorControlPin, HIGH); 
      }
    } else {
      Serial.print("Error code: ");
      Serial.println(httpResponseCode);
    }
    
    http.end();
  } else {
    Serial.println("WiFi Disconnected");
  }

  // Delay before next reading (e.g. 5 seconds)
  delay(5000);
}
