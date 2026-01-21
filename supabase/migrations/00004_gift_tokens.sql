-- ============================================
-- Gift Token System Migration
-- 쿠폰 스크린샷 악용 방지를 위한 1회성 토큰 시스템
-- ============================================

-- Add token and redemption fields to gifts table
ALTER TABLE gifts ADD COLUMN IF NOT EXISTS gift_token VARCHAR(32) UNIQUE;
ALTER TABLE gifts ADD COLUMN IF NOT EXISTS token_redeemed BOOLEAN DEFAULT FALSE;
ALTER TABLE gifts ADD COLUMN IF NOT EXISTS token_redeemed_at TIMESTAMPTZ;
ALTER TABLE gifts ADD COLUMN IF NOT EXISTS redeemed_by_staff_id UUID;
ALTER TABLE gifts ADD COLUMN IF NOT EXISTS rolling_code VARCHAR(6);
ALTER TABLE gifts ADD COLUMN IF NOT EXISTS rolling_code_expires_at TIMESTAMPTZ;
ALTER TABLE gifts ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

-- Index for token lookups
CREATE INDEX IF NOT EXISTS idx_gifts_token ON gifts(gift_token);
CREATE INDEX IF NOT EXISTS idx_gifts_rolling_code ON gifts(rolling_code) WHERE rolling_code IS NOT NULL;

-- Function to generate a unique gift token
CREATE OR REPLACE FUNCTION generate_gift_token() RETURNS VARCHAR(32) AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result VARCHAR(32) := '';
  i INTEGER;
BEGIN
  FOR i IN 1..32 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to generate a 6-digit rolling code
CREATE OR REPLACE FUNCTION generate_rolling_code() RETURNS VARCHAR(6) AS $$
DECLARE
  result VARCHAR(6) := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || floor(random() * 10)::integer::text;
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically generate gift_token when gift is created
CREATE OR REPLACE FUNCTION set_gift_token() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.gift_token IS NULL THEN
    -- Generate unique token (retry on collision)
    LOOP
      NEW.gift_token := generate_gift_token();
      BEGIN
        -- Check if token already exists
        PERFORM 1 FROM gifts WHERE gift_token = NEW.gift_token;
        IF NOT FOUND THEN
          EXIT;
        END IF;
      END;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_gift_token ON gifts;
CREATE TRIGGER trigger_set_gift_token
  BEFORE INSERT ON gifts
  FOR EACH ROW
  EXECUTE FUNCTION set_gift_token();

-- Comment explaining the token system
COMMENT ON COLUMN gifts.gift_token IS '1회성 선물 토큰 (스크린샷 악용 방지)';
COMMENT ON COLUMN gifts.token_redeemed IS '토큰 사용 여부';
COMMENT ON COLUMN gifts.token_redeemed_at IS '토큰 사용 시간';
COMMENT ON COLUMN gifts.redeemed_by_staff_id IS '토큰을 사용 처리한 스탭 ID';
COMMENT ON COLUMN gifts.rolling_code IS '6자리 회전 코드 (30초마다 변경)';
COMMENT ON COLUMN gifts.rolling_code_expires_at IS '회전 코드 만료 시간';
