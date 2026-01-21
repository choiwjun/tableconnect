-- ============================================
-- Message Translation Storage Migration
-- 번역 원문/번역 분리 저장 (분쟁 시 증거 보존)
-- ============================================

-- Add translation fields to messages table
ALTER TABLE messages ADD COLUMN IF NOT EXISTS original_content TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS translated_content TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS translation_language VARCHAR(10);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS translated_at TIMESTAMPTZ;

-- For existing messages, copy content to original_content
UPDATE messages
SET original_content = content
WHERE original_content IS NULL;

-- Index for translation queries
CREATE INDEX IF NOT EXISTS idx_messages_translated ON messages(translated_at) WHERE translated_at IS NOT NULL;

-- Comment explaining the translation fields
COMMENT ON COLUMN messages.original_content IS '원본 메시지 내용';
COMMENT ON COLUMN messages.translated_content IS '번역된 메시지 내용';
COMMENT ON COLUMN messages.translation_language IS '번역 대상 언어 코드';
COMMENT ON COLUMN messages.translated_at IS '번역 완료 시간';
