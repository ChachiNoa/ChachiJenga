import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import LoginScreen from './screens/LoginScreen.jsx'
import HomeScreen from './screens/HomeScreen.jsx'
import TowerScreen from './screens/TowerScreen.jsx'
import DrawingScreen from './screens/DrawingScreen.jsx'
import WatchScreen from './screens/WatchScreen.jsx'
import SummaryScreen from './screens/SummaryScreen.jsx'

import DisconnectDialog from './components/DisconnectDialog.jsx'
import { saveGameRoute, getActiveGameRoute } from './hooks/useGameSession.js'
import { loadAuth } from './network/authApi.js'

/**
 * ChachiJenga App - v1.0.4
 */
/**
 * Tracks the current route and saves game routes to sessionStorage.
 * On mount, if there's a saved game route and we're on /login or /home,
 * redirect back to the game.
 */
function RouteTracker() {
  const location = useLocation()
  const navigate = useNavigate()

  // Save game route on every navigation
  useEffect(() => {
    saveGameRoute(location.pathname)
  }, [location.pathname])

  // On first mount, check if we need to restore a game session
  useEffect(() => {
    const auth = loadAuth()
    if (!auth?.token) return // Not logged in, don't restore

    const savedRoute = getActiveGameRoute()
    if (savedRoute && (location.pathname === '/login' || location.pathname === '/home' || location.pathname === '/')) {
      // User had an active game, redirect them back
      navigate(savedRoute, { replace: true })
    }
  }, []) // Only on mount

  return null
}

function App() {
  return (
    <BrowserRouter>
      <RouteTracker />
      <Routes>
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/home" element={<HomeScreen />} />
        <Route path="/tower" element={<TowerScreen />} />
        <Route path="/drawing" element={<DrawingScreen />} />
        <Route path="/watch" element={<WatchScreen />} />
        <Route path="/summary" element={<SummaryScreen />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      <DisconnectDialog />
    </BrowserRouter>
  )
}

export default App
