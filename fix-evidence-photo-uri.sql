-- Fix evidence table: Rename photo_uri to photo_url
-- This column should store Cloudinary URLs, not local URIs

ALTER TABLE evidence 
RENAME COLUMN photo_uri TO photo_url;

-- Update column comment to clarify it stores Cloudinary URLs
COMMENT ON COLUMN evidence.photo_url IS 'Cloudinary URL for evidence photo/video';
