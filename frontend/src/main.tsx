/* eslint-disable react-refresh/only-export-components */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, BrowserRouter } from 'react-router'
import '@/lib/i18n'
import './index.css'
import App from './App.tsx'
import { setApiUrl, setUploadsUrl } from '@/lib/config'

if (import.meta.env.DEV) {
  const originalWarn = console.warn
  console.warn = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].includes('outdated JSX transform')) return
    originalWarn.apply(console, args as never[])
  }
}

const isElectron = typeof window !== 'undefined' && (!!window.electronAPI || window.location.protocol === 'file:')

async function bootstrap(): Promise<void> {
  let port: string | undefined

  if (isElectron && window.electronAPI) {
    port = String(await window.electronAPI.getBackendPort())
  } else if (isElectron) {
    // Fallback: read port from query parameter injected by Electron main process
    const params = new URLSearchParams(window.location.search)
    port = params.get('port') || undefined
  }

  if (port) {
    const baseUrl = `http://127.0.0.1:${port}`
    setApiUrl(`${baseUrl}/api`)
    setUploadsUrl(`${baseUrl}/uploads`)
  }
}

const Router = isElectron ? HashRouter : BrowserRouter

bootstrap().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <Router>
        <App />
      </Router>
    </StrictMode>,
  )
})

if (!isElectron && 'serviceWorker' in navigator && import.meta.env.PROD) {
  navigator.serviceWorker.register('/sw.js').catch(() => {
    // SW registration failed — silently ignore
  })
}
