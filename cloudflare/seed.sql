-- KNUE Board Hub - Initial Data Seed
-- Migrate current department configuration to D1

-- Insert department configurations
INSERT INTO departments (id, name, description, icon, color, rss_url, bbs_no, priority, is_active) VALUES
('general', '일반공지', '전체 학교 공지사항', '📢', '#0066CC', 'https://www.knue.ac.kr/rssBbsNtt.do?bbsNo=94', 94, 1, 1),
('academic', '학사공지', '학사 관련 공지사항', '🎓', '#FF6B35', 'https://www.knue.ac.kr/rssBbsNtt.do?bbsNo=95', 95, 2, 1),
('employment', '취업공지', '취업 및 진로 정보', '💼', '#28A745', 'https://www.knue.ac.kr/rssBbsNtt.do?bbsNo=96', 96, 3, 1),
('scholarship', '장학공지', '장학금 관련 정보', '💰', '#FFC107', 'https://www.knue.ac.kr/rssBbsNtt.do?bbsNo=97', 97, 4, 1),
('dormitory', '생활관공지', '기숙사 생활 관련', '🏠', '#6F42C1', 'https://www.knue.ac.kr/rssBbsNtt.do?bbsNo=98', 98, 5, 1),
('library', '도서관공지', '도서관 이용 안내', '📚', '#17A2B8', 'https://www.knue.ac.kr/rssBbsNtt.do?bbsNo=99', 99, 6, 1),
('international', '국제교류공지', '국제교류 프로그램', '🌍', '#20C997', 'https://www.knue.ac.kr/rssBbsNtt.do?bbsNo=100', 100, 7, 1),
('research', '연구공지', '연구 관련 공지', '🔬', '#E83E8C', 'https://www.knue.ac.kr/rssBbsNtt.do?bbsNo=101', 101, 8, 1);

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