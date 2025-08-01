<template>
  <div id="app" class="app-container">
    <!-- Skip Links for Accessibility -->
    <a href="#main-content" class="skip-link">주요 콘텐츠로 건너뛰기</a>
    <a href="#navigation" class="skip-link">네비게이션으로 건너뛰기</a>
    
    <!-- Main Layout -->
    <div class="app-layout" :class="layoutClass">
      <!-- Navigation Header -->
      <header v-if="showNavigation" class="app-header">
        <nav id="navigation" class="app-nav">
          <div class="nav-container">
            <!-- Logo/Brand -->
            <router-link to="/" class="nav-brand">
              <i class="i-tabler-school w-6 h-6 mr-2 text-knue-primary" />
              <span class="brand-text">KNUE 게시판</span>
            </router-link>

            <!-- Actions (only on home page) -->
            <div v-if="route.name === 'home'" class="nav-home-controls">
              <button
                @click="handleRefresh"
                class="nav-refresh-btn"
                :disabled="isRefreshing"
                title="새로고침"
              >
                <i
                  class="w-5 h-5"
                  :class="
                    isRefreshing
                      ? 'i-tabler-loader-2 animate-spin'
                      : 'i-tabler-refresh'
                  "
                />
              </button>
            </div>

            <!-- Desktop Navigation -->
            <nav class="nav-menu desktop-only" role="navigation" aria-label="주요 네비게이션">
              <router-link
                v-for="(route, index) in navRoutes"
                :key="route.name"
                :to="{ name: route.name }"
                class="nav-link"
                :class="{ 'nav-active': isCurrentRoute(route.name) }"
                :aria-current="isCurrentRoute(route.name) ? 'page' : undefined"
                :title="`${route.meta.title} 페이지로 이동 (Alt+${index + 1})`"
              >
                <i :class="route.meta.icon" class="w-4 h-4 mr-2" aria-hidden="true" />
                {{ route.meta.title }}
              </router-link>
            </nav>

            <!-- Mobile Menu Toggle -->
            <button
              @click="toggleMobileMenu"
              class="mobile-menu-toggle mobile-only"
              aria-label="메뉴 열기/닫기"
            >
              <i
                class="w-6 h-6 transition-transform duration-200"
                :class="mobileMenuOpen ? 'i-tabler-x' : 'i-tabler-menu-2'"
              />
            </button>
          </div>

          <!-- Mobile Navigation Menu -->
          <Transition name="mobile-menu">
            <div
              v-if="mobileMenuOpen"
              class="mobile-nav-overlay mobile-only"
              @click="closeMobileMenu"
            >
              <div class="mobile-nav" @click.stop>
                <div class="mobile-nav-content">
                  <router-link
                    v-for="route in navRoutes"
                    :key="`mobile-${route.name}`"
                    :to="{ name: route.name }"
                    class="mobile-nav-link"
                    :class="{ 'nav-active': isCurrentRoute(route.name) }"
                    @click="closeMobileMenu"
                  >
                    <i :class="route.meta.icon" class="w-5 h-5 mr-3" />
                    <div class="link-content">
                      <span class="link-title">{{ route.meta.title }}</span>
                      <span class="link-description">{{
                        route.meta.description
                      }}</span>
                    </div>
                  </router-link>
                </div>
              </div>
            </div>
          </Transition>
        </nav>
      </header>

      <!-- Main Content Area -->
      <main id="main-content" class="app-main" :class="mainClass">
        <!-- Route Transition -->
        <router-view v-slot="{ Component, route }">
          <Transition :name="transitionName" mode="out-in">
            <component
              :is="Component"
              :key="route.path"
              class="route-component"
            />
          </Transition>
        </router-view>
      </main>

      <!-- Bottom Navigation (Mobile) -->
      <nav 
        v-if="showBottomNav" 
        class="bottom-nav mobile-only" 
        role="navigation" 
        aria-label="하단 네비게이션"
      >
        <router-link
          v-for="route in bottomNavRoutes"
          :key="`bottom-${route.name}`"
          :to="{ name: route.name }"
          class="bottom-nav-item"
          :class="{ 'nav-active': isCurrentRoute(route.name) }"
          :aria-current="isCurrentRoute(route.name) ? 'page' : undefined"
          :aria-label="`${route.meta.title} 페이지로 이동`"
        >
          <i :class="route.meta.icon" class="w-5 h-5" aria-hidden="true" />
          <span class="nav-label">{{ route.meta.title }}</span>
        </router-link>
      </nav>
    </div>

    <!-- Global Components -->
    <NotificationToast
      :position="notificationPosition"
      :max-visible="5"
      :pause-on-hover="true"
    />

    <!-- Loading Overlay -->
    <Transition name="loading-overlay">
      <div v-if="globalLoading" class="global-loading-overlay">
        <LoadingSpinner
          size="lg"
          text="로딩 중..."
          :show-text="true"
          variant="white"
        />
      </div>
    </Transition>

    <!-- Offline Banner -->
    <Transition name="offline-banner">
      <div v-if="showOfflineBanner" class="offline-banner">
        <div class="offline-content">
          <i class="i-tabler-wifi-off w-5 h-5 mr-2" />
          <span>인터넷 연결을 확인해주세요</span>
          <button
            v-if="isRetrying"
            @click="retryConnection"
            class="retry-button"
            :disabled="retryingConnection"
          >
            <i
              class="w-4 h-4 mr-1"
              :class="
                retryingConnection
                  ? 'i-tabler-loader-2 animate-spin'
                  : 'i-tabler-refresh'
              "
            />
            {{ retryingConnection ? "재시도 중..." : "재시도" }}
          </button>
        </div>
      </div>
    </Transition>

    <!-- PWA Install Prompt -->
    <Transition name="pwa-prompt">
      <div v-if="showPwaPrompt" class="pwa-prompt">
        <div class="pwa-content">
          <div class="pwa-info">
            <i class="i-tabler-download w-5 h-5 mr-2 text-knue-primary" />
            <div class="pwa-text">
              <span class="pwa-title">앱으로 설치하기</span>
              <span class="pwa-description"
                >홈 화면에 추가하여 더 편리하게 사용하세요</span
              >
            </div>
          </div>
          <div class="pwa-actions">
            <button @click="installPwa" class="pwa-install-btn">설치</button>
            <button @click="dismissPwaPrompt" class="pwa-dismiss-btn">
              <i class="i-tabler-x w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Cache Debugger (only in development) -->
    <CacheDebugger v-if="isDevelopment" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { getNavRoutes, isCurrentRoute } from "./router/index.js";
