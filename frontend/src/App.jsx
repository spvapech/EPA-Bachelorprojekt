import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import Welcome from "./pages/Welcome"
import Dashboard from "./pages/Dashboard"

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}
