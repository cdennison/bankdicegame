import posthog from 'posthog-js';

posthog.init('phc_z43PMt9bXsmftRtsfuYUgZ9WbTD6LarPfsYUWxvXWNbt', {
  api_host: 'https://us.i.posthog.com',
  person_profiles: 'always',
  disable_session_recording: false,
  advanced_disable_feature_flags: true,
  capture_pageview: true,
  capture_pageleave: true,
});

declare global {
  interface Window {
    posthog: typeof posthog;
  }
}
window.posthog = posthog;

export default posthog;
