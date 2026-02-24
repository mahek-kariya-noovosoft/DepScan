import { Routes, Route, Navigate } from 'react-router-dom'

function Placeholder({ label }: { label: string }) {
  return <div className="p-8 text-gray-400">{label} — coming soon</div>
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Placeholder label="Landing Page" />} />
      <Route path="/dashboard" element={<Placeholder label="Dashboard" />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
