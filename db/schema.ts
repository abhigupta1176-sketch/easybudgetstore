import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const siteImages = pgTable('site_images', {
  slotKey: text('slot_key').primaryKey(),
  url: text('url').notNull(),
  blobKey: text('blob_key'),
  fileName: text('file_name'),
  mimeType: text('mime_type'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
