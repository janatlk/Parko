import '@mantine/core/styles.css'
import '@shared/theme/darkStyles.css'

import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'

import '@shared/i18n'

import { App } from '@app/App'
import { AuthProvider } from '@app/providers/AuthProvider'
import { ThemeProvider } from '@app/providers/ThemeProvider'
import { queryClient } from '@shared/api/queryClient'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)
