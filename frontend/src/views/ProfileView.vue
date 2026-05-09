<script setup>
import { ref, onMounted } from 'vue'
import { api } from '@/services/api'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

const name = ref('')
const email = ref('')
const success = ref('')
const error = ref('')
const isLoading = ref(false)

onMounted(() => {
  if (authStore.user) {
    name.value = authStore.user.name
    email.value = authStore.user.email
  }
})

const handleUpdate = async () => {
  success.value = ''
  error.value = ''
  isLoading.value = true
  
  try {
    const res = await api.updateProfile({ name: name.value, email: email.value })
    if (res.ok) {
      success.value = 'Profile updated successfully'
      await authStore.fetchProfile() // refresh store
    } else {
      if (res.data.errors) {
        error.value = res.data.errors.map(e => e.message).join(', ')
      } else {
        error.value = res.data.message || 'Update failed'
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
    <h1 style="font-size: 2rem; margin-bottom: 1rem;">Your Profile</h1>
    
    <div class="card">
      <div v-if="error" class="alert alert-danger">{{ error }}</div>
      <div v-if="success" class="alert alert-success">{{ success }}</div>
      
      <form @submit.prevent="handleUpdate">
        <div class="form-group">
          <label class="form-label" for="name">Name</label>
          <input id="name" v-model="name" type="text" class="form-control" required />
        </div>
        
        <div class="form-group">
          <label class="form-label" for="email">Email</label>
          <input id="email" v-model="email" type="email" class="form-control" required />
        </div>
        
        <div style="display: flex; gap: 1rem; margin-top: 2rem;">
          <button type="submit" class="btn btn-primary" :disabled="isLoading" style="width: auto;">
            {{ isLoading ? 'Saving...' : 'Save Changes' }}
          </button>
          
          <RouterLink to="/change-password" class="btn btn-outline">
            Change Password
          </RouterLink>
        </div>
      </form>
    </div>
  </div>
</template>