import { useGlobalNotifications } from "./composables/useNotifications.js";

// Components
import NotificationToast from "./components/NotificationToast.vue";
import LoadingSpinner from "./components/LoadingSpinner.vue";
import CacheDebugger from "./components/CacheDebugger.vue";

// Router
const router = useRouter();
const route = useRoute();

// Composables
const { showSuccess, showWarning, showError } = useGlobalNotifications();

// State
const mobileMenuOpen = ref(false);
const isOnline = ref(navigator.onLine);
const globalLoading = ref(false);
const showPwaPrompt = ref(false);
const pwaPromptEvent = ref(null);
const retryingConnection = ref(false);
const isRefreshing = ref(false);

// Navigation
const navRoutes = computed(() => getNavRoutes());
const bottomNavRoutes = computed(() =>
  navRoutes.value.filter((route) =>
    ["home", "departments", "settings"].includes(route.name)
  )
);

// Layout computed properties
const showNavigation = computed(() => !route.meta?.hideNavigation);
const showBottomNav = computed(() => !route.meta?.hideBottomNav);
const isRetrying = computed(() => !isOnline.value);
const showOfflineBanner = computed(() => !isOnline.value);

const layoutClass = computed(() => {
  const classes = [];

  if (mobileMenuOpen.value) classes.push("mobile-menu-open");
  if (!isOnline.value) classes.push("offline-mode");
  if (route.meta?.fullscreen) classes.push("fullscreen-layout");

  return classes;
});

const isDevelopment = computed(() => import.meta.env.DEV);

const mainClass = computed(() => {
  const classes = [];

  if (showBottomNav.value) classes.push("with-bottom-nav");
  if (!showNavigation.value) classes.push("no-header");

  return classes;
});

