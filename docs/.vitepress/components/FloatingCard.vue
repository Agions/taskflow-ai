<template>
  <div class="floating-card" :style="cardStyle">
    <div class="card-inner">
      <div class="card-icon" v-if="icon">
        <span v-if="typeof icon === 'string'">{{ icon }}</span>
        <slot name="icon" v-else></slot>
      </div>
      <h3 class="card-title">{{ title }}</h3>
      <p class="card-desc">{{ description }}</p>
      <div class="card-glow"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const props = defineProps({
  icon: { type: String, default: '' },
  title: { type: String, required: true },
  description: { type: String, required: true },
  delay: { type: Number, default: 0 },
  floatRange: { type: Number, default: 10 }
})

const yOffset = ref(0)
let animationId = null

const cardStyle = computed(() => ({
  animationDelay: `${props.delay}ms`
}))

onMounted(() => {
  let start = null
  const animate = (timestamp) => {
    if (!start) start = timestamp
    const elapsed = timestamp - start + props.delay
    yOffset.value = Math.sin(elapsed * 0.001) * props.floatRange
    animationId = requestAnimationFrame(animate)
  }
  animationId = requestAnimationFrame(animate)
})
</script>

<style scoped>
.floating-card {
  position: relative;
  background: var(--vp-c-bg-soft);
  border-radius: 16px;
  padding: 2rem;
  border: 1px solid var(--vp-c-divider);
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  animation: fadeInUp 0.6s ease-out backwards;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.floating-card:hover {
  transform: translateY(-8px);
  border-color: var(--tf-primary);
  box-shadow: 
    0 20px 40px -12px rgba(59, 130, 246, 0.25),
    0 0 0 1px rgba(59, 130, 246, 0.1);
}

.card-inner {
  position: relative;
  z-index: 2;
}

.card-icon {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  display: inline-block;
  animation: iconPulse 3s ease-in-out infinite;
}

@keyframes iconPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.card-title {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0 0 0.75rem 0;
  color: var(--vp-c-text-1);
}

.card-desc {
  font-size: 0.95rem;
  color: var(--vp-c-text-2);
  line-height: 1.6;
  margin: 0;
}

.card-glow {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(
    circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
    rgba(59, 130, 246, 0.15) 0%,
    transparent 50%
  );
  opacity: 0;
  transition: opacity 0.3s;
  pointer-events: none;
}

.floating-card:hover .card-glow {
  opacity: 1;
}
</style>
