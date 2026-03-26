CREATE TABLE iot_telemetry (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT NOT NULL,
  temperature FLOAT NOT NULL,
  vibration FLOAT NOT NULL,
  current FLOAT NOT NULL,
  motor_status TEXT NOT NULL,
  is_anomaly BOOLEAN DEFAULT FALSE,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE iot_telemetry;
