-- Run in Supabase SQL Editor to add new columns introduced in Etap 2

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS accent_color        text,
  ADD COLUMN IF NOT EXISTS screenshot_url      text,
  ADD COLUMN IF NOT EXISTS price_segment       text,
  ADD COLUMN IF NOT EXISTS target_audience     jsonb,
  ADD COLUMN IF NOT EXISTS brand_language      jsonb,
  ADD COLUMN IF NOT EXISTS competitor_accounts text[],
  ADD COLUMN IF NOT EXISTS content_language    text,
  ADD COLUMN IF NOT EXISTS typography_preference text,
  ADD COLUMN IF NOT EXISTS profile_tier        text;
