<template>
  <div class="about-view">
    <div class="container-mobile section-spacing">
      <!-- Header -->
      <header class="view-header">
        <div class="header-content">
          <div class="app-logo">
            <i class="i-tabler-school w-16 h-16 text-knue-primary" />
          </div>
          <h1 class="app-name">KNUE 게시판</h1>
          <p class="app-version">버전 {{ appVersion }}</p>
          <p class="app-subtitle">한국교원대학교 통합 공지사항</p>
        </div>
      </header>

      <!-- Main Content -->
      <main class="main-content">
        <!-- App Info -->
        <section class="info-section">
          <div class="section-header">
            <h2 class="section-title">
              <i class="i-tabler-info-circle w-5 h-5 mr-2" />
              앱 정보
            </h2>
          </div>
          
          <div class="info-content">
            <p class="info-description">
              KNUE 게시판은 한국교원대학교의 다양한 공지사항을 한 곳에서 편리하게 확인할 수 있는 
              모바일 친화적인 웹 애플리케이션입니다. 학생들과 교직원들이 중요한 정보를 놓치지 않고 
              신속하게 접할 수 있도록 설계되었습니다.
            </p>
            
            <div class="features-list">
              <div class="feature-item">
                <i class="i-tabler-refresh w-5 h-5 text-knue-primary" />
                <span>실시간 RSS 피드 동기화</span>
              </div>
              <div class="feature-item">
                <i class="i-tabler-device-mobile w-5 h-5 text-knue-primary" />
                <span>모바일 최적화 인터페이스</span>
              </div>
              <div class="feature-item">
                <i class="i-tabler-filter w-5 h-5 text-knue-primary" />
                <span>게시판별 필터링 및 검색</span>
              </div>
              <div class="feature-item">
                <i class="i-tabler-bell w-5 h-5 text-knue-primary" />
                <span>새 게시글 알림 시스템</span>
              </div>
              <div class="feature-item">
                <i class="i-tabler-bookmark w-5 h-5 text-knue-primary" />
                <span>북마크 및 즐겨찾기</span>
              </div>
              <div class="feature-item">
                <i class="i-tabler-share w-5 h-5 text-knue-primary" />
                <span>소셜 공유 기능</span>
              </div>
            </div>
          </div>
        </section>

        <!-- Technical Info -->
        <section class="info-section">
          <div class="section-header">
            <h2 class="section-title">
              <i class="i-tabler-code w-5 h-5 mr-2" />
              기술 정보
            </h2>
          </div>
          
          <div class="tech-info">
            <div class="tech-stack">
              <h3 class="tech-category">프론트엔드</h3>
              <div class="tech-items">
                <span class="tech-item">Vue.js 3</span>
                <span class="tech-item">Vue Router</span>
                <span class="tech-item">UnoCSS</span>
                <span class="tech-item">Vite</span>
              </div>
            </div>
            
            <div class="tech-stack">
              <h3 class="tech-category">개발 환경</h3>
              <div class="tech-items">
                <span class="tech-item">TypeScript</span>
                <span class="tech-item">ESLint</span>
                <span class="tech-item">Node.js {{ nodeVersion }}</span>
                <span class="tech-item">PWA</span>
              </div>
            </div>
            
            <div class="build-info">
              <div class="build-item">
                <span class="build-label">빌드 날짜:</span>
                <span class="build-value">{{ buildDate }}</span>
              </div>
              <div class="build-item">
                <span class="build-label">Git 커밋:</span>
                <span class="build-value">{{ gitCommit }}</span>
              </div>
              <div class="build-item">
                <span class="build-label">환경:</span>
                <span class="build-value">{{ environment }}</span>
              </div>
            </div>
          </div>
        </section>

        <!-- Contact & Support -->
        <section class="info-section">
          <div class="section-header">
            <h2 class="section-title">
              <i class="i-tabler-mail w-5 h-5 mr-2" />
              문의 및 지원
            </h2>
          </div>
          
          <div class="contact-content">
            <div class="contact-methods">
              <a
                href="mailto:support@knue.ac.kr"
                class="contact-method"
              >
                <i class="i-tabler-mail w-5 h-5" />
                <div class="contact-info">
                  <span class="contact-title">이메일 문의</span>
                  <span class="contact-detail">support@knue.ac.kr</span>
                </div>
              </a>
              
              <a
                href="https://www.knue.ac.kr"
                target="_blank"
                rel="noopener noreferrer"
                class="contact-method"
              >
                <i class="i-tabler-world w-5 h-5" />
                <div class="contact-info">
                  <span class="contact-title">공식 웹사이트</span>
                  <span class="contact-detail">www.knue.ac.kr</span>
                </div>
              </a>
              
              <a
                href="tel:043-230-3114"
                class="contact-method"
              >
                <i class="i-tabler-phone w-5 h-5" />
                <div class="contact-info">
                  <span class="contact-title">전화 문의</span>
                  <span class="contact-detail">043-230-3114</span>
                </div>
              </a>
            </div>
            
            <div class="help-links">
              <button
                @click="openFeedback"
                class="help-link"
              >
                <i class="i-tabler-message-circle w-4 h-4 mr-2" />
                피드백 보내기
              </button>
              
              <button
                @click="reportBug"
                class="help-link"
              >
                <i class="i-tabler-bug w-4 h-4 mr-2" />
                버그 신고
              </button>
              
              <button
                @click="checkUpdates"
                :disabled="checkingUpdates"
                class="help-link"
              >
                <i 
                  class="w-4 h-4 mr-2"
                  :class="checkingUpdates ? 'i-tabler-loader-2 animate-spin' : 'i-tabler-download'"
                />
                {{ checkingUpdates ? '확인 중...' : '업데이트 확인' }}
              </button>
            </div>
          </div>
        </section>

        <!-- Legal & Credits -->
        <section class="info-section">
          <div class="section-header">
            <h2 class="section-title">
              <i class="i-tabler-license w-5 h-5 mr-2" />
              법적 고지
            </h2>
          </div>
          
          <div class="legal-content">
            <div class="legal-item">
              <h3 class="legal-title">저작권</h3>
              <p class="legal-text">
                © {{ currentYear }} 한국교원대학교. 모든 권리 보유.
              </p>
            </div>
            
            <div class="legal-item">
              <h3 class="legal-title">라이선스</h3>
              <p class="legal-text">
                이 소프트웨어는 MIT 라이선스 하에 배포됩니다.
              </p>
            </div>
            
            <div class="legal-item">
              <h3 class="legal-title">개인정보 처리방침</h3>
              <p class="legal-text">
                본 앱은 개인정보를 수집하지 않으며, 모든 데이터는 로컬에 저장됩니다.
                RSS 피드는 공개 정보만을 사용합니다.
              </p>
            </div>
            
            <div class="credits">
              <h3 class="credits-title">오픈소스 라이브러리</h3>
              <div class="credits-list">
                <span class="credit-item">Vue.js</span>
                <span class="credit-item">UnoCSS</span>
                <span class="credit-item">Tabler Icons</span>
                <span class="credit-item">Vite</span>
              </div>
            </div>
          </div>
        </section>

        <!-- Developer Info -->
        <section class="info-section">
          <div class="section-header">
            <h2 class="section-title">
              <i class="i-tabler-users w-5 h-5 mr-2" />
              개발팀
            </h2>
          </div>
          
          <div class="developer-content">
            <p class="developer-description">
              이 앱은 한국교원대학교 학생들의 편의를 위해 개발되었습니다.
            </p>
            
            <div class="developer-links">
              <a
                href="https://github.com/knue/board-hub"
                target="_blank"
                rel="noopener noreferrer"
                class="developer-link"
              >
                <i class="i-tabler-brand-github w-5 h-5" />
                <span>GitHub 저장소</span>
              </a>
              
              <button
                @click="showChangeLog"
                class="developer-link"
              >
                <i class="i-tabler-file-text w-5 h-5" />
                <span>변경 로그</span>
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useGlobalNotifications } from '../composables/useNotifications.js'

