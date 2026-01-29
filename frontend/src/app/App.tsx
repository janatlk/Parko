import { MantineProvider } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { BrowserRouter, Route, Routes } from 'react-router-dom'

import '@mantine/notifications/styles.css'
import '@mantine/dates/styles.css'

import { ProtectedRoute } from '@app/router/ProtectedRoute'
import { AppLayout } from '@widgets/layout/AppLayout'
import { CarsPage } from '@pages/CarsPage'
import { CarDetailPage } from '@pages/CarDetailPage'
import { DashboardPage } from '@pages/DashboardPage'
import { FuelPage } from '@pages/FuelPage'
import { InspectionsPage } from '@pages/InspectionsPage'
import { InsurancesPage } from '@pages/InsurancesPage'
import { LandingPage } from '@pages/LandingPage'
import { LoginPage } from '@pages/LoginPage'
import { NotFoundPage } from '@pages/NotFoundPage'
import { ProfilePage } from '@pages/ProfilePage'
import { ReportsPage } from '@pages/ReportsPage'
import { UsersPage } from '@pages/UsersPage'

export function App() {
  return (
    <MantineProvider
      defaultColorScheme="light"
      theme={{
        primaryColor: 'blue',
      }}
    >
      <Notifications
        position="top-right"
        autoClose={3000}
        styles={{
          notification: {
            opacity: 0.9,
            pointerEvents: 'auto',
          },
          root: {
            pointerEvents: 'none',
          },
        }}
      />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/cars" element={<CarsPage />} />
            <Route path="/cars/:id" element={<CarDetailPage />} />
            <Route path="/fuel" element={<FuelPage />} />
            <Route path="/insurances" element={<InsurancesPage />} />
            <Route path="/inspections" element={<InspectionsPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </MantineProvider>
  )
}

