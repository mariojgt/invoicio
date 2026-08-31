<template>
  <div class="login-screen">
    <form class="login-card" @submit.prevent="handleSubmit">
      <div class="login-logo">
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <rect width="100" height="100" rx="12" fill="currentColor"/>
          <text x="50" y="68" font-family="Arial" font-size="55" font-weight="bold" fill="white" text-anchor="middle">I</text>
        </svg>
      </div>
      <h1>Sign in to Invoicio</h1>
      <p class="login-subtitle">Enter your credentials to manage your invoices</p>

      <div class="login-field">
        <label for="login-username">Username</label>
        <input
          id="login-username"
          v-model="username"
          type="text"
          autocomplete="username"
          required
          autofocus
        >
      </div>

      <div class="login-field">
        <label for="login-password">Password</label>
        <input
          id="login-password"
          v-model="password"
          type="password"
          autocomplete="current-password"
          required
        >
      </div>

      <p v-if="error" class="login-error" role="alert">{{ error }}</p>

      <button type="submit" class="login-submit" :disabled="loading">
        {{ loading ? 'Signing in…' : 'Sign In' }}
      </button>
    </form>
  </div>
</template>

<script>
import { ref } from 'vue'
import { login } from '../composables/useApi'

export default {
  name: 'LoginScreen',
  emits: ['success'],
  setup(props, { emit }) {
    const username = ref('')
    const password = ref('')
    const error = ref('')
    const loading = ref(false)

    const handleSubmit = async () => {
      error.value = ''
      loading.value = true
      try {
        await login(username.value, password.value)
        emit('success')
      } catch (err) {
        error.value = err.message === 'Not authenticated' ? 'Invalid username or password' : err.message
      } finally {
        loading.value = false
      }
    }

    return { username, password, error, loading, handleSubmit }
  }
}
</script>

<style scoped>
.login-screen {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--gray-50) 0%, var(--gray-200) 100%);
  padding: 20px;
}

.login-card {
  background: white;
  border-radius: 16px;
  box-shadow: var(--shadow-lg);
  padding: 40px;
  width: 100%;
  max-width: 400px;
  text-align: center;
}

.login-logo svg {
  width: 56px;
  height: 56px;
  color: var(--primary);
  margin-bottom: 16px;
}

.login-card h1 {
  font-size: 22px;
  color: var(--gray-900);
  margin-bottom: 8px;
}

.login-subtitle {
  color: var(--gray-500);
  font-size: 14px;
  margin-bottom: 28px;
}

.login-field {
  text-align: left;
  margin-bottom: 16px;
}

.login-field label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--gray-700);
  margin-bottom: 6px;
}

.login-field input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--gray-300);
  border-radius: var(--border-radius);
  font-size: 15px;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.login-field input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15);
}

.login-error {
  color: var(--danger);
  font-size: 13px;
  margin-bottom: 16px;
}

.login-submit {
  width: 100%;
  padding: 12px;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}

.login-submit:hover:not(:disabled) {
  background: var(--primary-dark);
}

.login-submit:disabled {
  opacity: 0.7;
  cursor: default;
}
</style>
