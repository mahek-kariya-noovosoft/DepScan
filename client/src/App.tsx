import { createBrowserRouter, Navigate } from 'react-router-dom'
import { LandingPage } from './pages/LandingPage'
import { DashboardPage } from './pages/DashboardPage'
import { ReposPage } from './pages/ReposPage'

export const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  { path: '/dashboard', element: <DashboardPage /> },
  { path: '/repos', element: <ReposPage /> },
  { path: '*', element: <Navigate to="/" replace /> },
])
