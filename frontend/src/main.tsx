import '@mantine/core/styles.css'
import '@shared/theme/darkStyles.css'

import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { MantineProvider } from '@mantine/core'
import { ModalsProvider } from '@mantine/modals'
import { Notifications } from '@mantine/notifications'
import { BrowserRouter } from 'react-router-dom'

import '@mantine/notifications/styles.css'
import '@mantine/dates/styles.css'
import '@shared/i18n'

import { App } from '@app/App'
import { AuthProvider } from '@app/providers/AuthProvider'
import { queryClient } from '@shared/api/queryClient'
import { darkTheme } from '@shared/theme/darkTheme'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MantineProvider theme={darkTheme} defaultColorScheme="dark">
          <ModalsProvider>
            <Notifications
              position="top-right"
              autoClose={3000}
              styles={{
                notification: {
                  opacity: 0.8,
                  pointerEvents: 'none',
                },
                root: {
                  pointerEvents: 'none',
                },
              }}
            />
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </ModalsProvider>
        </MantineProvider>
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)