const transitionName = computed(() => {
  // Determine transition based on route meta or navigation direction
  if (route.meta?.transition) return route.meta.transition;

  // Default transitions
  const routeDepth = {
    home: 1,
    departments: 2,
    settings: 3,
    about: 4,
  };

  const fromDepth = routeDepth[router.previousRoute?.name] || 1;
  const toDepth = routeDepth[route.name] || 1;

  return toDepth > fromDepth ? "slide-left" : "slide-right";
});

const notificationPosition = computed(() => {
  // Use different position on mobile
  return window.innerWidth < 768 ? "top-center" : "top-right";
});

// Methods
function toggleMobileMenu() {
  mobileMenuOpen.value = !mobileMenuOpen.value;

  // Prevent body scroll when menu is open
  document.body.style.overflow = mobileMenuOpen.value ? "hidden" : "";
}

function closeMobileMenu() {
  mobileMenuOpen.value = false;
  document.body.style.overflow = "";
}

async function handleRefresh() {
  if (isRefreshing.value) return;

  isRefreshing.value = true;
  let refreshTimeout;

  try {
    // Create a promise-based refresh coordination system
    const refreshCoordinationPromise = new Promise((resolve, reject) => {
      let completedComponents = new Set();
      let expectedComponents = new Set();

      // Set a reasonable timeout as fallback (10 seconds)
      refreshTimeout = setTimeout(() => {
        reject(
          new Error("Refresh timeout - some components may still be loading")
        );
      }, 10000);

      // Listen for component registration
      const handleComponentRegister = (event) => {
        expectedComponents.add(event.detail.componentId);
      };

      // Listen for component completion
      const handleComponentComplete = (event) => {
        const { componentId, success, error } = event.detail;

        if (success) {
          completedComponents.add(componentId);
        } else if (error) {
          cleanup();
          reject(new Error(`Component ${componentId} failed: ${error}`));
          return;
        }

        // Check if all registered components have completed
        if (
          completedComponents.size === expectedComponents.size &&
          expectedComponents.size > 0
        ) {
          cleanup();
          resolve();
        }
      };

      // Cleanup function
      const cleanup = () => {
        window.removeEventListener(
          "app-refresh-register",
          handleComponentRegister
        );
        window.removeEventListener(
          "app-refresh-complete",
          handleComponentComplete
        );
        if (refreshTimeout) {
          clearTimeout(refreshTimeout);
          refreshTimeout = null;
        }
      };

      // Set up event listeners
      window.addEventListener("app-refresh-register", handleComponentRegister);
      window.addEventListener("app-refresh-complete", handleComponentComplete);

      // Start the refresh process
      window.dispatchEvent(
        new CustomEvent("app-refresh", {
          detail: { coordinationMode: true },
        })
      );

      // If no components register within 1 second, assume no components need refreshing
      setTimeout(() => {
        if (expectedComponents.size === 0) {
          cleanup();
          resolve();
        }
      }, 1000);
    });

    // Wait for all components to complete or timeout
    await refreshCoordinationPromise;
    showSuccess("게시판이 새로고침되었습니다");
  } catch (error) {
    console.error("Refresh coordination error:", error);
    showError(error.message || "새로고침 중 오류가 발생했습니다");
  } finally {
    if (refreshTimeout) {
      clearTimeout(refreshTimeout);
    }
    isRefreshing.value = false;
  }
}

async function retryConnection() {
  if (retryingConnection.value) return;

  retryingConnection.value = true;

  try {
    // Test connection by trying to fetch a small resource
    const response = await fetch("/favicon.ico", {
      method: "HEAD",
      cache: "no-cache",
    });

    if (response.ok) {
      isOnline.value = true;
      showSuccess("인터넷 연결이 복구되었습니다");
    } else {
      throw new Error("Connection test failed");
    }
  } catch (error) {
    showError("인터넷 연결을 확인할 수 없습니다");
  } finally {
    retryingConnection.value = false;
  }
}

function handleOnlineStatus() {
  isOnline.value = navigator.onLine;

  if (isOnline.value) {
    showSuccess("인터넷 연결이 복구되었습니다");
  } else {
    showWarning("인터넷 연결이 끊어졌습니다");
  }
}

