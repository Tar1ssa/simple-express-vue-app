<script setup>
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
</script>

<template>
  <div>
    <h1 style="font-size: 2rem; margin-bottom: 1rem;">Dashboard</h1>
    <p style="color: var(--color-text-muted); margin-bottom: 2rem;">
      Welcome to your secure area!
    </p>

    <div class="card" style="max-width: 600px;">
      <h2 style="font-size: 1.25rem; margin-bottom: 1rem;">Session Info</h2>
      <div style="background: var(--color-bg); padding: 1rem; border-radius: var(--radius-md); font-family: monospace; overflow-x: auto;">
        <p><strong>Name:</strong> {{ authStore.user?.name }}</p>
        <p><strong>Email:</strong> {{ authStore.user?.email }}</p>
        <p><strong>Role:</strong> <span class="badge" :class="{'badge-admin': authStore.user?.role === 'admin'}">{{ authStore.user?.role }}</span></p>
      </div>
    </div>
  </div>
</template>
