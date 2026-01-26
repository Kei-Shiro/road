<template>
  <div class="toast-container">
    <transition-group name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        :class="['toast', toast.type]"
      >
        <div class="toast-icon">
          <i :class="getIcon(toast.type)"></i>
        </div>
        <span class="toast-message">{{ toast.message }}</span>
        <button class="toast-close" @click="removeToast(toast.id)">&times;</button>
      </div>
    </transition-group>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const toasts = ref([])

const getIcon = (type) => {
  const icons = {
    success: 'fas fa-check',
    error: 'fas fa-times',
    warning: 'fas fa-exclamation',
    info: 'fas fa-info'
  }
  return icons[type] || icons.info
}

const addToast = (type, message) => {
  const id = Date.now()
  toasts.value.push({ id, type, message })

  setTimeout(() => {
    removeToast(id)
  }, 4000)
}

const removeToast = (id) => {
  const index = toasts.value.findIndex(t => t.id === id)
  if (index !== -1) {
    toasts.value.splice(index, 1)
  }
}

defineExpose({ addToast })
</script>

<style scoped>
.toast-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 3000;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.toast {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
  min-width: 300px;
  animation: slideIn 300ms ease;
}

.toast-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
}

.toast.success .toast-icon {
  background: #d1fae5;
  color: #10b981;
}

.toast.error .toast-icon {
  background: #fee2e2;
  color: #ef4444;
}

.toast.warning .toast-icon {
  background: #fef3c7;
  color: #f59e0b;
}

.toast.info .toast-icon {
  background: #dbeafe;
  color: #2563eb;
}

.toast-message {
  flex: 1;
  font-size: 0.875rem;
  color: #374151;
}

.toast-close {
  background: none;
  border: none;
  font-size: 20px;
  color: #9ca3af;
  cursor: pointer;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 300ms ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100px);
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(100px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
</style>

