import type { Config } from '@netlify/functions';
import { getStore } from '@netlify/blobs';
import { eq } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { siteImages } from '../../db/schema.js';

const OWNER_EMAIL = 'abhigupta1176@gmail.com';
const SUPABASE_URL = 'https://tosdqjdvjdgntsrfqgot.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_9UzPFCT3BImOfltGmLZt2A_nQovxSBV';
const json = (body: unknown, status = 200) => Response.json(body, { status });
const getImageStore = () => getStore({ name: 'website-images', consistency: 'strong' });

async function requireOwner(req: Request) {
  const authorization = req.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) throw new Error('Admin session required.');
  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: SUPABASE_PUBLISHABLE_KEY, authorization },
  });
  const user = await response.json().catch(() => null);
  if (!response.ok || user?.email?.toLowerCase() !== OWNER_EMAIL) throw new Error('Admin session is not valid.');
}

function safeSlot(value: unknown) {
  const slot = String(value || '').trim();
  if (!/^[a-z0-9-]{2,80}$/.test(slot)) throw new Error('Invalid image location.');
  return slot;
}

export default async (req: Request) => {
  try {
    const url = new URL(req.url);
    const imageStore = getImageStore();
    const fileKey = url.pathname.split('/api/site-images/file/')[1];

    if (req.method === 'GET' && fileKey) {
      const blobKey = decodeURIComponent(fileKey);
      const [record] = await db.select().from(siteImages).where(eq(siteImages.blobKey, blobKey)).limit(1);
      const image = await imageStore.get(blobKey, { type: 'arrayBuffer' });
      if (!image) return new Response('Image not found', { status: 404 });
      return new Response(image as ArrayBuffer, {
        headers: {
          'Content-Type': record?.mimeType || 'image/jpeg',
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }

    if (req.method === 'GET') {
      const rows = await db.select().from(siteImages);
      return json({ images: Object.fromEntries(rows.map((row) => [row.slotKey, row.url])) });
    }

    await requireOwner(req);

    if (req.method === 'POST') {
      const form = await req.formData();
      const slot = safeSlot(form.get('slot'));
      const file = form.get('image');
      if (!(file instanceof File) || !file.type.startsWith('image/')) return json({ error: 'Please select an image file.' }, 400);
      if (file.size > 5 * 1024 * 1024) return json({ error: 'Image must be smaller than 5MB.' }, 400);

      const extension = (file.name.split('.').pop() || 'jpg').replace(/[^a-z0-9]/gi, '').toLowerCase();
      const blobKey = `uploads/${slot}-${Date.now()}.${extension}`;
      await imageStore.set(blobKey, await file.arrayBuffer());
      const publicUrl = `/api/site-images/file/${encodeURIComponent(blobKey)}`;
      const [previous] = await db.select().from(siteImages).where(eq(siteImages.slotKey, slot)).limit(1);
      await db.insert(siteImages).values({
        slotKey: slot, url: publicUrl, blobKey, fileName: file.name, mimeType: file.type, updatedAt: new Date(),
      }).onConflictDoUpdate({
        target: siteImages.slotKey,
        set: { url: publicUrl, blobKey, fileName: file.name, mimeType: file.type, updatedAt: new Date() },
      });
      if (previous?.blobKey && previous.blobKey !== blobKey) await imageStore.delete(previous.blobKey);
      return json({ slot, url: publicUrl }, 201);
    }

    if (req.method === 'DELETE') {
      const slot = safeSlot(url.searchParams.get('slot'));
      const [previous] = await db.select().from(siteImages).where(eq(siteImages.slotKey, slot)).limit(1);
      await db.delete(siteImages).where(eq(siteImages.slotKey, slot));
      if (previous?.blobKey) await imageStore.delete(previous.blobKey);
      return json({ slot });
    }

    return json({ error: 'Method not allowed.' }, 405);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Image request failed.';
    const status = message.includes('session') ? 401 : 500;
    return json({ error: message }, status);
  }
};

export const config: Config = { path: ['/api/site-images', '/api/site-images/*'] };