// PWA functionality
function handlePwaPrompt(event) {
  event.preventDefault();
  pwaPromptEvent.value = event;
  showPwaPrompt.value = true;
}

async function installPwa() {
  if (!pwaPromptEvent.value) return;

  try {
    const result = await pwaPromptEvent.value.prompt();

    if (result.outcome === "accepted") {
      showSuccess("앱이 설치되었습니다");
    }

    showPwaPrompt.value = false;
    pwaPromptEvent.value = null;
  } catch (error) {
    showError("앱 설치에 실패했습니다");
    console.error("PWA installation failed:", error);
  }
}

function dismissPwaPrompt() {
  showPwaPrompt.value = false;
  pwaPromptEvent.value = null;

  // Remember dismissal for 30 days
  localStorage.setItem("pwa-prompt-dismissed", Date.now().toString());
}

function shouldShowPwaPrompt() {
  const dismissed = localStorage.getItem("pwa-prompt-dismissed");
  if (dismissed) {
    const dismissedTime = parseInt(dismissed, 10);
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return dismissedTime < thirtyDaysAgo;
  }
  return true;
}

// Route change handling
function handleRouteChange() {
  // Close mobile menu on route change
  closeMobileMenu();

  // Scroll to top on route change (except for same route with different params)
  if (route.name !== router.previousRoute?.name) {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

// Error handling
function handleGlobalError(error) {
  console.error("Global error:", error);
  showError("예상치 못한 오류가 발생했습니다");
}

// Keyboard shortcuts (Enhanced accessibility)
function handleKeydown(event) {
  // ESC key closes mobile menu
  if (event.key === "Escape" && mobileMenuOpen.value) {
    closeMobileMenu();
    return;
  }

  // Alt + 1-4 for quick navigation
  if (event.altKey && /^[1-4]$/.test(event.key)) {
    event.preventDefault();
    const routes = ['home', 'departments', 'settings', 'about'];
    const routeName = routes[parseInt(event.key) - 1];
    if (routeName) {
      router.push({ name: routeName });
    }
    return;
  }

  // Ctrl/Cmd + K for search focus (if search exists)
  if ((event.ctrlKey || event.metaKey) && event.key === "k") {
    event.preventDefault();
    const searchInput = document.querySelector('input[type="search"]');
    if (searchInput) {
      searchInput.focus();
    }
    return;
  }

  // Tab navigation enhancement for better focus management
  if (event.key === "Tab" && mobileMenuOpen.value) {
    const focusableElements = document.querySelectorAll('.mobile-nav-link');
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }
}

// Lifecycle
onMounted(() => {
  // Set up event listeners
  window.addEventListener("online", handleOnlineStatus);
  window.addEventListener("offline", handleOnlineStatus);
  window.addEventListener("beforeinstallprompt", handlePwaPrompt);
  window.addEventListener("keydown", handleKeydown);
  window.addEventListener("error", handleGlobalError);

  // Check PWA prompt eligibility
  if (shouldShowPwaPrompt() && "serviceWorker" in navigator) {
    // Show PWA prompt after some time
    setTimeout(() => {
      if (!pwaPromptEvent.value) {
        // Fallback for browsers that don't fire beforeinstallprompt
        const isStandalone = window.matchMedia(
          "(display-mode: standalone)"
        ).matches;
        if (!isStandalone && !localStorage.getItem("pwa-prompt-dismissed")) {
          showPwaPrompt.value = true;
        }
      }
    }, 30000); // Show after 30 seconds
  }

  // Initialize service worker
  if ("serviceWorker" in navigator && import.meta.env.PROD) {
    navigator.serviceWorker
      .register("/sw.js")
      .then(() => console.log("Service Worker registered"))
      .catch((error) =>
        console.error("Service Worker registration failed:", error)
      );
  }
});

onUnmounted(() => {
  // Clean up event listeners
  window.removeEventListener("online", handleOnlineStatus);
  window.removeEventListener("offline", handleOnlineStatus);
  window.removeEventListener("beforeinstallprompt", handlePwaPrompt);
  window.removeEventListener("keydown", handleKeydown);
  window.removeEventListener("error", handleGlobalError);

  // Reset body overflow
  document.body.style.overflow = "";
});

// Watch route changes
watch(route, handleRouteChange);

// Expose methods for debugging
if (import.meta.env.DEV) {
  window.__app_debug = {
    toggleMobileMenu,
    retryConnection,
    installPwa,
    showPwaPrompt: () => {
      showPwaPrompt.value = true;
    },
  };
}
</script>

<style scoped>
/* App Container */
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: theme("colors.knue.surface");
}

.app-layout {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
}

/* Header */
.app-header {
  background: white;
  border-bottom: 1px solid theme("colors.gray.200");
  position: sticky;
  top: 0;
  z-index: 40;
}

.app-nav {
  position: relative;
}

.nav-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
  max-width: 1200px;
  margin: 0 auto;
  min-height: 4rem;
}

