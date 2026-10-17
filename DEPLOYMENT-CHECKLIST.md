# LCH website deployment checklist

This site is a static HTML/CSS/JavaScript site with a Netlify Function. The function must be deployed for the quote form to save directly into Supabase.

## Netlify settings

1. Confirm the site's publish directory is the repository root (.) and functions directory is netlify/functions. The included netlify.toml declares both.
2. In Site configuration → Environment variables, add the following server-side variable for production and branch-deploy contexts that should receive requests:
   - SUPABASE_SERVICE_ROLE_KEY — secret value from Supabase API keys. Mark as secret. Never put it in HTML, JavaScript, GitHub, or a public message.
3. Optional: set SUPABASE_URL to the project's API URL. The function has the current project URL as a fallback.
4. Trigger a new deploy after changing environment variables so the function receives the new configuration.
5. In Netlify Forms, verify the quote-request form is detected after deploy. Configure an email notification to the business inbox if you want incoming form requests sent by email.

## Before publishing the redesign

- Test a quote from a phone and desktop; confirm a Netlify Forms submission is visible.
- Confirm a test request appears in Supabase public.service_requests with status new.
- Confirm click-to-call and WhatsApp events are visible in the configured GTM/GA4 setup, if installed.
- Verify that the business truly offers 24/7 response before advertising it as guaranteed hours.
- Confirm service areas and mobile dispatch availability before promising a specific city or response time.
- Keep production on main until the branch preview and form flow have been checked.

## Security notes

- The service-role key belongs only in Netlify server-side environment variables. Never expose it through a VITE_ or NEXT_PUBLIC_ variable.
- Public quote submissions are validated server-side. Add CAPTCHA or a rate-limit provider if spam becomes material.
- The current Supabase service_requests table has RLS enabled and no public policies; the server-side function uses the secret key to insert requests without making the table publicly writable.
