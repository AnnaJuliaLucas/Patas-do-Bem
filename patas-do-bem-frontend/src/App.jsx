import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { Home } from './pages/Home'
import { Apoie } from './pages/Apoie'
import { Rifas } from './pages/Rifas'
import { RifaDetalhes } from './pages/RifaDetalhes'
import { Contato } from './pages/Contato'
import { Admin } from './pages/Admin'
import './App.css'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50">
        <Header />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/apoie" element={<Apoie />} />
            <Route path="/rifas" element={<Rifas />} />
            <Route path="/rifas/:id" element={<RifaDetalhes />} />
            <Route path="/contato" element={<Contato />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  )
}

export default App