/* Brand */
.nav-brand {
  display: flex;
  align-items: center;
  text-decoration: none;
  color: theme("colors.knue.primary");
  font-weight: 700;
  font-size: 1.25rem;
  transition: color 0.2s ease;
  flex-shrink: 0;
}

.nav-brand:hover {
  color: theme("colors.knue.secondary");
}

.brand-text {
  white-space: nowrap;
}

/* Home Controls */
.nav-home-controls {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  max-width: 400px;
  margin: 0 1rem;
}

.nav-refresh-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border: none;
  background: transparent;
  color: theme("colors.gray.600");
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.nav-refresh-btn:hover:not(:disabled) {
  background: theme("colors.gray.100");
  color: theme("colors.knue.primary");
}

.nav-refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Desktop Navigation */
.nav-menu {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.nav-link {
  display: flex;
  align-items: center;
  padding: 0.5rem 1rem;
  text-decoration: none;
  color: theme("colors.gray.600");
  font-weight: 500;
  border-radius: 0.5rem;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.nav-link:hover {
  color: theme("colors.knue.secondary");
  background: rgba(7, 45, 110, 0.05);
}

.nav-active {
  color: theme("colors.knue.primary");
  background: rgba(7, 45, 110, 0.1);
  font-weight: 600;
}

/* Mobile Menu Toggle */
.mobile-menu-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border: none;
  background: transparent;
  color: theme("colors.gray.600");
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.mobile-menu-toggle:hover {
  background: theme("colors.gray.100");
  color: theme("colors.gray.900");
}

/* Mobile Navigation Overlay */
.mobile-nav-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 35;
  backdrop-filter: blur(4px);
}

/* Mobile Navigation */
.mobile-nav {
  position: absolute;
  top: calc(3.5rem + env(safe-area-inset-top, 0px));
  left: 0;
  right: 0;
  background: white;
  border-bottom: 1px solid theme("colors.gray.200");
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  max-height: calc(
    100vh - 3.5rem - env(safe-area-inset-top, 0px) -
      env(safe-area-inset-bottom, 0px)
  );
  overflow-y: auto;
}

.mobile-nav-content {
  padding: 1rem;
  max-width: 1200px;
  margin: 0 auto;
  min-height: fit-content;
}

.mobile-nav-link {
  display: flex;
  align-items: center;
  padding: 1rem;
  text-decoration: none;
  color: theme("colors.gray.700");
  border-radius: 0.75rem;
  transition: all 0.2s ease;
  margin-bottom: 0.5rem;
}

.mobile-nav-link:hover {
  background: theme("colors.blue.50");
  color: theme("colors.knue.primary");
}

.mobile-nav-link.nav-active {
  background: theme("colors.blue.100");
  color: theme("colors.knue.primary");
}

.link-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.link-title {
  font-weight: 600;
  font-size: 1rem;
}

.link-description {
  font-size: 0.875rem;
  color: theme("colors.gray.500");
}

/* Main Content */
.app-main {
  flex: 1;
  position: relative;
}

.with-bottom-nav {
  padding-bottom: 4rem;
}

.no-header {
  padding-top: 0;
}

/* Bottom Navigation */
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-top: 1px solid theme("colors.gray.200");
  display: flex;
  justify-content: space-around;
  padding: 0.75rem 0 calc(0.75rem + env(safe-area-inset-bottom));
  z-index: 30;
}

