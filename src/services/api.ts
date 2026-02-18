import axios from 'axios'
import type { HumedadPayload } from '@/types'

const API_URL = import.meta.env.VITE_API_URL || 'https://api.geofal.com.pe'

const api = axios.create({
    baseURL: API_URL,
})

// Inject JWT token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

// Handle auth errors consistently with other CRM modules
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            window.dispatchEvent(new CustomEvent('session-expired'))
        }
        return Promise.reject(error)
    },
)

export async function generateHumedadExcel(payload: HumedadPayload): Promise<Blob> {
    const { data } = await api.post('/api/humedad/excel', payload, {
        responseType: 'blob',
    })
    return data
}

export default api
