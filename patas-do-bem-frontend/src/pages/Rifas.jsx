import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Gift, Calendar, Users, ArrowRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

export function Rifas() {
  const [raffles, setRaffles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRaffles()
  }, [])

  const fetchRaffles = async () => {
    try {
      const response = await fetch('/api/raffles')
      const data = await response.json()
      setRaffles(data.raffles || [])
    } catch (error) {
      console.error('Erro ao carregar rifas:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Data a definir'
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const getAvailabilityColor = (available, total) => {
    const percentage = (available / total) * 100
    if (percentage > 50) return 'bg-green-100 text-green-800'
    if (percentage > 20) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <Skeleton className="h-12 w-64 mx-auto mb-4" />
          <Skeleton className="h-6 w-96 mx-auto" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full mb-4" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex justify-center mb-4">
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-3 rounded-full">
            <Gift className="h-8 w-8 text-white" />
          </div>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
          Rifas Solidárias
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Participe das nossas rifas e concorra a prêmios incríveis enquanto ajuda os animais!
        </p>
      </div>

      {/* Rifas Ativas */}
      {raffles.length > 0 ? (
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Rifas Ativas</h2>
            <Badge className="bg-green-100 text-green-800">
              {raffles.length} rifa{raffles.length !== 1 ? 's' : ''} disponível{raffles.length !== 1 ? 'eis' : ''}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {raffles.map((raffle) => (
              <Card key={raffle.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 group">
                {/* Imagem da Rifa */}
                <div className="h-48 bg-gradient-to-br from-orange-200 to-yellow-200 relative overflow-hidden">
                  {raffle.image_url ? (
                    <img 
                      src={raffle.image_url} 
                      alt={raffle.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Gift className="h-16 w-16 text-orange-400" />
                    </div>
                  )}
                  <div className="absolute top-4 right-4">
                    <Badge className={getAvailabilityColor(raffle.available_numbers, raffle.total_numbers)}>
                      {raffle.available_numbers} disponíveis
                    </Badge>
                  </div>
                </div>

                <CardHeader>
                  <CardTitle className="text-lg line-clamp-2">{raffle.title}</CardTitle>
                  <CardDescription className="line-clamp-3">
                    {raffle.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Informações da Rifa */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Gift className="h-4 w-4 text-gray-500" />
                      <span>R$ {raffle.ticket_price.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span>{raffle.total_numbers} números</span>
                    </div>
                    {raffle.draw_date && (
                      <div className="col-span-2 flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span>Sorteio: {formatDate(raffle.draw_date)}</span>
                      </div>
                    )}
                  </div>

                  {/* Barra de Progresso */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progresso</span>
                      <span>{raffle.sold_numbers}/{raffle.total_numbers}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-orange-500 to-yellow-500 h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${(raffle.sold_numbers / raffle.total_numbers) * 100}%` 
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Botão de Ação */}
                  <Button asChild className="w-full bg-orange-600 hover:bg-orange-700 group">
                    <Link to={`/rifas/${raffle.id}`}>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Participar da Rifa
                      <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="bg-gray-100 rounded-full p-6 w-24 h-24 mx-auto mb-6">
            <Gift className="h-12 w-12 text-gray-400 mx-auto" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Nenhuma rifa ativa no momento
          </h3>
          <p className="text-gray-600 mb-6">
            Fique atento às nossas redes sociais para saber quando novas rifas estiverem disponíveis!
          </p>
          <Button asChild variant="outline">
            <Link to="/contato">
              Entre em Contato
            </Link>
          </Button>
        </div>
      )}

      {/* Como Funciona */}
      <section className="bg-white rounded-2xl p-8 shadow-lg">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
          Como Funciona
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { step: '1', title: 'Escolha a Rifa', description: 'Navegue pelas rifas ativas e escolha a que mais te interessa' },
            { step: '2', title: 'Selecione Números', description: 'Escolha seus números da sorte entre os disponíveis' },
            { step: '3', title: 'Faça o Pagamento', description: 'Pague via PIX, cartão ou boleto de forma segura' },
            { step: '4', title: 'Aguarde o Sorteio', description: 'Receba confirmação e aguarde a data do sorteio' }
          ].map((item, index) => (
            <div key={index} className="text-center">
              <div className="bg-orange-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                {item.step}
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
              <p className="text-sm text-gray-600">{item.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

