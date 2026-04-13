import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginScreen from './screens/LoginScreen.jsx'
import HomeScreen from './screens/HomeScreen.jsx'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/home" element={<HomeScreen />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