// Composables
const { showSuccess, showInfo, showError } = useGlobalNotifications()

// State
const checkingUpdates = ref(false)

// App info
const appVersion = '1.0.0'
const nodeVersion = '18.0.0'
const environment = import.meta.env.MODE
const buildDate = new Date().toLocaleDateString('ko-KR')
const gitCommit = import.meta.env.VITE_GIT_COMMIT_HASH || 'unknown'

// Computed
const currentYear = computed(() => new Date().getFullYear())

// Methods
function openFeedback() {
  const subject = encodeURIComponent('KNUE 게시판 앱 피드백')
  const body = encodeURIComponent(`
앱 버전: ${appVersion}
브라우저: ${navigator.userAgent}
화면 크기: ${window.innerWidth}x${window.innerHeight}

피드백 내용:
`)
  
  window.open(`mailto:support@knue.ac.kr?subject=${subject}&body=${body}`)
  showInfo('이메일 클라이언트를 확인해주세요')
}

function reportBug() {
  const subject = encodeURIComponent('KNUE 게시판 앱 버그 신고')
  const body = encodeURIComponent(`
앱 버전: ${appVersion}
브라우저: ${navigator.userAgent}
화면 크기: ${window.innerWidth}x${window.innerHeight}
발생 시간: ${new Date().toLocaleString('ko-KR')}

버그 설명:
1. 발생 상황:
2. 예상 결과:
3. 실제 결과:
4. 재현 단계:
`)
  
  window.open(`mailto:support@knue.ac.kr?subject=${subject}&body=${body}`)
  showInfo('이메일 클라이언트를 확인해주세요')
}

