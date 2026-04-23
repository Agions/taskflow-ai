<template>
  <div class="stat-counter">
    <span class="number" :data-target="target">{{ displayNumber }}</span>
    <span class="suffix">{{ suffix }}</span>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'

const props = defineProps({
  target: { type: Number, default: 0 },
  suffix: { type: String, default: '' },
  duration: { type: Number, default: 2000 }
})

const displayNumber = ref('0')
let hasAnimated = false

const animate = () => {
  if (hasAnimated) return
  hasAnimated = true
  
  const start = performance.now()
  const duration = props.duration
  
  const update = (now) => {
    const elapsed = now - start
    const progress = Math.min(elapsed / duration, 1)
    
    // Easing function (easeOutExpo)
    const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
    
    const current = Math.floor(eased * props.target)
    displayNumber.value = current.toLocaleString()
    
    if (progress < 1) {
      requestAnimationFrame(update)
    }
  }
  
  requestAnimationFrame(update)
}

onMounted(() => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animate()
      }
    })
  }, { threshold: 0.5 })
  
  const el = document.querySelector('.stat-counter')
  if (el) observer.observe(el)
})
</script>

<style scoped>
.stat-counter {
  display: inline-flex;
  align-items: baseline;
  gap: 0.25rem;
}

.number {
  font-size: 2.5rem;
  font-weight: 800;
  background: var(--tf-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-variant-numeric: tabular-nums;
}

.suffix {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--tf-primary);
}
</style>
