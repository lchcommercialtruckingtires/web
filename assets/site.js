const PHONE = "18048210538";

function buildQuoteMessage(formData) {
  return [
    "LCH TRUCKING QUOTE REQUEST",
    "Name: " + (formData.get("name") || ""),
    "Phone: " + (formData.get("phone") || ""),
    "Vehicle: " + (formData.get("vehicle") || "Not provided"),
    "Tire size: " + (formData.get("size") || "Not provided"),
    "Quantity: " + (formData.get("qty") || "Not provided"),
    "Location: " + (formData.get("location") || ""),
    "Service: " + (formData.get("service") || "Not provided"),
    "Page: " + window.location.href
  ].join("\n");
}

async function postWithTimeout(url, options, timeoutMs = 10000) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    window.clearTimeout(timeout);
  }
}

async function quote(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;

  const data = new FormData(form);
  const status = form.querySelector("#quote-status");
  const submit = form.querySelector('button[type="submit"]');
  const label = submit && submit.querySelector(".quote-submit-label");
  const message = buildQuoteMessage(data);
  const values = Object.fromEntries(data.entries());
  values.page_url = window.location.href;
  values.source = "website";
  values["form-name"] = form.getAttribute("name") || "quote-request";

  // Honeypot: silently ignore automated submissions.
  if (data.get("bot-field")) return;

  if (submit) submit.disabled = true;
  if (label) label.textContent = "SENDING REQUEST…";
  if (status) {
    status.classList.remove("is-error");
    status.textContent = "Sending your request securely…";
  }

  let netlifySaved = false;
  let supabaseSaved = false;

  try {
    const encoded = new URLSearchParams();
    data.forEach((value, key) => encoded.append(key, String(value)));
    encoded.set("form-name", form.getAttribute("name") || "quote-request");
    const response = await postWithTimeout(form.getAttribute("action") || "/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
      body: encoded.toString()
    });
    netlifySaved = response.ok;
  } catch (error) {
    console.warn("Netlify Forms could not confirm receipt.", error);
  }

  try {
    const response = await postWithTimeout("/.netlify/functions/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values)
    });
    if (response.ok) {
      const result = await response.json();
      supabaseSaved = result.stored === true;
    }
  } catch (error) {
    console.warn("Supabase CRM could not confirm receipt.", error);
  }

  const received = netlifySaved || supabaseSaved;
  if (status) {
    status.classList.toggle("is-error", !received);
    if (supabaseSaved) {
      status.textContent = "Request received and saved to the service system. WhatsApp will open so you can share the details directly too.";
    } else if (netlifySaved) {
      status.textContent = "Request received by the website. WhatsApp will open so you can share the details directly too.";
    } else {
      status.textContent = "The website could not confirm that the request was saved. WhatsApp will open with your details so you can contact LCH directly.";
    }
  }

  if (received && typeof window.dataLayer !== "undefined") {
    window.dataLayer.push({
      event: "quote_form_submit",
      form_name: "quote-request",
      netlify_form_saved: netlifySaved,
      supabase_saved: supabaseSaved
    });
  }

  if (submit) submit.disabled = false;
  if (label) label.textContent = "REQUEST QUOTE";

  // WhatsApp is the direct-contact fallback and opens with the request prefilled.
  window.setTimeout(() => {
    window.location.href = "https://wa.me/" + PHONE + "?text=" + encodeURIComponent(message);
  }, 1100);
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".spotlight").forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      if (event.pointerType === "touch") return;
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--spot-x", (event.clientX - rect.left) + "px");
      card.style.setProperty("--spot-y", (event.clientY - rect.top) + "px");
    }, { passive: true });
  });

  document.querySelectorAll('a[href^="tel:"]').forEach((link) => {
    link.addEventListener("click", () => {
      if (typeof window.dataLayer !== "undefined") {
        window.dataLayer.push({
          event: "click_to_call",
          phone_number: link.getAttribute("href").replace("tel:", "")
        });
      }
    });
  });

  document.querySelectorAll('a[href*="wa.me"]').forEach((link) => {
    link.addEventListener("click", () => {
      if (typeof window.dataLayer !== "undefined") {
        window.dataLayer.push({ event: "click_whatsapp", link_url: link.href });
      }
    });
  });
});
