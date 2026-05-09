<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const isAuthenticated = computed(() => authStore.isAuthenticated)
const isAdmin = computed(() => authStore.user?.role === 'admin')

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}
</script>

<template>
  <div class="app-container">
    <nav class="navbar">
      <div class="navbar-brand">Express JWT API</div>
      <div class="navbar-nav">
        <template v-if="isAuthenticated">
          <RouterLink to="/dashboard" class="nav-link">Dashboard</RouterLink>
          <RouterLink to="/profile" class="nav-link">Profile</RouterLink>
          <RouterLink v-if="isAdmin" to="/users" class="nav-link">Users (Admin)</RouterLink>
          <a href="#" @click.prevent="handleLogout" class="nav-link">Logout</a>
        </template>
        <template v-else>
          <RouterLink to="/login" class="nav-link">Login</RouterLink>
          <RouterLink to="/register" class="nav-link">Register</RouterLink>
        </template>
      </div>
    </nav>
    
    <main class="main-content">
      <RouterView />
    </main>
  </div>
</template>
