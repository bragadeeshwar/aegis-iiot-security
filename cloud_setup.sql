-- Run this in your Supabase Cloud SQL Editor (lzjqvjtkddyuehuypmi)

-- Create the IoT Telemetry table that the Edge Function pushes to
create table if not exists public.iot_telemetry (
  id uuid default gen_random_uuid() primary key,
  device_id text not null,
  temperature numeric not null,
  vibration numeric not null,
  current numeric not null,
  motor_status text not null,
  is_anomaly boolean not null default false,
  timestamp timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Realtime so the React Dashboard auto-updates
alter publication supabase_realtime add table public.iot_telemetry;

-- Disable RLS for Hackathon testing (so React can read it without Auth rules)
alter table public.iot_telemetry disable row level security;
