<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/services/api'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const currentPassword = ref('')
const newPassword = ref('')
const success = ref('')
const error = ref('')
const isLoading = ref(false)

const handleChangePassword = async () => {
  success.value = ''
  error.value = ''
  isLoading.value = true
  
  try {
    const res = await api.changePassword(currentPassword.value, newPassword.value)
    if (res.ok) {
      success.value = 'Password changed successfully'
      // update tokens with new ones
      api.setTokens(res.data.data.accessToken, res.data.data.refreshToken)
      
      currentPassword.value = ''
      newPassword.value = ''
      
      setTimeout(() => {
        router.push('/profile')
      }, 2000)
    } else {
      if (res.data.errors) {
        error.value = res.data.errors.map(e => e.message).join(', ')
      } else {
        error.value = res.data.message || 'Change failed'
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
  <div style="max-width: 600px;">
    <h1 style="font-size: 2rem; margin-bottom: 1rem;">Change Password</h1>
    
    <div class="card">
      <div v-if="error" class="alert alert-danger">{{ error }}</div>
      <div v-if="success" class="alert alert-success">{{ success }}</div>
      
      <form @submit.prevent="handleChangePassword">
        <div class="form-group">
          <label class="form-label" for="currentPassword">Current Password</label>
          <input id="currentPassword" v-model="currentPassword" type="password" class="form-control" required />
        </div>
        
        <div class="form-group">
          <label class="form-label" for="newPassword">New Password</label>
          <input id="newPassword" v-model="newPassword" type="password" class="form-control" required 
                 placeholder="Min 8 chars, 1 uppercase, 1 number" />
        </div>
        
        <div style="display: flex; gap: 1rem; margin-top: 2rem;">
          <button type="submit" class="btn btn-primary" :disabled="isLoading" style="width: auto;">
            {{ isLoading ? 'Changing...' : 'Update Password' }}
          </button>
          
          <RouterLink to="/profile" class="btn btn-outline">
            Cancel
          </RouterLink>
        </div>
      </form>
    </div>
  </div>
</template>
