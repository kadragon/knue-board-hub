<template>
  <article
    class="card-rss group"
    :class="{ 'opacity-60': isRead }"
    @click="handleItemClick"
    @keydown.enter="handleItemClick"
    @keydown.space.prevent="handleItemClick"
    tabindex="0"
    role="button"
    :aria-label="`${item.title} - ${item.department?.name || '기타'} 부서 게시글. ${isRead ? '읽음' : '새 게시글'}`"
    :aria-describedby="`rss-item-date-${item.id}`"
  >
    <!-- Department Badge -->
    <div class="flex-between mb-2">
      <span :class="departmentBadgeClass" class="badge-department">
        <span 
          class="mr-1" 
          :aria-label="`${item.department?.name || '기타'} 부서`"
          role="img"
        >{{ item.department?.icon || "📄" }}</span>
        {{ item.department?.name || "기타" }}
      </span>

      <time
        :id="`rss-item-date-${item.id}`"
        :datetime="item.pubDate"
        class="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full"
        :title="formatDateDetailed(item.pubDate)"
      >
        {{ formatDateForMobile(item.pubDate) }}
      </time>
    </div>

    <!-- Title -->
    <h3
      class="text-base md:text-lg font-bold text-knue-primary mb-2 line-clamp-2 leading-tight group-hover:text-knue-secondary transition-colors"
      :id="`rss-item-title-${item.id}`"
    >
      {{ item.title }}
    </h3>

    <!-- Footer Actions -->
    <div class="flex-between">
      <!-- Read Status Indicator -->
      <div class="flex items-center space-x-2">
        <div
          v-if="!isRead"
          class="w-2 h-2 bg-knue-accent rounded-full animate-pulse"
          aria-label="새 게시글"
        />
        <span class="text-caption">
          {{ isRead ? "읽음" : "새 게시글" }}
        </span>
      </div>

      <!-- Action Icons -->
      <div class="flex items-center space-x-3">
        <!-- Share Icon -->
        <button
          v-if="canShare"
          @click.stop="handleShare"
          class="inline-flex items-center justify-center w-8 h-8 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-knue-accent"
          aria-label="게시글 공유하기"
          type="button"
        >
          <i class="i-tabler-share w-5 h-5" aria-hidden="true" />
        </button>

        <!-- Bookmark Icon -->
        <button
          @click.stop="toggleBookmark"
          class="inline-flex items-center justify-center w-8 h-8 transition-colors rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-knue-accent"
          :class="[
            isBookmarked
              ? 'text-knue-accent hover:text-yellow-600'
              : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
          ]"
          :aria-label="isBookmarked ? '북마크에서 제거' : '북마크에 추가'"
          :aria-pressed="isBookmarked"
          type="button"
        >
          <i 
            :class="isBookmarked ? 'i-tabler-bookmark-filled' : 'i-tabler-bookmark'"
            class="w-5 h-5" 
            aria-hidden="true" 
          />
        </button>

        <!-- External Link Icon -->
        <i class="i-tabler-external-link w-5 h-5 text-gray-400 dark:text-gray-500" aria-hidden="true" />
      </div>
    </div>

    <!-- Loading State -->
    <div
      v-if="loading"
      class="absolute inset-0 bg-white bg-opacity-75 flex-center rounded-xl"
      role="status"
      aria-live="polite"
      aria-label="게시글 로딩 중"
    >
      <div
        class="w-6 h-6 border-2 border-knue-primary border-t-transparent rounded-full animate-spin"
        aria-hidden="true"
      />
      <span class="sr-only">게시글을 불러오는 중입니다...</span>
    </div>
  </article>
</template>

<script setup>
import { computed, ref } from "vue";
import { formatDateForMobile, formatDateDetailed } from "../utils/dateUtils.js";

// Props
const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
  compact: {
    type: Boolean,
    default: false,
  },
});