.bottom-nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem;
  text-decoration: none;
  color: theme("colors.gray.500");
  border-radius: 0.5rem;
  transition: all 0.2s ease;
  min-width: 4rem;
}

.bottom-nav-item:hover {
  color: theme("colors.knue.secondary");
  background: rgba(7, 45, 110, 0.05);
}

.bottom-nav-item.nav-active {
  color: theme("colors.knue.primary");
  font-weight: 600;
}

.nav-label {
  font-size: 0.75rem;
  font-weight: 500;
}

/* Route Component */
.route-component {
  min-height: calc(100vh - 3.5rem);
}

/* Global Loading Overlay */
.global-loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9998;
  backdrop-filter: blur(2px);
}

/* Offline Banner */
.offline-banner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: theme("colors.orange.500");
  color: white;
  z-index: 50;
  padding: 0.75rem;
}

.offline-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  max-width: 1200px;
  margin: 0 auto;
  font-size: 0.875rem;
  font-weight: 500;
}

.retry-button {
  display: flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 0.375rem;
  color: white;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s ease;
  margin-left: 1rem;
}

.retry-button:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.3);
}

.retry-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* PWA Prompt */
.pwa-prompt {
  position: fixed;
  bottom: 1rem;
  left: 1rem;
  right: 1rem;
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  border: 1px solid theme("colors.gray.200");
  z-index: 45;
  max-width: 400px;
  margin: 0 auto;
}

.pwa-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  gap: 1rem;
}

.pwa-info {
  display: flex;
  align-items: center;
  flex: 1;
}

.pwa-text {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.pwa-title {
  font-weight: 600;
  color: theme("colors.gray.900");
}

.pwa-description {
  font-size: 0.875rem;
  color: theme("colors.gray.600");
}

.pwa-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.pwa-install-btn {
  padding: 0.5rem 1rem;
  background: theme("colors.knue.primary");
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease;
}

.pwa-install-btn:hover {
  background: theme("colors.knue.secondary");
}

.pwa-dismiss-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: none;
  background: transparent;
  color: theme("colors.gray.400");
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.pwa-dismiss-btn:hover {
  background: theme("colors.gray.100");
  color: theme("colors.gray.600");
}

/* Responsive Design */
.desktop-only {
  display: flex;
}

.mobile-only {
  display: none;
}

@media (max-width: 768px) {
  .desktop-only {
    display: none;
  }

  .mobile-only {
    display: flex;
  }

  .nav-container {
    padding: 0.75rem 1rem;
    min-height: 3rem;
  }

  .brand-text {
    display: none;
  }

  .nav-home-controls {
    max-width: none;
    margin: 0 0.5rem;
    flex: 1;
  }

  .nav-refresh-btn {
    width: 2rem;
    height: 2rem;
  }

  .mobile-nav {
    top: calc(3rem + env(safe-area-inset-top, 0px));
    max-height: calc(
      100vh - 3rem - env(safe-area-inset-top, 0px) -
        env(safe-area-inset-bottom, 0px)
    );
  }

  .route-component {
    min-height: calc(100vh - 3rem);
  }

  .mobile-nav-link {
    padding: 1rem 0.75rem;
    margin-bottom: 0.25rem;
  }

  .link-content {
    gap: 0.125rem;
  }

  .link-title {
    font-size: 0.875rem;
  }

  .link-description {
    font-size: 0.75rem;
  }
}

/* Transitions */
.mobile-menu-enter-active,
.mobile-menu-leave-active {
  transition: all 0.3s ease;
}

.mobile-menu-enter-from,
.mobile-menu-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.loading-overlay-enter-active,
.loading-overlay-leave-active {
  transition: all 0.3s ease;
}

.loading-overlay-enter-from,
.loading-overlay-leave-to {
  opacity: 0;
}

.offline-banner-enter-active,
.offline-banner-leave-active {
  transition: all 0.3s ease;
}

.offline-banner-enter-from,
.offline-banner-leave-to {
  opacity: 0;
  transform: translateY(-100%);
}

.pwa-prompt-enter-active,
.pwa-prompt-leave-active {
  transition: all 0.3s ease;
}

.pwa-prompt-enter-from,
.pwa-prompt-leave-to {
  opacity: 0;
  transform: translateY(100%);
}

/* Route Transitions */
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.3s ease;
}

