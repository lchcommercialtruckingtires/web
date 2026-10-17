const PHONE = "18048210538";

function buildQuoteMessage(formData) {
  return [
    "LCH TRUCKING QUOTE REQUEST",
    "Name: " + (formData.get("name") || ""),
    "Phone: " + (formData.get("phone") || ""),
    "Vehicle: " + (formData.get("vehicle") || ""),
    "Tire size: " + (formData.get("size") || "Not provided"),
    "Quantity: " + (formData.get("qty") || "Not provided"),
    "Location: " + (formData.get("location") || ""),
    "Service: " + (formData.get("service") || ""),
    "Page: " + window.location.href
  ].join("\n");
}

async function quote(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const status = form.querySelector("#quote-status");
  const submit = form.querySelector('button[type="submit"]');
  const label = submit && submit.querySelector(".quote-submit-label");
  const message = buildQuoteMessage(data);
  const values = Object.fromEntries(data.entries());
  values.page_url = window.location.href;
  values["form-name"] = form.getAttribute("name") || "quote-request";

  if (data.get("bot-field")) return;

  if (submit) submit.disabled = true;
  if (label) label.textContent = "SENDING REQUEST…";
  if (status) {
    status.classList.remove("is-error");
    status.textContent = "Sending your request…";
  }

  let netlifySaved = false;
  let supabaseSaved = false;

  try {
    const encoded = new URLSearchParams();
    data.forEach((value, key) => encoded.append(key, String(value)));
    encoded.set("form-name", form.getAttribute("name") || "quote-request");

    const netlifyResponse = await fetch(form.getAttribute("action") || "/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
      body: encoded.toString()
    });
    if (!netlifyResponse.ok) throw new Error("Netlify form submission failed");
    netlifySaved = true;
  } catch (error) {
    if (status) {
      status.classList.add("is-error");
      status.textContent = "The online form could not confirm receipt. You can still send the request through WhatsApp or call us.";
    }
  }

  try {
    const crmResponse = await fetch("/.netlify/functions/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values)
    });
    if (crmResponse.ok) {
      const crmResult = await crmResponse.json();
      supabaseSaved = crmResult.stored === true;
    }
  } catch (error) {
    // Netlify Forms remains the fallback if the CRM function is not configured.
  }

  if (netlifySaved && status) {
    status.classList.remove("is-error");
    status.textContent = supabaseSaved
      ? "Request received and saved. WhatsApp is opening so you can share the details directly too."
      : "Request received by the website. WhatsApp is opening so you can share the details directly too.";
  }

  if (netlifySaved && typeof window.dataLayer !== "undefined") {
    window.dataLayer.push({ event: "quote_form_submit", form_name: "quote-request", supabase_saved: supabaseSaved });
  }

  if (submit) submit.disabled = false;
  if (label) label.textContent = "REQUEST QUOTE";

  // The message includes the details even if the CRM secret is not configured yet.
  window.setTimeout(() => {
    window.location.href = "https://wa.me/" + PHONE + "?text=" + encodeURIComponent(message);
  }, 700);
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
        window.dataLayer.push({ event: "click_to_call", phone_number: link.getAttribute("href").replace("tel:", "") });
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
