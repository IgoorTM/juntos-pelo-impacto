import { BrowserRouter, Routes, Route } from 'react-router'

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<p>Juntos pelo Impacto</p>} />
      </Routes>
    </BrowserRouter>
  )
}
