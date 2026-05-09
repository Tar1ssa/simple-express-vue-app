<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('admin@example.com')
const password = ref('Admin123!')
const error = ref('')
const isLoading = ref(false)

const handleLogin = async () => {
  error.value = ''
  isLoading.value = true
  
  try {
    const res = await authStore.login(email.value, password.value)
    if (res.ok) {
      router.push('/dashboard')
    } else {
      error.value = res.data.message || 'Login failed'
    }
  } catch (err) {
    error.value = 'An unexpected error occurred'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="auth-container">
    <h2 class="auth-title">Welcome Back</h2>
    <p class="auth-subtitle">Sign in to your account</p>
    
    <div v-if="error" class="alert alert-danger">{{ error }}</div>
    
    <form @submit.prevent="handleLogin">
      <div class="form-group">
        <label class="form-label" for="email">Email</label>
        <input 
          id="email" 
          v-model="email" 
          type="email" 
          class="form-control" 
          required 
          placeholder="Enter your email"
        />
      </div>
      
      <div class="form-group">
        <label class="form-label" for="password">Password</label>
        <input 
          id="password" 
          v-model="password" 
          type="password" 
          class="form-control" 
          required 
          placeholder="Enter your password"
        />
      </div>
      
      <div class="form-group" style="text-align: right; margin-top: -10px; margin-bottom: 20px;">
        <RouterLink to="/forgot-password" style="font-size: 0.875rem;">Forgot Password?</RouterLink>
      </div>
      
      <button type="submit" class="btn btn-primary" :disabled="isLoading">
        {{ isLoading ? 'Signing in...' : 'Sign In' }}
      </button>
      
      <p style="text-align: center; margin-top: 1.5rem; font-size: 0.9rem; color: var(--color-text-muted);">
        Don't have an account? <RouterLink to="/register">Register here</RouterLink>
      </p>
    </form>
  </div>
</template>