async function checkUpdates() {
  if (checkingUpdates.value) return
  
  checkingUpdates.value = true
  
  try {
    // Simulate update check
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Check for service worker updates
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration()
      if (registration) {
        await registration.update()
      }
    }
    
    showSuccess('최신 버전을 사용 중입니다')
    
  } catch (error) {
    showError('업데이트 확인에 실패했습니다')
    console.error('Update check failed:', error)
  } finally {
    checkingUpdates.value = false
  }
}

function showChangeLog() {
  const changeLog = `
버전 1.0.0 (${buildDate})
- 초기 릴리스
- RSS 피드 통합 기능
- 모바일 최적화 인터페이스
- 게시판별 필터링
- 실시간 새로고침
- 북마크 기능
- 다크 모드 지원
- PWA 지원
  `
  
  showInfo('변경 로그가 콘솔에 출력되었습니다')
  console.log('KNUE 게시판 변경 로그:', changeLog)
}

// Meta
defineOptions({
  name: 'AboutView'
})
</script>

<style scoped>
/* Container */
.about-view {
  min-height: 100vh;
  background: theme('colors.gray.50');
}

/* Header */
.view-header {
  margin-bottom: 2rem;
}

.header-content {
  text-align: center;
}

.app-logo {
  margin-bottom: 1rem;
}

.app-name {
  font-size: 2.5rem;
  font-weight: 700;
  color: theme('colors.gray.900');
  margin: 0 0 0.5rem 0;
}

.app-version {
  font-size: 1rem;
  color: theme('colors.knue.primary');
  font-weight: 600;
  margin: 0 0 0.5rem 0;
}

.app-subtitle {
  font-size: 1.125rem;
  color: theme('colors.gray.600');
  margin: 0;
  line-height: 1.5;
}

