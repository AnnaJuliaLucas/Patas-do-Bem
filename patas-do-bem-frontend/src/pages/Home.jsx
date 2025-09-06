import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Heart, Users, Award, Gift, ArrowRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useApp } from '@/contexts/AppContext'

// Importar imagens
import happyPetsImg from '../assets/happy_pets.jpg'
import rescuedAnimalsImg from '../assets/rescued_dogs_cats.jpeg'
import dogCatCuteImg from '../assets/dog_cat_cute.jpg'
import ongRescueImg from '../assets/ong_rescue.jpeg'
import ongVolunteerImg from '../assets/ong_volunteer.jpg'

export function Home() {
  const { state, actions } = useApp()
  const { config, raffles, donations, ui } = state

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      await Promise.all([
        actions.loadRaffles(),
        actions.loadDonationStats()
      ])
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    }
  }

  const getImpactStats = () => {
    const stats = donations.stats
    return [
      { 
        icon: Heart, 
        label: 'Total Arrecadado', 
        value: stats ? `R$ ${stats.total_amount.toFixed(2)}` : '...'
      },
      { 
        icon: Users, 
        label: 'Doadores únicos', 
        value: stats ? `${stats.total_donors}+` : '...'
      },
      { 
        icon: Award, 
        label: 'Mensal Recorrente', 
        value: stats ? `R$ ${stats.monthly_recurring.toFixed(2)}` : '...'
      },
    ]
  }

  const impactStats = getImpactStats()

  const getActivities = () => {
    if (config?.about?.activities) {
      return config.about.activities.map((activity, index) => ({
        title: activity.title || activity,
        description: activity.description || 'Atividade da ONG Patas do Bem',
        image: [ongRescueImg, rescuedAnimalsImg, happyPetsImg][index] || happyPetsImg
      }))
    }
    
    return [
      {
        title: 'Projeto Castra Cat',
        description: 'Castrações gratuitas para controle populacional responsável',
        image: ongRescueImg
      },
      {
        title: 'Resgates e Cuidados',
        description: 'Resgatamos animais em situação de risco e oferecemos cuidados veterinários',
        image: rescuedAnimalsImg
      },
      {
        title: 'Adoções Responsáveis',
        description: 'Conectamos animais com famílias amorosas através de um processo cuidadoso',
        image: happyPetsImg
      }
    ]
  }

  const activities = getActivities()
  const activeRaffles = raffles.list || []

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section data-testid="hero-section" className="relative bg-gradient-to-r from-orange-600 to-yellow-500 text-white">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-6 w-6 text-yellow-300" />
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                  {config?.organization_name || 'Patas do Bem'}
                </Badge>
              </div>
              <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                Transformando vidas com
                <span className="text-yellow-300"> amor</span>
              </h1>
              <p className="text-xl text-orange-100 leading-relaxed">
                {config?.about?.mission || 'Há uma década protegendo e cuidando de animais em Santos Dumont/MG. Junte-se a nós nessa missão de amor e transformação.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" asChild className="bg-white text-orange-600 hover:bg-gray-100">
                  <Link to="/apoie">
                    <>
                      <Heart className="h-5 w-5 mr-2" />
                      Apoie Nossa Causa
                    </>
                  </Link>
                </Button>
                <Button size="lg" asChild className="bg-white text-orange-600 hover:bg-gray-100">
                  <Link to="/rifas">
                    <>
                      <Gift className="h-5 w-5 mr-2" />
                      Ver Rifas Ativas
                    </>
                  </Link>
                </Button>
              </div>
            </div>
            <div className="relative">
              <img 
                src={dogCatCuteImg} 
                alt="Cães e gatos felizes" 
                className="rounded-2xl shadow-2xl w-full h-96 object-cover"
              />
              <div className="absolute -bottom-4 -right-4 bg-yellow-400 text-gray-900 p-4 rounded-xl shadow-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold">500+</div>
                  <div className="text-sm">Vidas Salvas</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Estatísticas de Impacto */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div data-testid="impact-stats" className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {impactStats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <Card key={index} className="text-center border-orange-200 hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex justify-center mb-4">
                    <div className="bg-orange-100 p-3 rounded-full">
                      <Icon className="h-8 w-8 text-orange-600" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-2">
                    {donations.stats ? stat.value : <Skeleton data-cy="loading-skeleton" className="h-8 w-20 mx-auto" />}
                  </div>
                  <div className="text-gray-600">{stat.label}</div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      {/* Quem Somos */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Quem Somos
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {config?.about?.history?.substring(0, 200) || 'A Associação Patas do Bem nasceu do amor pelos animais e da necessidade de proteger aqueles que não têm voz.'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-900">Nossa História</h3>
            <p className="text-gray-600 leading-relaxed">
              Iniciamos há 10 anos com o <strong>Projeto Castra Cat</strong>, focado em castrações 
              gratuitas para controle populacional. Com o tempo, expandimos nossas atividades 
              para resgates, adoções e campanhas de conscientização.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Hoje somos uma ONG consolidada, trabalhando incansavelmente para garantir 
              que cada animal tenha uma chance de viver com dignidade e amor.
            </p>
            <Button asChild className="bg-orange-600 hover:bg-orange-700">
              <Link to="/contato">
                <>
                  Saiba Mais
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              </Link>
            </Button>
          </div>
          <div className="relative">
            <img 
              src={ongVolunteerImg} 
              alt="Voluntários da ONG" 
              className="rounded-2xl shadow-xl w-full h-80 object-cover"
            />
          </div>
        </div>

        {/* Nossas Atividades */}
        <div data-testid="activities-section" className="space-y-8">
          <h3 className="text-2xl font-bold text-gray-900 text-center">Nossas Atividades</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {activities.map((activity, index) => (
              <Card key={index} data-testid="activity-card" className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="h-48 overflow-hidden">
                  <img 
                    src={activity.image} 
                    alt={activity.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <CardHeader>
                  <CardTitle className="text-lg">{activity.title}</CardTitle>
                  <CardDescription>{activity.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Rifas em Destaque */}
      {(activeRaffles.length > 0 || raffles.loading) && (
        <section data-testid="active-raffles" className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                🎟️ Rifas Ativas
              </h2>
              <p className="text-xl text-orange-100">
                Participe das nossas rifas e ajude os animais!
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {raffles.loading ? (
                Array.from({ length: 2 }).map((_, index) => (
                  <Card key={index} className="bg-white text-gray-900 overflow-hidden">
                    <CardHeader className="pb-4">
                      <div className="flex justify-between items-start">
                        <Skeleton className="h-6 w-40" />
                        <Skeleton className="h-6 w-24" />
                      </div>
                      <Skeleton className="h-4 w-full mt-2" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center">
                        <Skeleton className="h-8 w-20" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                      <Skeleton className="h-10 w-full" />
                    </CardContent>
                  </Card>
                ))
              ) : (
                activeRaffles.slice(0, 2).map((raffle) => (
                <Card key={raffle.id} data-testid="raffle-card" className="bg-white text-gray-900 overflow-hidden hover:shadow-2xl transition-shadow">
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start">
                      <CardTitle data-testid="raffle-title" className="text-xl">{raffle.title}</CardTitle>
                      <Badge data-testid="raffle-available" className="bg-green-100 text-green-800">
                        {raffle.available_numbers} disponíveis
                      </Badge>
                    </div>
                    <CardDescription className="text-gray-600">
                      {raffle.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span data-testid="raffle-price" className="text-2xl font-bold text-orange-600">
                        R$ {raffle.ticket_price.toFixed(2)}
                      </span>
                      <span className="text-sm text-gray-500">
                        por número
                      </span>
                    </div>
                    <Button asChild className="w-full bg-orange-600 hover:bg-orange-700">
                      <Link data-testid="participate-button" to={`/rifas/${raffle.id}`}>
                        <>
                          <Gift className="h-4 w-4 mr-2" />
                          Participar da Rifa
                        </>
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
                ))
              )}
            </div>

            {activeRaffles.length > 2 && (
              <div className="text-center mt-8">
                <Button variant="outline" asChild className="border-white text-white hover:bg-white hover:text-orange-600">
                  <Link to="/rifas">
                    <>
                      Ver Todas as Rifas
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Call to Action Final */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="bg-gradient-to-r from-orange-600 to-yellow-500 text-white border-none">
          <CardContent className="text-center py-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Faça a Diferença Hoje
            </h2>
            <p className="text-xl text-orange-100 mb-8 max-w-2xl mx-auto">
              Sua doação, por menor que seja, pode salvar uma vida. 
              Junte-se a nós nessa missão de amor e proteção animal.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild className="bg-white text-orange-600 hover:bg-gray-100">
                <Link to="/apoie">
                  <>
                    <Heart className="h-5 w-5 mr-2" />
                    Doar Mensalmente
                  </>
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="border-white text-white hover:bg-white hover:text-orange-600">
                <Link to="/rifas">
                  <>
                    <Gift className="h-5 w-5 mr-2" />
                    Participar de Rifas
                  </>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

