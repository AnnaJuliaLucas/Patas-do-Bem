import { useState, useEffect } from 'react'
import { useApp } from '@/contexts/AppContext'
import { 
  DollarSign, 
  Gift, 
  Users, 
  Mail, 
  Plus, 
  Eye, 
  Edit, 
  Trash2,
  Calendar,
  TrendingUp,
  AlertCircle,
  Upload
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { DashboardCharts } from '@/components/DashboardCharts'
import { ImageUpload } from '@/components/ImageUpload'
import { ValidatedInput, useFormValidation } from '@/components/FormValidation'

export function Admin() {
  const { state, actions } = useApp()
  const [raffles, setRaffles] = useState([])
  const [activeTab, setActiveTab] = useState('dashboard')

  // Form validation for raffle creation
  const {
    values: newRaffle,
    validations,
    isFormValid,
    setValue: setRaffleValue,
    setValidation,
    reset: resetForm
  } = useFormValidation({
    title: '',
    description: '',
    ticket_price: '',
    total_numbers: '',
    draw_date: '',
    image_url: '',
    thumbnail_url: ''
  })
  
  const [creatingRaffle, setCreatingRaffle] = useState(false)
  const [raffleMessage, setRaffleMessage] = useState('')

  useEffect(() => {
    actions.loadDashboardData()
    fetchRaffles()
    actions.loadDonations()
    actions.loadContactMessages()
  }, [])

  const fetchDashboardData = async () => {
    await actions.loadDashboardData()
  }

  const fetchRaffles = async () => {
    try {
      const response = await fetch('/api/raffles')
      const data = await response.json()
      setRaffles(data.raffles || [])
    } catch (error) {
      console.error('Erro ao carregar rifas:', error)
    }
  }

  const fetchDonations = async () => {
    try {
      const response = await fetch('/api/donations')
      const data = await response.json()
      setDonations(data.donations || [])
    } catch (error) {
      console.error('Erro ao carregar doações:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async () => {
    try {
      const response = await fetch('/api/contact/messages')
      const data = await response.json()
      setMessages(data.messages || [])
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error)
    }
  }

  const handleImageUploaded = (imageUrl, thumbnailUrl) => {
    setRaffleValue('image_url', imageUrl)
    setRaffleValue('thumbnail_url', thumbnailUrl)
  }

  const handleCreateRaffle = async (e) => {
    e.preventDefault()
    
    if (!isFormValid) {
      setRaffleMessage('Por favor, corrija os erros no formulário')
      return
    }
    
    setCreatingRaffle(true)
    setRaffleMessage('')

    try {
      const raffleData = {
        ...newRaffle,
        ticket_price: parseFloat(newRaffle.ticket_price),
        total_numbers: parseInt(newRaffle.total_numbers)
      }

      const response = await fetch('/api/raffles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(raffleData)
      })

      const result = await response.json()

      if (response.ok) {
        setRaffleMessage('Rifa criada com sucesso!')
        resetForm()
        fetchRaffles()
      } else {
        setRaffleMessage(result.error || 'Erro ao criar rifa')
      }
    } catch (error) {
      setRaffleMessage('Erro ao conectar com o servidor')
    } finally {
      setCreatingRaffle(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <div className="text-xl">Carregando painel administrativo...</div>
        </div>
      </div>
    )
  }

  const statsCards = [
    {
      title: 'Total Arrecadado',
      value: `R$ ${dashboardData?.donations_summary?.total_amount?.toFixed(2) || '0,00'}`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Doações Mensais',
      value: `R$ ${dashboardData?.donations_summary?.monthly_recurring?.toFixed(2) || '0,00'}`,
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Total de Doadores',
      value: dashboardData?.donations_summary?.total_donors || 0,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      title: 'Rifas Ativas',
      value: dashboardData?.raffles_summary?.active_raffles || 0,
      icon: Gift,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    }
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Painel Administrativo</h1>
          <p className="text-gray-600">Gerencie doações, rifas e mensagens</p>
        </div>
        <Badge className="bg-orange-100 text-orange-800">
          Admin
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="raffles">Rifas</TabsTrigger>
          <TabsTrigger value="donations">Doações</TabsTrigger>
          <TabsTrigger value="messages">Mensagens</TabsTrigger>
        </TabsList>

        {/* Dashboard */}
        <TabsContent value="dashboard" className="space-y-6">
          {/* Cards de Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statsCards.map((stat, index) => {
              const Icon = stat.icon
              return (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                        <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                      </div>
                      <div className={`${stat.bgColor} p-3 rounded-full`}>
                        <Icon className={`h-6 w-6 ${stat.color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Dashboard Charts */}
          <DashboardCharts dashboardData={state.dashboardData} />

          {/* Ações Pendentes */}
          {state.dashboardData?.pending_actions?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  <span>Ações Pendentes</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {state.dashboardData.pending_actions.map((action, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                      <span className="text-gray-900">{action.description}</span>
                      <Badge className="bg-yellow-100 text-yellow-800">
                        {action.count}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Atividade Recente */}
          <Card>
            <CardHeader>
              <CardTitle>Atividade Recente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {state.dashboardData?.recent_activity?.slice(0, 5).map((activity, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
                    <div className={`p-2 rounded-full ${
                      activity.type === 'donation' ? 'bg-green-100' : 'bg-blue-100'
                    }`}>
                      {activity.type === 'donation' ? (
                        <DollarSign className="h-4 w-4 text-green-600" />
                      ) : (
                        <Mail className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-gray-900">{activity.description}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(activity.date).toLocaleString('pt-BR')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gerenciamento de Rifas */}
        <TabsContent value="raffles" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Gerenciar Rifas</h2>
          </div>

          {/* Formulário para Nova Rifa */}
          <Card>
            <CardHeader>
              <CardTitle>Criar Nova Rifa</CardTitle>
              <CardDescription>
                Preencha os dados para criar uma nova rifa
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateRaffle} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ValidatedInput
                    id="raffle-title"
                    label="Título da Rifa"
                    value={newRaffle.title}
                    onChange={(e) => setRaffleValue('title', e.target.value)}
                    onValidation={(isValid, errors) => setValidation('title', isValid, errors)}
                    placeholder="Nome da rifa"
                    validation={['required']}
                    required
                  />

                  <ValidatedInput
                    id="raffle-price"
                    label="Preço por Número"
                    value={newRaffle.ticket_price}
                    onChange={(e) => setRaffleValue('ticket_price', e.target.value)}
                    onValidation={(isValid, errors) => setValidation('ticket_price', isValid, errors)}
                    placeholder="10.00"
                    mask="currency"
                    validation={['required', 'currency']}
                    required
                  />

                  <ValidatedInput
                    id="raffle-numbers"
                    label="Total de Números"
                    type="number"
                    value={newRaffle.total_numbers}
                    onChange={(e) => setRaffleValue('total_numbers', e.target.value)}
                    onValidation={(isValid, errors) => setValidation('total_numbers', isValid, errors)}
                    placeholder="100"
                    min="1"
                    validation={['required']}
                    required
                  />

                  <ValidatedInput
                    id="raffle-date"
                    label="Data do Sorteio"
                    type="date"
                    value={newRaffle.draw_date}
                    onChange={(e) => setRaffleValue('draw_date', e.target.value)}
                    onValidation={(isValid, errors) => setValidation('draw_date', isValid, errors)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="raffle-description">Descrição</Label>
                  <Textarea
                    id="raffle-description"
                    value={newRaffle.description}
                    onChange={(e) => setRaffleValue('description', e.target.value)}
                    placeholder="Descreva o prêmio e detalhes da rifa"
                    rows={3}
                  />
                </div>

                {/* Image Upload */}
                <div className="space-y-2">
                  <Label>Imagem da Rifa</Label>
                  <ImageUpload
                    onImageUploaded={handleImageUploaded}
                    currentImage={newRaffle.image_url}
                  />
                </div>

                {raffleMessage && (
                  <Alert className={raffleMessage.includes('sucesso') ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                    <AlertDescription className={raffleMessage.includes('sucesso') ? 'text-green-800' : 'text-red-800'}>
                      {raffleMessage}
                    </AlertDescription>
                  </Alert>
                )}

                <Button 
                  type="submit" 
                  className="bg-orange-600 hover:bg-orange-700"
                  disabled={creatingRaffle || !isFormValid}
                >
                  {creatingRaffle ? 'Criando...' : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Rifa
                    </>
                  )}
                </Button>
                
                {!isFormValid && Object.keys(validations).length > 0 && (
                  <Alert className="border-yellow-200 bg-yellow-50">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-800">
                      Por favor, corrija os erros no formulário antes de continuar
                    </AlertDescription>
                  </Alert>
                )}
              </form>
            </CardContent>
          </Card>

          {/* Lista de Rifas */}
          <Card>
            <CardHeader>
              <CardTitle>Rifas Existentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {raffles.map((raffle) => (
                  <div key={raffle.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{raffle.title}</h3>
                      <div className="text-sm text-gray-600 space-x-4">
                        <span>R$ {raffle.ticket_price.toFixed(2)}</span>
                        <span>{raffle.sold_numbers}/{raffle.total_numbers} vendidos</span>
                        {raffle.draw_date && (
                          <span>Sorteio: {new Date(raffle.draw_date).toLocaleDateString('pt-BR')}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={
                        raffle.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }>
                        {raffle.status === 'active' ? 'Ativa' : 'Inativa'}
                      </Badge>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Doações */}
        <TabsContent value="donations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Doações Recentes</CardTitle>
              <CardDescription>
                Últimas doações recebidas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {state.donations?.slice(0, 10).map((donation) => (
                  <div key={donation.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{donation.donor_name}</h3>
                      <div className="text-sm text-gray-600">
                        {donation.donor_email} • {donation.payment_method}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(donation.created_at).toLocaleString('pt-BR')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">
                        R$ {donation.amount.toFixed(2)}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={
                          donation.payment_status === 'completed' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }>
                          {donation.payment_status === 'completed' ? 'Pago' : 'Pendente'}
                        </Badge>
                        <Badge variant="outline">
                          {donation.donation_type === 'recurring' ? 'Mensal' : 'Única'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Mensagens */}
        <TabsContent value="messages" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Mensagens de Contato</CardTitle>
              <CardDescription>
                Mensagens recebidas através do formulário de contato
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {state.contactMessages?.map((message) => (
                  <div key={message.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">{message.name}</h3>
                        <div className="text-sm text-gray-600">{message.email}</div>
                        {message.phone && (
                          <div className="text-sm text-gray-600">{message.phone}</div>
                        )}
                      </div>
                      <div className="text-right">
                        <Badge className={
                          message.status === 'new' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-gray-100 text-gray-800'
                        }>
                          {message.status === 'new' ? 'Nova' : 'Lida'}
                        </Badge>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(message.created_at).toLocaleString('pt-BR')}
                        </div>
                      </div>
                    </div>
                    {message.subject && (
                      <div className="font-medium text-gray-900 mb-2">
                        Assunto: {message.subject}
                      </div>
                    )}
                    <div className="text-gray-700 bg-gray-50 p-3 rounded">
                      {message.message}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

