import { useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import HumedadForm from './pages/HumedadForm'

function App() {
    // Capture JWT token from URL (passed by parent iframe shell)
    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        const token = params.get('token')
        if (token) {
            localStorage.setItem('token', token)
        }
    }, [])

    return (
        <div className="min-h-screen bg-background font-sans antialiased">
            <HumedadForm />
            <Toaster position="top-right" />
        </div>
    )
}

export default App
