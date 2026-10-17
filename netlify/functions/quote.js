const SUPABASE_URL = process.env.SUPABASE_URL || "https://hpvzqfwzryanisreyyhg.supabase.co";

exports.handler = async (event) => {
  const headers = {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "access-control-allow-origin": "*",
    "access-control-allow-headers": "content-type",
    "access-control-allow-methods": "POST, OPTIONS"
  };

  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers, body: "" };
  if (event.httpMethod !== "POST") return { statusCode: 405, headers, body: JSON.stringify({ ok: false, error: "Method not allowed" }) };

  let input;
  try {
    input = JSON.parse(event.body || "{}");
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: "Invalid request" }) };
  }

  // Honeypot field for basic bot filtering.
  if (input["bot-field"]) return { statusCode: 200, headers, body: JSON.stringify({ ok: true, stored: false }) };

  const name = String(input.name || "").trim().slice(0, 120);
  const phone = String(input.phone || "").trim().slice(0, 50);
  const location = String(input.location || "").trim().slice(0, 300);
  const vehicle = String(input.vehicle || "").trim().slice(0, 100);
  const tireSize = String(input.size || "").trim().slice(0, 80);
  const quantityRaw = String(input.qty || "").trim();
  const quantity = quantityRaw ? Number.parseInt(quantityRaw, 10) : null;
  const service = String(input.service || "").trim().slice(0, 120);
  const pageUrl = String(input.page_url || "").trim().slice(0, 500);

  if (name.length < 2 || phone.length < 7 || location.length < 2) {
    return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: "Please check name, phone and location." }) };
  }
  if (quantity !== null && (!Number.isInteger(quantity) || quantity < 1 || quantity > 1000)) {
    return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: "Invalid quantity." }) };
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    // The browser still submits to Netlify Forms as a durable fallback until the
    // owner adds the Supabase secret in Netlify environment variables.
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, stored: false, reason: "supabase_not_configured" }) };
  }

  try {
    const response = await fetch(SUPABASE_URL + "/rest/v1/service_requests", {
      method: "POST",
      headers: {
        "apikey": serviceRoleKey,
        "authorization": "Bearer " + serviceRoleKey,
        "content-type": "application/json",
        "prefer": "return=minimal"
      },
      body: JSON.stringify({
        name,
        phone,
        vehicle_type: vehicle || null,
        tire_size: tireSize || null,
        quantity,
        service_location: location,
        service_type: service || null,
        source: "website",
        page_url: pageUrl || null,
        status: "new"
      })
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error("Supabase insert failed:", response.status, detail.slice(0, 300));
      return { statusCode: 502, headers, body: JSON.stringify({ ok: false, error: "Could not save to CRM" }) };
    }

    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, stored: true }) };
  } catch (error) {
    console.error("Quote function error:", error);
    return { statusCode: 502, headers, body: JSON.stringify({ ok: false, error: "Temporary storage error" }) };
  }
};
