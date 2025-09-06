import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, Heart, Gift, Phone, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useApp } from '@/contexts/AppContext'
import logoImg from '../assets/patas_do_bem_logo.png'

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const location = useLocation()
  const { state } = useApp()

  const navigation = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Apoie', href: '/apoie', icon: Heart },
    { name: 'Rifas', href: '/rifas', icon: Gift },
    { name: 'Contato', href: '/contato', icon: Phone },
  ]

  const isActive = (path) => location.pathname === path

  return (
    <header className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <img 
              src={logoImg} 
              alt="Patas do Bem" 
              className="h-12 w-12 rounded-full"
            />
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-gray-900">
                {state.config?.organization_name || 'Patas do Bem'}
              </h1>
              <p className="text-sm text-gray-600">
                {state.config?.location || 'Santos Dumont/MG'}
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? 'text-orange-600 bg-orange-50'
                      : 'text-gray-700 hover:text-orange-600 hover:bg-orange-50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>

          {/* CTA Button */}
          <div className="hidden md:block">
            <Button asChild className="bg-orange-600 hover:bg-orange-700">
              <Link to="/apoie">
                <>
                  <Heart className="h-4 w-4 mr-2" />
                  Doar Agora
                </>
              </Link>
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-50 rounded-lg mb-4">
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium transition-colors ${
                      isActive(item.href)
                        ? 'text-orange-600 bg-orange-100'
                        : 'text-gray-700 hover:text-orange-600 hover:bg-orange-100'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
              <div className="pt-2">
                <Button asChild className="w-full bg-orange-600 hover:bg-orange-700">
                  <Link to="/apoie" onClick={() => setIsMenuOpen(false)}>
                    <>
                      <Heart className="h-4 w-4 mr-2" />
                      Doar Agora
                    </>
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

