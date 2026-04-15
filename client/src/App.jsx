import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginScreen from './screens/LoginScreen.jsx'
import HomeScreen from './screens/HomeScreen.jsx'
import TowerScreen from './screens/TowerScreen.jsx'
import DrawingScreen from './screens/DrawingScreen.jsx'
import SummaryScreen from './screens/SummaryScreen.jsx'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/home" element={<HomeScreen />} />
        <Route path="/tower" element={<TowerScreen />} />
        <Route path="/drawing" element={<DrawingScreen />} />
        <Route path="/summary" element={<SummaryScreen />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
