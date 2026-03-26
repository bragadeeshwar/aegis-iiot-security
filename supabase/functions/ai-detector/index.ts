import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { GoogleGenerativeAI } from "npm:@google/generative-ai";

const genAI = new GoogleGenerativeAI(Deno.env.get("AIzaSyBv61JPMd0P0jW_lp13orqG3AnfwY-EQas")!);

Deno.serve(async (req) => {
  const { record } = await req.json(); // This is the new sensor reading
  
  // Ask Gemini if this reading is dangerous
  const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
  const prompt = `Analyze this sensor reading: ${record.sensor_type} = ${record.value}. Is this dangerous? Reply ONLY with JSON: {"is_dangerous": boolean, "description": string}`;
  
  const result = await model.generateContent(prompt);
  const analysis = JSON.parse(result.response.text());

  // If dangerous, write to the threats table
  if (analysis.is_dangerous) {
    // (We will add the database write code here in the next step)
    console.log("Threat detected:", analysis.description);
  }

  return new Response("OK");
});