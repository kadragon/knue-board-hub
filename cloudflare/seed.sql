-- KNUE Board Hub - Initial Data Seed
-- Migrate current department configuration to D1

-- Insert department configurations
INSERT INTO departments (id, name, description, icon, color, rss_url, bbs_no, priority, is_active) VALUES
('general', '대학소식', '전체 학교 공지사항', '📢', '#0066CC', 'https://www.knue.ac.kr/rssBbsNtt.do?bbsNo=25', 25, 1, 1),
('academic', '학사공지', '학사 관련 공지사항', '🎓', '#FF6B35', 'https://www.knue.ac.kr/rssBbsNtt.do?bbsNo=26', 26, 2, 1),
('employment', '채용공지', '채용 공고', '💼', '#28A745', 'https://www.knue.ac.kr/rssBbsNtt.do?bbsNo=27', 27, 3, 0),
('scholarship', '장학공지', '장학금 관련 정보', '💰', '#FFC107', 'https://www.knue.ac.kr/rssBbsNtt.do?bbsNo=209', 207, 4, 1),
('seminar', '행사 세미나 안내', '행사 및 세미나 안내', '📅', '#9C27B0', 'https://www.knue.ac.kr/rssBbsNtt.do?bbsNo=28', 28, 5, 1),
('tuition', '등록금', '등록금 관련 공지', '💳', '#795548', 'https://www.knue.ac.kr/rssBbsNtt.do?bbsNo=11', 11, 6, 1),
('cheongram', '청람소양', '청람소양 관련 공지', '🌿', '#4CAF50', 'https://www.knue.ac.kr/rssBbsNtt.do?bbsNo=256', 256, 7, 1),

-- Insert application settings
INSERT INTO app_settings (key, value, description) VALUES
('app_title', 'KNUE 게시판', 'Application title'),
('app_subtitle', '한국교원대학교 통합 공지사항', 'Application subtitle'),
('cache_ttl_minutes', '30', 'RSS cache time-to-live in minutes'),
('max_items_per_feed', '50', 'Maximum items to cache per RSS feed'),
('rss_fetch_timeout_seconds', '10', 'RSS fetch timeout in seconds'),
('cors_proxy_url', 'https://api.allorigins.win/get?url=', 'CORS proxy for RSS fetching'),
('last_global_update', '', 'Last time all feeds were updated'),
('maintenance_mode', '0', 'Enable maintenance mode (0/1)'),
('google_oauth_enabled', '0', 'Enable Google OAuth login (0/1)'),
('default_theme', 'light', 'Default application theme'),
('supported_languages', '["ko", "en"]', 'Supported languages JSON array');