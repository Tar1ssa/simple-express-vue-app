<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/services/api'

const router = useRouter()

const token = ref('')
const newPassword = ref('')
const success = ref('')
const error = ref('')
const isLoading = ref(false)

const handleReset = async () => {
  error.value = ''
  success.value = ''
  isLoading.value = true
  
  try {
    const res = await api.resetPassword(token.value, newPassword.value)
    if (res.ok) {
      success.value = res.data.message || 'Password reset successful'
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } else {
      if (res.data.errors) {
        error.value = res.data.errors.map(e => e.message).join(', ')
      } else {
        error.value = res.data.message || 'Reset failed'
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
    <h2 class="auth-title">Reset Password</h2>
    <p class="auth-subtitle">Enter your token and new password</p>
    
    <div v-if="error" class="alert alert-danger">{{ error }}</div>
    <div v-if="success" class="alert alert-success">{{ success }}</div>
    
    <form @submit.prevent="handleReset" v-if="!success">
      <div class="form-group">
        <label class="form-label" for="token">Reset Token</label>
        <input 
          id="token" 
          v-model="token" 
          type="text" 
          class="form-control" 
          required 
          placeholder="Enter the reset token"
        />
      </div>
      
      <div class="form-group">
        <label class="form-label" for="newPassword">New Password</label>
        <input 
          id="newPassword" 
          v-model="newPassword" 
          type="password" 
          class="form-control" 
          required 
          placeholder="Min 8 chars, 1 uppercase, 1 number"
        />
      </div>
      
      <button type="submit" class="btn btn-primary" :disabled="isLoading">
        {{ isLoading ? 'Resetting...' : 'Reset Password' }}
      </button>
      
      <p style="text-align: center; margin-top: 1.5rem; font-size: 0.9rem; color: var(--color-text-muted);">
        Back to <RouterLink to="/login">Login</RouterLink>
      </p>
    </form>
  </div>
</template>
