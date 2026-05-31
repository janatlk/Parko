import { Routes, Route } from 'react-router-dom'

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
import { SparesPage } from '@pages/SparesPage'
import { UsersPage } from '@pages/UsersPage'
import { AIPage } from '@pages/AIPage'
import { CustomTablesPage } from '@pages/CustomTablesPage'
import { CustomTableDetailPage } from '@pages/CustomTableDetailPage'
import { CustomTableBuilderPage } from '@pages/CustomTableBuilderPage'

export function App() {
  return (
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
        <Route path="/spares" element={<SparesPage />} />
        <Route path="/insurances" element={<InsurancesPage />} />
        <Route path="/inspections" element={<InspectionsPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/ai" element={<AIPage />} />
        <Route path="/custom-tables" element={<CustomTablesPage />} />
        <Route path="/custom-tables/new" element={<CustomTableBuilderPage />} />
        <Route path="/custom-tables/:id/edit" element={<CustomTableBuilderPage />} />
        <Route path="/custom-tables/:id" element={<CustomTableDetailPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
