/**
 * Staging images with Perfect Corp.
 *
 * Every S2S task takes a URL it fetches itself, or a file id it already holds —
 * never raw bytes in the request. Uploading is a three-step handshake: reserve
 * a slot, PUT the bytes to the signed URL you get back, then pass the file id
 * to the task.
 *
 * This matters more than it looks: it is what lets try-on run on localhost.
 * Catalog images are served from our own origin, which Perfect Corp cannot
 * reach in development — but uploaded bytes need no public origin at all.
 */

import https from 'node:https';
import { youcamFetch } from './client.js';

const CONTENT_TYPES = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp',
};

/** Bytes and content type from a data URL, an http(s) URL, or a Buffer. */
export async function toBuffer(source) {
  if (Buffer.isBuffer(source)) return { bytes: source, contentType: 'image/jpeg' };

  const dataUrl = /^data:([^;,]+)[^,]*,(.*)$/s.exec(source || '');
  if (dataUrl) {
    return { bytes: Buffer.from(dataUrl[2], 'base64'), contentType: dataUrl[1] };
  }

  if (/^https?:\/\//i.test(source)) {
    const res = await fetch(source);
    if (!res.ok) throw new Error(`could not fetch image (${res.status})`);
    const ext = new URL(source).pathname.split('.').pop()?.toLowerCase();
    return {
      bytes: Buffer.from(await res.arrayBuffer()),
      contentType: res.headers.get('content-type') || CONTENT_TYPES[ext] || 'image/jpeg',
    };
  }

  throw new Error('unsupported image source');
}

/**
 * Reserve a slot, PUT the bytes, return the file id.
 *
 * `feature` has to match the task the id will be used with — an id minted for
 * skin-analysis is not accepted by cloth-v4.
 */
export async function uploadImage(feature, source) {
  const { bytes, contentType } = await toBuffer(source);

  const reserved = await youcamFetch(`/s2s/v1.0/file/${feature}`, {
    body: {
      files: [{
        content_type: contentType,
        file_name: `mavie.${contentType.split('/')[1] || 'jpg'}`,
        file_size: bytes.length,
      }],
    },
  });

  const file = reserved.result?.files?.[0];
  if (!file) throw new Error('no upload slot returned');

  const put = file.requests[0];
  const url = new URL(put.url);

  await new Promise((resolve, reject) => {
    const req = https.request(
      {
        host: url.hostname,
        path: url.pathname + url.search,
        method: put.method || 'PUT',
        headers: { ...(put.headers || {}), 'Content-Length': bytes.length },
      },
      (res) => {
        res.resume();
        res.on('end', () => (res.statusCode < 300 ? resolve() : reject(new Error(`upload ${res.statusCode}`))));
      },
    );
    req.on('error', reject);
    req.write(bytes);
    req.end();
  });

  return file.file_id;
}
