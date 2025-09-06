import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AppProvider } from './contexts/AppContext'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { Toast } from './components/Toast'
import { LoadingOverlay } from './components/LoadingSpinner'
import { useApp } from './contexts/AppContext'
import { Home } from './pages/Home'
import { Apoie } from './pages/Apoie'
import { Rifas } from './pages/Rifas'
import { RifaDetalhes } from './pages/RifaDetalhes'
import { Contato } from './pages/Contato'
import { Admin } from './pages/Admin'
import './App.css'

function AppContent() {
  const { state } = useApp()
  
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
        <Toast />
        <LoadingOverlay show={state.ui.loading} />
      </div>
    </Router>
  )
}

function App() {
  return (
    <AppProvider>
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
          <Toast />
        </div>
      </Router>
    </AppProvider>
  )
}

export default App

