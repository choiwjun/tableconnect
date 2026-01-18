-- ============================================
-- Table Connect - Seed Data for Development
-- ============================================

-- Insert sample merchant
INSERT INTO merchants (id, name, slug, description, address, phone, business_hours, settings) VALUES
(
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'サクラ居酒屋',
  'sakura-izakaya',
  '新宿で人気の居酒屋です。美味しい料理とお酒をお楽しみください。',
  '東京都新宿区歌舞伎町1-1-1',
  '03-1234-5678',
  '{
    "monday": {"open": "17:00", "close": "02:00"},
    "tuesday": {"open": "17:00", "close": "02:00"},
    "wednesday": {"open": "17:00", "close": "02:00"},
    "thursday": {"open": "17:00", "close": "02:00"},
    "friday": {"open": "17:00", "close": "03:00"},
    "saturday": {"open": "17:00", "close": "03:00"},
    "sunday": {"open": "17:00", "close": "00:00"}
  }',
  '{
    "fee_rate": 0.15,
    "currency": "JPY",
    "timezone": "Asia/Tokyo",
    "max_tables": 30,
    "session_ttl_hours": 2
  }'
);

-- Insert sample menus for the merchant
INSERT INTO menus (merchant_id, name, description, price, category, is_available, sort_order) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'プレミアムビール', '厳選されたクラフトビール', 800, 'ドリンク', true, 1),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'ハイボール', 'さっぱり爽やかなハイボール', 500, 'ドリンク', true, 2),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '日本酒 純米大吟醸', '香り高い純米大吟醸', 1200, 'ドリンク', true, 3),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '梅酒ロック', '自家製梅酒', 600, 'ドリンク', true, 4),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'ソフトドリンク', 'ウーロン茶・コーラなど', 300, 'ドリンク', true, 5),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '枝豆', '塩茹で枝豆', 400, 'おつまみ', true, 10),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '唐揚げ', 'ジューシーな鶏の唐揚げ', 650, 'おつまみ', true, 11),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '刺身盛り合わせ', '本日の新鮮な刺身5点盛り', 1800, '料理', true, 20),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '焼き鳥盛り合わせ', '職人が焼く焼き鳥5本', 900, '料理', true, 21),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'シメのラーメン', '特製醤油ラーメン', 750, 'シメ', true, 30);

-- Insert another sample merchant
INSERT INTO merchants (id, name, slug, description, address, phone, business_hours, settings) VALUES
(
  'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22',
  '月光バー',
  'moonlight-bar',
  '落ち着いた雰囲気のカクテルバー',
  '東京都渋谷区道玄坂2-2-2',
  '03-8765-4321',
  '{
    "monday": {"closed": true},
    "tuesday": {"open": "19:00", "close": "03:00"},
    "wednesday": {"open": "19:00", "close": "03:00"},
    "thursday": {"open": "19:00", "close": "03:00"},
    "friday": {"open": "19:00", "close": "05:00"},
    "saturday": {"open": "19:00", "close": "05:00"},
    "sunday": {"open": "19:00", "close": "01:00"}
  }',
  '{
    "fee_rate": 0.12,
    "currency": "JPY",
    "timezone": "Asia/Tokyo",
    "max_tables": 15,
    "session_ttl_hours": 3
  }'
);

-- Insert sample menus for the second merchant
INSERT INTO menus (merchant_id, name, description, price, category, is_available, sort_order) VALUES
('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', 'シグネチャーカクテル', 'バーテンダー特製カクテル', 1500, 'カクテル', true, 1),
('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', 'モヒート', 'フレッシュミントのモヒート', 1200, 'カクテル', true, 2),
('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', 'マティーニ', 'クラシックドライマティーニ', 1400, 'カクテル', true, 3),
('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', 'ウィスキー シングル', '厳選ウィスキー', 1000, 'ウィスキー', true, 10),
('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', 'シャンパン グラス', 'モエ・エ・シャンドン', 2000, 'シャンパン', true, 20),
('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', 'シャンパン ボトル', 'モエ・エ・シャンドン フルボトル', 15000, 'シャンパン', true, 21),
('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', 'ナッツ盛り合わせ', '厳選ナッツ', 800, 'フード', true, 30),
('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', 'チーズ盛り合わせ', '5種のチーズ', 1500, 'フード', true, 31);
