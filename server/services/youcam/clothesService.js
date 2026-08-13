/**
 * YouCam CLOTHES / APPAREL VTO
 *
 * Workflow: user photo + garment image → generated try-on result.
 * Supports upper-body, lower-body and full-body garments.
 *
 * When credentials are absent MAVIE returns a structured "composite" descriptor
 * instead of an image. The client renders that as a styled preview, so the
 * decision pipeline stays fully demoable without keys.
 */

import { hasCredentials, youcamFetch, pollTask } from './client.js';

export async function tryOnClothes({ userImage, items = [] }) {
  const garments = items.filter((i) => ['upper', 'lower', 'full'].includes(i.body_area));

  if (!hasCredentials()) {
    return mockResult(userImage, garments, 'no_credentials');
  }

  try {
    const task = await youcamFetch('/s2s/v1.0/task/cloth-tryon', {
      body: {
        request_id: Date.now(),
        payload: {
          file_sets: {
            src_ids: [userImage],
            ref_ids: garments.map((g) => g.image_url).filter(Boolean),
          },
          actions: [{
            id: 0,
            params: {
              cloth_category: categoryOf(garments),
            },
          }],
        },
      },
    });

    const taskId = task.result?.task_id || task.task_id;
    const done = await pollTask(`/s2s/v1.0/task/cloth-tryon?task_id=${taskId}`);
    const url = done.result?.results?.[0]?.data?.[0]?.url || done.result?.url;

    if (!url) throw new Error('No try-on image returned');

    return { result_url: url, garments: garments.map((g) => g.id), mocked: false };
  } catch (err) {
    console.warn('[vto] falling back to composite preview:', err.message);
    return mockResult(userImage, garments, 'live_call_failed');
  }
}

function categoryOf(garments) {
  if (garments.some((g) => g.body_area === 'full')) return 'full_body';
  const hasUpper = garments.some((g) => g.body_area === 'upper');
  const hasLower = garments.some((g) => g.body_area === 'lower');
  if (hasUpper && hasLower) return 'full_body';
  return hasLower ? 'lower_body' : 'upper_body';
}

/**
 * Structured composite the client can render as an editorial preview:
 * the user's photo plus the actual colour and silhouette of each real garment.
 */
function mockResult(userImage, garments, reason) {
  return {
    result_url: null,
    mocked: true,
    reason,
    composite: {
      user_image: userImage || null,
      layers: garments.map((g) => ({
        id: g.id,
        name: g.name,
        hex: g.hex,
        body_area: g.body_area,
        fit: g.fit,
      })),
    },
    garments: garments.map((g) => g.id),
    message: 'Preview generated locally. Add YouCam credentials for a photoreal try-on.',
  };
}
