<script setup>
import { ref, onMounted } from 'vue'
import { api } from '@/services/api'
import { useAuthStore } from '@/stores/auth'

const users = ref([])
const error = ref('')
const isLoading = ref(true)

onMounted(async () => {
  try {
    const res = await api.listUsers()
    if (res.ok) {
      users.value = res.data.data
    } else {
      error.value = res.data.message || 'Failed to fetch users'
    }
  } catch (err) {
    error.value = 'An unexpected error occurred'
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div>
    <h1 style="font-size: 2rem; margin-bottom: 1rem;">Users Management</h1>
    <p style="color: var(--color-text-muted); margin-bottom: 2rem;">
      Only administrators can see this page.
    </p>

    <div v-if="error" class="alert alert-danger">{{ error }}</div>
    <div v-if="isLoading" style="text-align: center; padding: 2rem; color: var(--color-text-muted);">Loading users...</div>

    <div class="card table-container" v-else>
      <table class="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user.id">
            <td style="font-family: monospace; font-size: 0.875rem;">{{ user.id }}</td>
            <td>{{ user.name }}</td>
            <td>{{ user.email }}</td>
            <td>
              <span class="badge" :class="{'badge-admin': user.role === 'admin'}">{{ user.role }}</span>
            </td>
            <td style="font-size: 0.875rem; color: var(--color-text-muted);">{{ new Date(user.createdAt).toLocaleDateString() }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
