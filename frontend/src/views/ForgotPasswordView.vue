<script setup>
import { ref } from 'vue'
import { api } from '@/services/api'

const email = ref('')
const success = ref('')
const error = ref('')
const isLoading = ref(false)

const handleForgot = async () => {
  error.value = ''
  success.value = ''
  isLoading.value = true
  
  try {
    const res = await api.forgotPassword(email.value)
    if (res.ok) {
      success.value = res.data.message || 'Check your email for reset instructions'
    } else {
      error.value = res.data.message || 'Request failed'
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
    <h2 class="auth-title">Forgot Password</h2>
    <p class="auth-subtitle">Enter your email to receive reset instructions</p>
    
    <div v-if="error" class="alert alert-danger">{{ error }}</div>
    <div v-if="success" class="alert alert-success">{{ success }}</div>
    
    <form @submit.prevent="handleForgot">
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
      
      <button type="submit" class="btn btn-primary" :disabled="isLoading">
        {{ isLoading ? 'Sending...' : 'Send Reset Link' }}
      </button>
      
      <p style="text-align: center; margin-top: 1.5rem; font-size: 0.9rem; color: var(--color-text-muted);">
        Remember your password? <RouterLink to="/login">Sign In</RouterLink>
      </p>
    </form>
  </div>
</template>
