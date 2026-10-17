const SUPABASE_URL = process.env.SUPABASE_URL || "https://hpvzqfwzryanisreyyhg.supabase.co";

exports.handler = async (event) => {
  const headers = {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff"
  };

  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers, body: "" };
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: JSON.stringify({ ok: false, error: "Method not allowed" }) };
  }

  if (Buffer.byteLength(event.body || "", "utf8") > 12000) {
    return { statusCode: 413, headers, body: JSON.stringify({ ok: false, error: "Request too large" }) };
  }

  let input;
  try {
    input = JSON.parse(event.body || "{}");
    if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Invalid payload");
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: "Invalid request" }) };
  }

  if (input["bot-field"]) {
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, stored: false }) };
  }

  const clean = (value, max) => String(value ?? "").trim().slice(0, max);
  const name = clean(input.name, 120);
  const phone = clean(input.phone, 50);
  const location = clean(input.location, 300);
  const vehicle = clean(input.vehicle, 100);
  const tireSize = clean(input.size, 80);
  const quantityRaw = clean(input.qty, 12);
  const quantity = quantityRaw ? Number(quantityRaw) : null;
  const service = clean(input.service, 120);
  const pageUrl = clean(input.page_url, 500);

  if (name.length < 2 || phone.replace(/\D/g, "").length < 7 || location.length < 2) {
    return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: "Please check name, phone and location." }) };
  }
  if (quantity !== null && (!Number.isInteger(quantity) || quantity < 1 || quantity > 1000)) {
    return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: "Invalid quantity." }) };
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    // Do not pretend CRM storage succeeded. Netlify Forms is the independent fallback.
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
        description: null,
        source: "website",
        page_url: pageUrl || null,
        status: "new"
      })
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error("Supabase insert failed:", response.status, detail.slice(0, 300));
      return { statusCode: 502, headers, body: JSON.stringify({ ok: false, error: "Could not save to service system" }) };
    }

    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, stored: true }) };
  } catch (error) {
    console.error("Quote function error:", error);
    return { statusCode: 502, headers, body: JSON.stringify({ ok: false, error: "Temporary storage error" }) };
  }
};
