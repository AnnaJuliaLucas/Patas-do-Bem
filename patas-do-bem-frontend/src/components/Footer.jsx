import { Heart, Instagram, Facebook, MessageCircle, Mail, Phone, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import logoImg from '../assets/patas_do_bem_logo.png'

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo e Missão */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <img 
                src={logoImg} 
                alt="Patas do Bem" 
                className="h-12 w-12 rounded-full"
              />
              <div>
                <h3 className="text-xl font-bold">Patas do Bem</h3>
                <p className="text-gray-400">Santos Dumont/MG</p>
              </div>
            </div>
            <p className="text-gray-300 mb-4">
              Há 10 anos protegendo e cuidando de animais em situação de vulnerabilidade, 
              promovendo adoções responsáveis e conscientização sobre bem-estar animal.
            </p>
            <div className="flex space-x-4">
              <Button variant="outline" size="sm" asChild>
                <a 
                  href="https://instagram.com/patasdobem" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-white border-gray-600 hover:bg-gray-800"
                >
                  <Instagram className="h-4 w-4" />
                </a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a 
                  href="https://facebook.com/patasdobem" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-white border-gray-600 hover:bg-gray-800"
                >
                  <Facebook className="h-4 w-4" />
                </a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a 
                  href="https://wa.me/5532999999999" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-white border-gray-600 hover:bg-gray-800"
                >
                  <MessageCircle className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>

          {/* Links Rápidos */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Links Rápidos</h4>
            <ul className="space-y-2">
              <li>
                <a href="/" className="text-gray-300 hover:text-white transition-colors">
                  Home
                </a>
              </li>
              <li>
                <a href="/apoie" className="text-gray-300 hover:text-white transition-colors">
                  Como Apoiar
                </a>
              </li>
              <li>
                <a href="/rifas" className="text-gray-300 hover:text-white transition-colors">
                  Rifas Ativas
                </a>
              </li>
              <li>
                <a href="/contato" className="text-gray-300 hover:text-white transition-colors">
                  Contato
                </a>
              </li>
            </ul>
          </div>

          {/* Contato */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Contato</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-gray-400" />
                <span className="text-gray-300">contato@patasdobem.org.br</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <span className="text-gray-300">(32) 99999-9999</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span className="text-gray-300">Santos Dumont, MG</span>
              </div>
            </div>
          </div>
        </div>

        {/* Linha divisória */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2025 Associação Patas do Bem. Todos os direitos reservados.
            </p>
            <div className="flex items-center space-x-2 mt-4 md:mt-0">
              <Heart className="h-4 w-4 text-red-500" />
              <span className="text-gray-400 text-sm">
                Feito com amor pelos animais
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

