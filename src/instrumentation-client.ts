import posthog from "posthog-js";

const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;

if (key) {
  try {
    posthog.init(key, {
      // Same-origin reverse proxy (next.config.ts rewrites) — keeps CSP at connect-src 'self'.
      api_host: "/ingest",
      ui_host: "https://us.posthog.com",
      defaults: "2025-05-24",
      person_profiles: "identified_only",
      // No session replay or autocapture: screens show nurse names and credential status.
      disable_session_recording: true,
      autocapture: false,
      capture_dead_clicks: false,
      capture_heatmaps: false,
      disable_surveys: true,
      capture_pageview: "history_change",
      mask_all_text: true,
      mask_all_element_attributes: true,
    });
  } catch (err) {
    console.warn("Analytics failed to initialize", err);
  }
}
