import { MantineProvider } from '@mantine/core'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { ProtectedRoute } from '@app/router/ProtectedRoute'
import { AppLayout } from '@widgets/layout/AppLayout'
import { CarsPage } from '@pages/CarsPage'
import { CarDetailPage } from '@pages/CarDetailPage'
import { DashboardPage } from '@pages/DashboardPage'
import { FuelPage } from '@pages/FuelPage'
import { InspectionsPage } from '@pages/InspectionsPage'
import { InsurancesPage } from '@pages/InsurancesPage'
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
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
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