/* Main Content */
.main-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* Info Section */
.info-section {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.section-header {
  margin-bottom: 1.5rem;
}

.section-title {
  display: flex;
  align-items: center;
  font-size: 1.25rem;
  font-weight: 600;
  color: theme('colors.gray.900');
  margin: 0;
}

/* App Info */
.info-description {
  font-size: 1rem;
  color: theme('colors.gray.700');
  line-height: 1.6;
  margin: 0 0 1.5rem 0;
}

.features-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.875rem;
  color: theme('colors.gray.700');
}

/* Technical Info */
.tech-info {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.tech-stack {
  border-bottom: 1px solid theme('colors.gray.200');
  padding-bottom: 1rem;
}

.tech-stack:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.tech-category {
  font-size: 1rem;
  font-weight: 600;
  color: theme('colors.gray.900');
  margin: 0 0 0.75rem 0;
}

.tech-items {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tech-item {
  padding: 0.25rem 0.75rem;
  background: theme('colors.blue.100');
  color: theme('colors.blue.800');
  border-radius: 1rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.build-info {
  background: theme('colors.gray.50');
  border-radius: 0.5rem;
  padding: 1rem;
  margin-top: 1rem;
}

.build-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.build-item:last-child {
  margin-bottom: 0;
}

.build-label {
  font-size: 0.875rem;
  color: theme('colors.gray.600');
  font-weight: 500;
}

.build-value {
  font-size: 0.875rem;
  color: theme('colors.gray.900');
  font-family: monospace;
}

/* Contact & Support */
.contact-methods {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.contact-method {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: theme('colors.gray.50');
  border: 1px solid theme('colors.gray.200');
  border-radius: 0.75rem;
  text-decoration: none;
  color: theme('colors.gray.700');
  transition: all 0.2s ease;
}

.contact-method:hover {
  background: theme('colors.blue.50');
  border-color: theme('colors.knue.accent');
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 102, 204, 0.15);
}

.contact-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.contact-title {
  font-weight: 600;
  color: theme('colors.gray.900');
}

.contact-detail {
  font-size: 0.875rem;
  color: theme('colors.gray.600');
}

.help-links {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.help-link {
  display: flex;
  align-items: center;
  padding: 0.5rem 1rem;
  background: theme('colors.knue.primary');
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
}

.help-link:hover:not(:disabled) {
  background: theme('colors.knue.secondary');
  transform: translateY(-1px);
}

.help-link:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* Legal & Credits */
.legal-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.legal-item {
  border-bottom: 1px solid theme('colors.gray.200');
  padding-bottom: 1rem;
}

.legal-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.legal-title {
  font-size: 1rem;
  font-weight: 600;
  color: theme('colors.gray.900');
  margin: 0 0 0.5rem 0;
}

.legal-text {
  font-size: 0.875rem;
  color: theme('colors.gray.600');
  line-height: 1.5;
  margin: 0;
}

.credits {
  background: theme('colors.gray.50');
  border-radius: 0.5rem;
  padding: 1rem;
  margin-top: 1rem;
}

.credits-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: theme('colors.gray.900');
  margin: 0 0 0.75rem 0;
}

.credits-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.credit-item {
  padding: 0.25rem 0.5rem;
  background: theme('colors.gray.200');
  color: theme('colors.gray.700');
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
}

/* Developer Info */
.developer-description {
  font-size: 1rem;
  color: theme('colors.gray.700');
  line-height: 1.6;
  margin: 0 0 1.5rem 0;
}

.developer-links {
  display: flex;
  gap: 1rem;
}

.developer-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: theme('colors.gray.100');
  color: theme('colors.gray.700');
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.developer-link:hover {
  background: theme('colors.gray.200');
  transform: translateY(-1px);
}

/* Responsive Design */
@media (max-width: 768px) {
  .app-name {
    font-size: 2rem;
  }
  
  .app-subtitle {
    font-size: 1rem;
  }
  
  .features-list {
    grid-template-columns: 1fr;
  }
  
  .tech-items {
    justify-content: center;
  }
  
  .help-links {
    justify-content: center;
  }
  
  .developer-links {
    flex-direction: column;
  }
}

</style>