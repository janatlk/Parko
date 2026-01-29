import '@mantine/core/styles.css'

import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'

import '@shared/i18n'

import { App } from '@app/App'
import { AuthProvider } from '@app/providers/AuthProvider'
import { queryClient } from '@shared/api/queryClient'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)
