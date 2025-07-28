<template>
  <article
    class="card-rss group"
    :class="{ 'opacity-60': isRead }"
    @click="handleItemClick"
  >
    <!-- Department Badge -->
    <div class="flex-between mb-3">
      <span :class="departmentBadgeClass" class="badge-department">
        <span class="mr-1">{{ item.department?.icon || "📄" }}</span>
        {{ item.department?.name || "기타" }}
      </span>

      <time
        :datetime="item.pubDate"
        class="text-caption"
        :title="formatDateDetailed(item.pubDate)"
      >
        {{ formatDateForMobile(item.pubDate) }}
      </time>
    </div>

    <!-- Title -->
    <h2
      class="text-title mb-2 line-clamp-2 group-hover:text-knue-primary transition-colors"
    >
      {{ item.title }}
    </h2>

    <!-- Footer Actions -->
    <div class="flex-between">
      <!-- Read Status Indicator -->
      <div class="flex items-center space-x-2">
        <div
          v-if="!isRead"
          class="w-2 h-2 bg-knue-primary rounded-full animate-pulse"
          aria-label="새 게시글"
        />
        <span class="text-caption">
          {{ isRead ? "읽음" : "새 게시글" }}
        </span>
      </div>

      <!-- Action Icons -->
      <div class="flex items-center space-x-3">
        <!-- Share Icon -->
        <i
          v-if="canShare"
          @click.stop="handleShare"
          class="i-tabler-share w-5 h-5 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          aria-label="공유하기"
          title="공유하기"
        />

        <!-- Bookmark Icon -->
        <i
          @click.stop="toggleBookmark"
          class="w-5 h-5 transition-colors cursor-pointer"
          :class="[
            isBookmarked ? 'i-tabler-bookmark-filled' : 'i-tabler-bookmark',
            isBookmarked
              ? 'text-yellow-500 hover:text-yellow-600'
              : 'text-gray-400 hover:text-gray-600'
          ]"
          :aria-label="isBookmarked ? '북마크 제거' : '북마크 추가'"
          :title="isBookmarked ? '북마크 제거' : '북마크 추가'"
        />

        <!-- External Link Icon -->
        <i class="i-tabler-external-link w-5 h-5 text-gray-400" />
      </div>
    </div>

    <!-- Loading State -->
    <div
      v-if="loading"
      class="absolute inset-0 bg-white bg-opacity-75 flex-center rounded-xl"
    >
      <div
        class="w-6 h-6 border-2 border-knue-primary border-t-transparent rounded-full animate-spin"
      />
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
  height: 100%; /* Full height for grid layout */
  display: flex;
  flex-direction: column;
}

/* Custom focus styles for accessibility */
article:focus-visible {
  outline: 2px solid theme("colors.knue.primary");
  outline-offset: 2px;
}

/* Ensure proper touch targets */
button {
  min-height: 44px;
  min-width: 44px;
}

/* Desktop enhancements */
@media (min-width: 1024px) {
  article {
    transition: all 0.2s ease;
    border-radius: 0.75rem;
  }

  article:hover {
    box-shadow: 0 8px 25px rgba(0, 102, 204, 0.1);
    transform: translateY(-2px);
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
