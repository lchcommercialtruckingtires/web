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
  const encoded = new URLSearchParams();
  data.forEach((value, key) => encoded.append(key, String(value)));
  encoded.set("form-name", form.getAttribute("name") || "quote-request");

  if (data.get("bot-field")) return;

  if (submit) submit.disabled = true;
  if (label) label.textContent = "SENDING REQUEST…";
  if (status) {
    status.classList.remove("is-error");
    status.textContent = "Sending your request securely…";
  }

  try {
    const response = await fetch(form.getAttribute("action") || "/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
      body: encoded.toString()
    });
    if (!response.ok) throw new Error("Form submission failed");
    if (status) status.textContent = "Request sent. WhatsApp is opening so you can share the details directly too.";
    window.setTimeout(() => {
      window.location.href = "https://wa.me/" + PHONE + "?text=" + encodeURIComponent(message);
    }, 250);
    form.reset();
    if (typeof window.dataLayer !== "undefined") {
      window.dataLayer.push({ event: "quote_form_submit", form_name: "quote-request" });
    }
  } catch (error) {
    if (status) {
      status.classList.add("is-error");
      status.textContent = "We couldn't submit the online form. Please call (804) 821-0538 or use WhatsApp to send your request.";
    }
  } finally {
    if (submit) submit.disabled = false;
    if (label) label.textContent = "REQUEST QUOTE";
  }
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
