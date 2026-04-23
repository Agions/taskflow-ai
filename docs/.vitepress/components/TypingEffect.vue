<template>
  <span class="typing-text">
    <span class="text">{{ displayText }}</span>
    <span class="cursor" :class="{ 'cursor-blink': !isTyping }"></span>
  </span>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'

const props = defineProps({
  texts: {
    type: Array,
    default: () => ['思维编排', '智能路由', '自主执行']
  },
  speed: {
    type: Number,
    default: 100
  },
  deleteSpeed: {
    type: Number,
    default: 50
  },
  pause: {
    type: Number,
    default: 2000
  }
})

const displayText = ref('')
const isTyping = ref(false)
let currentIndex = 0
let currentText = ''
let isDeleting = false

const type = () => {
  const fullText = props.texts[currentIndex]
  
  if (isDeleting) {
    currentText = fullText.substring(0, currentText.length - 1)
    displayText.value = currentText
    
    if (currentText === '') {
      isDeleting = false
      currentIndex = (currentIndex + 1) % props.texts.length
      setTimeout(type, 300)
    } else {
      setTimeout(type, props.deleteSpeed)
    }
  } else {
    currentText = fullText.substring(0, currentText.length + 1)
    displayText.value = currentText
    isTyping.value = true
    
    if (currentText === fullText) {
      isTyping.value = false
      isDeleting = true
      setTimeout(type, props.pause)
    } else {
      setTimeout(type, props.speed)
    }
  }
}

onMounted(() => {
  type()
})
</script>

<style scoped>
.typing-text {
  display: inline;
}

.text {
  color: var(--tf-primary);
  font-weight: 700;
}

.cursor {
  display: inline-block;
  width: 2px;
  height: 1.2em;
  background: var(--tf-primary);
  margin-left: 2px;
  vertical-align: middle;
}

.cursor-blink {
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
</style>
