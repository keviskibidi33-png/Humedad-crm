import axios from 'axios'
import type {
    HumedadEnsayoDetail,
    HumedadEnsayoSummary,
    HumedadPayload,
    HumedadSaveResponse,
} from '@/types'

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
        params: {
            download: true,
        },
        responseType: 'blob',
    })
    return data
}

export async function saveHumedadEnsayo(
    payload: HumedadPayload,
    ensayoId?: number,
): Promise<HumedadSaveResponse> {
    const { data } = await api.post<HumedadSaveResponse>('/api/humedad/excel', payload, {
        params: {
            download: false,
            ensayo_id: ensayoId,
        },
    })
    return data
}

export async function saveAndDownloadHumedadExcel(
    payload: HumedadPayload,
    ensayoId?: number,
): Promise<{ blob: Blob; ensayoId?: number }> {
    const response = await api.post('/api/humedad/excel', payload, {
        params: {
            download: true,
            ensayo_id: ensayoId,
        },
        responseType: 'blob',
    })

    const humedadIdHeader = response.headers['x-humedad-id']
    const parsedId = Number(humedadIdHeader)
    return {
        blob: response.data,
        ensayoId: Number.isFinite(parsedId) ? parsedId : undefined,
    }
}

export async function listHumedadEnsayos(limit = 100): Promise<HumedadEnsayoSummary[]> {
    const { data } = await api.get<HumedadEnsayoSummary[]>('/api/humedad', {
        params: { limit },
    })
    return data
}

export async function getHumedadEnsayoDetail(ensayoId: number): Promise<HumedadEnsayoDetail> {
    const { data } = await api.get<HumedadEnsayoDetail>(`/api/humedad/${ensayoId}`)
    return data
}

export default api
