import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// This edge function runs on Supabase (Local or Cloud)
// It performs a rudimentary AI detection / threshold check and then inserts the data
serve(async (req) => {
  // CORS headers
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    }})
  }

  try {
    const payload = await req.json();
    const { device_id, temperature, vibration, current, motor_status } = payload;
    
    // Make a real-time predictive request to Llama-3 via Groq
    const groqKey = Deno.env.get("GROQ_API_KEY");
    let is_anomaly = false;
    let prediction = "Motor operating normally.";

    if (groqKey) {
      try {
        const aiResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${groqKey}`
          },
          body: JSON.stringify({
            model: "llama-3.1-8b-instant",
            messages: [{
              role: "system", 
              content: `You are an IoT anomaly prediction engine. Analyze these motor telemetry readings: Temp: ${temperature}C, Vibration: ${vibration}g, Current: ${current}A. Output exactly one word: 'ANOMALY' or 'NORMAL'.`
            }]
          })
        });
        const aiData = await aiResponse.json();
        const llmPrediction = aiData.choices?.[0]?.message?.content?.toUpperCase() || "";
        if (llmPrediction.includes("ANOMALY")) {
          is_anomaly = true;
        }
      } catch (err) {
        console.error("Groq AI Error", err);
        // Fallback mathematical logic
        if (temperature > 85.0 || vibration > 5.0 || current > 20.0) is_anomaly = true;
      }
    } else {
      // Fallback mathematical logic if key is missing
      if (temperature > 85.0 || vibration > 5.0 || current > 20.0) is_anomaly = true;
    }
  
    // Connect to Supabase
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
  
    // Insert into DB. The ESP32 does not do this itself; it relies on the edge function
    const { data, error } = await supabase
      .from("iot_telemetry")
      .insert([{ device_id, temperature, vibration, current, motor_status, is_anomaly }])
      .select();
  
    if (error) {
      console.error(error);
      return new Response(JSON.stringify({ error: error.message }), { status: 400 });
    }

    // Fetch existing device state to see if we need to alert
    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(device_id);
    const orFilter = isUuid ? `id.eq.${device_id},name.ilike.%Motor%` : `name.ilike.%Motor%`;

    const { data: deviceData } = await supabase
      .from('devices')
      .select('status, risk_score')
      .or(orFilter)
      .limit(1);
      
    const device = deviceData?.[0];

    // Determine intended risk score
    // Set to 95 for faults to trigger >90 auto-isolation
    let risk_score = (motor_status === 'running' && !is_anomaly) ? 0 : 95;
    let device_status = device?.status || 'online';

    if (risk_score > 90 && device_status !== 'isolated') {
      // Auto-isolate the device when risk score is > 90
      device_status = 'isolated';
    } else if (device_status === 'isolated') {
      // Keep it isolated until user manually restores it. Also keep risk score high.
      risk_score = 95;
    } else {
      device_status = 'online';
    }

    // Update the device in the devices table
    await supabase
      .from('devices')
      .update({ risk_score, status: device_status })
      .or(orFilter);

    // If there is a new fault leading to isolation, insert a threat
    if (device_status === 'isolated' && (!device || device.status !== 'isolated')) {
      await supabase
        .from('threats')
        .insert([{
          name: is_anomaly ? "Motor Anomaly Detected" : "Motor Fault / Stopped",
          severity: "high",
          status: "active",
          target: device_id,
          description: is_anomaly ? `Anomaly detected with Temp: ${temperature}C, Vib: ${vibration}g, Cur: ${current}A` : "Motor operation completely stopped unexpectedly.",
          source: "AI Anomaly Detector"
        }]);
    }
  
    return new Response(JSON.stringify({ success: true, is_anomaly, status: device_status, data }), {
      headers: { "Content-Type": "application/json" },
      status: 200
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
