<template>
  <div class="particle-bg">
    <div class="particles">
      <div v-for="n in 30" :key="n" class="particle" :style="getParticleStyle(n)"></div>
    </div>
    <div class="gradient-overlay"></div>
  </div>
</template>

<script setup>
const getParticleStyle = (n) => {
  const size = Math.random() * 4 + 2
  const left = Math.random() * 100
  const delay = Math.random() * 8
  const duration = Math.random() * 10 + 8
  const opacity = Math.random() * 0.5 + 0.2
  
  return {
    width: `${size}px`,
    height: `${size}px`,
    left: `${left}%`,
    animationDelay: `${delay}s`,
    animationDuration: `${duration}s`,
    opacity: opacity,
    background: n % 3 === 0 ? '#60a5fa' : n % 3 === 1 ? '#8b5cf6' : '#06b6d4'
  }
}
</script>

<style scoped>
.particle-bg {
  position: absolute;
  inset: 0;
  overflow: hidden;
  z-index: 0;
}

.particles {
  position: relative;
  width: 100%;
  height: 100%;
}

.particle {
  position: absolute;
  border-radius: 50%;
  bottom: -10px;
  animation: float-up linear infinite;
  filter: blur(1px);
}

.gradient-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    transparent 0%,
    var(--vp-c-bg) 100%
  );
  pointer-events: none;
}

@keyframes float-up {
  0% {
    transform: translateY(0) rotate(0deg) scale(1);
    opacity: 0;
  }
  10% {
    opacity: var(--particle-opacity, 0.5);
  }
  90% {
    opacity: var(--particle-opacity, 0.5);
  }
  100% {
    transform: translateY(-100vh) rotate(360deg) scale(0.5);
    opacity: 0;
  }
}
</style>
