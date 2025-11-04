import { createRoot } from 'react-dom/client'
import './index.css'
import { ThemeProvider } from './components/theme-provider.tsx'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
    <App />
)
