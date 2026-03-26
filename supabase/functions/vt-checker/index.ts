import "jsr:@supabase/functions-js/edge-runtime.d.ts";

Deno.serve(async (req) => {
  const { ip } = await req.json();
  const VT_API_KEY = Deno.env.get("346cb6200b95e5dcb2d5ebbb662f146c32456b3d2596f96d4174e5daeff92de7");

  // Call VirusTotal API
  const response = await fetch(`https://www.virustotal.com/api/v3/ip_addresses/${ip}`, {
    headers: { "x-apikey": VT_API_KEY! }
  });
  
  const data = await response.json();
  const maliciousCount = data.data.attributes.last_analysis_stats.malicious;

  return new Response(JSON.stringify({ is_malicious: maliciousCount > 0 }), {
    headers: { "Content-Type": "application/json" }
  });
});