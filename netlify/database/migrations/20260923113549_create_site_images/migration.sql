CREATE TABLE "site_images" (
	"slot_key" text PRIMARY KEY,
	"url" text NOT NULL,
	"blob_key" text,
	"file_name" text,
	"mime_type" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
