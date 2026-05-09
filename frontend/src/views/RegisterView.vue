<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const name = ref('')
const email = ref('')
const password = ref('')
const error = ref('')
const isLoading = ref(false)

const handleRegister = async () => {
  error.value = ''
  isLoading.value = true
  
  try {
    const res = await authStore.register(name.value, email.value, password.value)
    if (res.ok) {
      // Auto login after register
      const loginRes = await authStore.login(email.value, password.value)
      if (loginRes.ok) {
        router.push('/dashboard')
      }
    } else {
      if (res.data.errors) {
        error.value = res.data.errors.map(e => e.message).join(', ')
      } else {
        error.value = res.data.message || 'Registration failed'
      }
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
    <h2 class="auth-title">Create Account</h2>
    <p class="auth-subtitle">Join us to get started</p>
    
    <div v-if="error" class="alert alert-danger">{{ error }}</div>
    
    <form @submit.prevent="handleRegister">
      <div class="form-group">
        <label class="form-label" for="name">Name</label>
        <input 
          id="name" 
          v-model="name" 
          type="text" 
          class="form-control" 
          required 
          placeholder="Enter your name"
        />
      </div>

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
          placeholder="Enter your password (min 8 chars, 1 uppercase, 1 number)"
        />
      </div>
      
      <button type="submit" class="btn btn-primary" :disabled="isLoading">
        {{ isLoading ? 'Registering...' : 'Register' }}
      </button>
      
      <p style="text-align: center; margin-top: 1.5rem; font-size: 0.9rem; color: var(--color-text-muted);">
        Already have an account? <RouterLink to="/login">Sign In</RouterLink>
      </p>
    </form>
  </div>
</template>
