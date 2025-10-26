-- Norsk: I18n og allowed_doc_languages

BEGIN;

-- Norsk: Settings nøkkel for språk
INSERT INTO settings(key, value)
VALUES
  ('allowed_doc_languages', jsonb_build_object('languages', ARRAY['nb-NO','en-GB'])),
  ('ui_locales', jsonb_build_object('supported', ARRAY['nb-NO','en-GB','ru-RU'], 'default', 'nb-NO'))
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value;

COMMIT;