.slide-left-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.slide-left-leave-to {
  opacity: 0;
  transform: translateX(-100%);
}

.slide-right-enter-from {
  opacity: 0;
  transform: translateX(-100%);
}

.slide-right-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

/* Dark Mode */
@media (prefers-color-scheme: dark) {
  .app-container {
    background: theme("colors.gray.900");
  }

  .app-header {
    background: theme("colors.gray.800");
    border-color: theme("colors.gray.700");
  }

  .nav-brand {
    color: theme("colors.gray.100");
  }

  .nav-link {
    color: theme("colors.gray.300");
  }

  .nav-link:hover {
    background: theme("colors.gray.700");
  }

  .nav-refresh-btn {
    color: theme("colors.gray.400");
  }

  .nav-refresh-btn:hover:not(:disabled) {
    background: theme("colors.gray.700");
    color: theme("colors.knue.primary");
  }

  .nav-active {
    background: theme("colors.gray.700");
  }

  .mobile-nav {
    background: theme("colors.gray.800");
    border-color: theme("colors.gray.700");
  }

  .mobile-nav-link {
    color: theme("colors.gray.300");
  }

  .mobile-nav-link:hover {
    background: theme("colors.gray.700");
  }

  .bottom-nav {
    background: theme("colors.gray.800");
    border-color: theme("colors.gray.700");
  }

  .bottom-nav-item {
    color: theme("colors.gray.400");
  }

  .bottom-nav-item:hover {
    background: theme("colors.gray.700");
  }

  .pwa-prompt {
    background: theme("colors.gray.800");
    border-color: theme("colors.gray.700");
  }

  .pwa-title {
    color: theme("colors.gray.100");
  }

  .pwa-description {
    color: theme("colors.gray.400");
  }
}

/* Dark Mode via class (for manual theme switching) */
.dark .app-container {
  background: theme("colors.gray.900");
}

.dark .app-header {
  background: theme("colors.gray.800");
  border-color: theme("colors.gray.700");
}

.dark .nav-brand {
  color: theme("colors.gray.100");
}

.dark .nav-link {
  color: theme("colors.gray.300");
}

.dark .nav-link:hover {
  background: theme("colors.gray.700");
}

.dark .nav-active {
  background: theme("colors.gray.700");
}

.dark .nav-refresh-btn {
  color: theme("colors.gray.400");
}

.dark .nav-refresh-btn:hover:not(:disabled) {
  background: theme("colors.gray.700");
  color: theme("colors.knue.primary");
}

.dark .mobile-nav {
  background: theme("colors.gray.800");
  border-color: theme("colors.gray.700");
}

.dark .mobile-nav-link {
  color: theme("colors.gray.300");
}

.dark .mobile-nav-link:hover {
  background: theme("colors.gray.700");
}

.dark .bottom-nav {
  background: theme("colors.gray.800");
  border-color: theme("colors.gray.700");
}

.dark .bottom-nav-item {
  color: theme("colors.gray.400");
}

.dark .bottom-nav-item:hover {
  background: theme("colors.gray.700");
}

.dark .pwa-prompt {
  background: theme("colors.gray.800");
  border-color: theme("colors.gray.700");
}

.dark .pwa-title {
  color: theme("colors.gray.100");
}

.dark .pwa-description {
  color: theme("colors.gray.400");
}

/* Mobile Menu Open State */
.mobile-menu-open {
  overflow: hidden;
}

/* Offline Mode */
.offline-mode {
  filter: grayscale(0.3);
}

/* Fullscreen Layout */
.fullscreen-layout .app-main {
  padding: 0;
}

/* Safe Area Support */
@supports (padding: max(0px)) {
  .app-header {
    padding-top: max(env(safe-area-inset-top), 0);
  }

  .bottom-nav {
    padding-bottom: max(env(safe-area-inset-bottom), 0.75rem);
  }
}
</style>
