import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { env } from '@/app/config/env'
import App from '@/App'
import '@/styles/index.css'

async function enableMocking() {
  if (!env.enableMockApi) return
  const { worker } = await import('@/mocks/browser')
  // Wait until the worker is controlling this client so /api never hits the
  // Vite proxy / Nest while mock mode is enabled.
  await worker.start({
    onUnhandledRequest: 'bypass',
    quiet: true,
    serviceWorker: { url: '/mockServiceWorker.js' },
  })
  await navigator.serviceWorker.ready
}

enableMocking()
  .catch((error) => {
    console.error('[msw] Failed to start mock API worker', error)
  })
  .finally(() => {
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
  })
