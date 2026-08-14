/**
 * YouCam MAKEUP VTO
 *
 * Categories: foundation, blush, bronzer, contour, eyeliner, eyeshadow,
 * eyebrows, eyelashes/mascara, highlight, lip color, lip liner.
 *
 * ⚠️ Availability is account- and plan-dependent. Verify in the API Playground
 * before building UI that assumes it. MAVIE degrades to a described makeup
 * direction, which is still a complete part of the look.
 */

import { hasCredentials, youcamFetch, pollTask } from './client.js';

export async function tryOnMakeup({ userImage, makeup }) {
  if (!hasCredentials()) {
    return mockResult(makeup, 'no_credentials');
  }

  try {
    const task = await youcamFetch('/s2s/v1.0/task/makeup-tryon', {
      body: {
        request_id: Date.now(),
        payload: {
          file_sets: { src_ids: [userImage] },
          actions: [{
            id: 0,
            params: {
              foundation: { color: makeup.vto_payload.foundation, intensity: 60 },
              eyeshadow: { color: makeup.vto_payload.eyeshadow, intensity: intensityValue(makeup.intensity) },
              blush: { color: makeup.vto_payload.blush, intensity: 45 },
              lipstick: { color: makeup.vto_payload.lipstick, intensity: intensityValue(makeup.intensity) + 10 },
            },
          }],
        },
      },
    });

    const taskId = task.result?.task_id || task.task_id;
    const done = await pollTask(`/s2s/v1.0/task/makeup-tryon?task_id=${taskId}`);
    const url = done.result?.results?.[0]?.data?.[0]?.url || done.result?.url;

    if (!url) throw new Error('No makeup try-on image returned');
    return { result_url: url, mocked: false };
  } catch (err) {
    console.warn('[makeup-vto] falling back to described direction:', err.message);
    return mockResult(makeup, 'live_call_failed');
  }
}

function intensityValue(intensity) {
  return { light: 35, 'light-medium': 50, medium: 65, 'medium-bold': 80 }[intensity] ?? 50;
}

function mockResult(makeup, reason) {
  return {
    result_url: null,
    mocked: true,
    reason,
    swatches: makeup?.vto_payload || null,
    direction: makeup?.direction || null,
    message: reason === 'no_credentials'
      ? 'Makeup direction shown as swatches. Add YouCam credentials for live makeup try-on.'
      : "MAVIE couldn't reach the makeup try-on service just now — here's the direction as swatches.",
  };
}