// Emits
const emit = defineEmits(["click", "share", "bookmark", "mark-read"]);

// State
const loading = ref(false);
const isRead = ref(false);
const isBookmarked = ref(false);

// Computed
const departmentBadgeClass = computed(() => {
  const departmentId = props.item.department?.id || "main";
  return `badge-${departmentId}`;
});

const canShare = computed(() => {
  return "share" in navigator;
});

// Methods
async function handleItemClick() {
  if (loading.value) return;

  loading.value = true;

  try {
    // Mark as read
    if (!isRead.value) {
      isRead.value = true;
      emit("mark-read", props.item);
    }

    // Emit click event
    emit("click", props.item);

    // Open external link
    if (props.item.link) {
      window.open(props.item.link, "_blank", "noopener,noreferrer");
    }
  } catch (error) {
    console.error("Error handling item click:", error);
  } finally {
    loading.value = false;
  }
}

async function handleShare() {
  if (!canShare.value) return;

  try {
    await navigator.share({
      title: props.item.title,
      text: props.item.title,
      url: props.item.link,
    });

    emit("share", props.item);
  } catch (error) {
    if (error.name !== "AbortError") {
      console.error("Error sharing:", error);
      // Fallback to clipboard
      await fallbackShare();
    }
  }
}

async function fallbackShare() {
  try {
    const shareText = `${props.item.title}\n${props.item.link}`;
    await navigator.clipboard.writeText(shareText);

    // You could show a toast notification here
    console.log("링크가 클립보드에 복사되었습니다");
  } catch (error) {
    console.error("Failed to copy to clipboard:", error);
  }
}

function toggleBookmark() {
  isBookmarked.value = !isBookmarked.value;
  emit("bookmark", {
    item: props.item,
    bookmarked: isBookmarked.value,
  });
}

// Expose methods for parent components
defineExpose({
  markAsRead: () => {
    isRead.value = true;
  },
  markAsUnread: () => {
    isRead.value = false;
  },
  setBookmarked: (value) => {
    isBookmarked.value = value;
  },
});
</script>

<style scoped>
/* Smooth touch feedback */
article {
  -webkit-tap-highlight-color: transparent;
  display: flex;
  flex-direction: column;
  height: auto; /* Allow natural height for proper grid layout */
}

/* Custom focus styles for accessibility (STYLE.md aligned) */
article:focus-visible {
  outline: 2px solid theme("colors.knue.accent");
  outline-offset: 2px;
  border-radius: 0.75rem;
}

/* Ensure proper touch targets */
button {
  min-height: 44px;
  min-width: 44px;
}

/* Desktop enhancements (STYLE.md aligned) */
@media (min-width: 768px) {
  article {
    transition: all 0.25s ease-out;
    border-radius: 0.75rem;
    border-width: 1.5px;
    margin-bottom: 1rem;
    padding: 1.25rem;
    box-shadow: 0 4px 12px rgba(7, 45, 110, 0.08);
  }

  article:hover {
    box-shadow: 0 12px 32px rgba(7, 45, 110, 0.15);
    transform: translateY(-3px);
    border-color: rgba(7, 45, 110, 0.3);
  }
}

@media (min-width: 1024px) {
  article {
    border-width: 2px;
    margin-bottom: 1.25rem;
    padding: 1.5rem;
    box-shadow: 0 6px 16px rgba(7, 45, 110, 0.1);
  }

  article:hover {
    box-shadow: 0 16px 40px rgba(7, 45, 110, 0.18);
    transform: translateY(-4px);
  }
}

/* Reduce motion for accessibility */
@media (prefers-reduced-motion: reduce) {
  article {
    transition: none;
  }

  article:hover {
    transform: none;
  }

  .animate-pulse {
    animation: none;
  }
}

/* Prevent text selection on touch */
@media (hover: none) and (pointer: coarse) {
  article {
    -webkit-user-select: none;
    user-select: none;
  }
}
</style>
