import axios from 'axios'

const api = axios.create({
  baseURL:         '/api',
  withCredentials: true,
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status  = err.response?.status
    const url     = err.config?.url // endpoint ที่ยิงไป

    if (status === 401) {
      const isLoginPage    = window.location.pathname === '/login'
      const isAuthEndpoint = url?.includes('/auth/') // /auth/login, /auth/me

      // redirect เฉพาะตอนที่ไม่ได้อยู่หน้า login
      // และไม่ใช่ request จาก auth endpoint
      if (!isLoginPage && !isAuthEndpoint) {
        window.location.href = '/login'
      }
    }

    return Promise.reject(err)
  }
)

export default api