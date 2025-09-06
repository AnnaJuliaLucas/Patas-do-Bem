import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Gift, Calendar, Users, ArrowLeft, CreditCard, Smartphone, FileText, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { useApp } from '@/contexts/AppContext'

export function RifaDetalhes() {
  const { id } = useParams()
  const { state, actions } = useApp()
  const [raffle, setRaffle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedNumbers, setSelectedNumbers] = useState([])
  const [paymentMethod, setPaymentMethod] = useState('pix')
  const [buyerData, setBuyerData] = useState({
    name: '',
    email: '',
    phone: ''
  })
  const [purchasing, setPurchasing] = useState(false)
  const [availableNumbers, setAvailableNumbers] = useState([])
  const [soldNumbers, setSoldNumbers] = useState([])
  const [reservedNumbers, setReservedNumbers] = useState([])

  useEffect(() => {
    fetchRaffleDetails()
  }, [id])

  const fetchRaffleDetails = async () => {
    try {
      setLoading(true)
      
      // Carregar detalhes da rifa
      const raffleData = await actions.loadRaffle(id)
      setRaffle(raffleData.raffle)
      
      // Carregar números disponíveis/vendidos
      const numbersResponse = await fetch(`http://localhost:5000/api/raffles/${id}/numbers`)
      const numbersData = await numbersResponse.json()
      
      setAvailableNumbers(numbersData.available_numbers || [])
      setSoldNumbers(numbersData.sold_numbers || [])
      setReservedNumbers(numbersData.reserved_numbers || [])
      
    } catch (error) {
      console.error('Erro ao carregar detalhes da rifa:', error)
      actions.showError('Erro ao carregar detalhes da rifa')
    } finally {
      setLoading(false)
    }
  }

  const toggleNumber = (number) => {
    setSelectedNumbers(prev => 
      prev.includes(number) 
        ? prev.filter(n => n !== number)
        : [...prev, number]
    )
  }

  const selectRandomNumbers = (count) => {
    if (!availableNumbers.length) return
    
    const shuffled = [...availableNumbers].sort(() => 0.5 - Math.random())
    const selected = shuffled.slice(0, Math.min(count, availableNumbers.length))
    setSelectedNumbers(selected)
  }

  const handlePurchase = async (e) => {
    e.preventDefault()
    setPurchasing(true)

    try {
      if (selectedNumbers.length === 0) {
        actions.showError('Selecione pelo menos um número')
        return
      }

      if (!buyerData.name || !buyerData.email) {
        actions.showError('Preencha nome e email')
        return
      }

      const ticketData = {
        buyer_name: buyerData.name,
        buyer_email: buyerData.email,
        buyer_phone: buyerData.phone,
        selected_numbers: selectedNumbers,
        payment_method: paymentMethod
      }

      // Usar a função do AppContext
      const result = await actions.buyRaffleTickets(id, ticketData)
      
      actions.showSuccess('Números reservados com sucesso! Prossiga para o pagamento.')
      
      // Atualizar dados da rifa
      await fetchRaffleDetails()
      
      // Limpar seleção
      setSelectedNumbers([])
      setBuyerData({ name: '', email: '', phone: '' })

    } catch (error) {
      console.error('Erro ao comprar números:', error)
    } finally {
      setPurchasing(false)
    }
  }

  const paymentMethods = [
    { id: 'pix', name: 'PIX', icon: Smartphone, description: 'Pagamento instantâneo' },
    { id: 'credit_card', name: 'Cartão de Crédito', icon: CreditCard, description: 'Débito automático' },
    { id: 'boleto', name: 'Boleto', icon: FileText, description: 'Vencimento em 3 dias' }
  ]

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-6">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-12 w-full" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Skeleton className="h-64 w-full" />
            </div>
            <div>
              <Skeleton className="h-96 w-full" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!raffle) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Rifa não encontrada</h1>
        <Button asChild>
          <Link to="/rifas">Voltar para Rifas</Link>
        </Button>
      </div>
    )
  }

  const totalAmount = selectedNumbers.length * raffle.ticket_price

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm">
        <Link to="/rifas" className="text-orange-600 hover:text-orange-700 flex items-center">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Rifas
        </Link>
        <span className="text-gray-500">/</span>
        <span className="text-gray-900">{raffle.title}</span>
      </div>

      {/* Cabeçalho da Rifa */}
      <div data-testid="raffle-header" className="bg-gradient-to-r from-orange-600 to-yellow-500 text-white rounded-2xl p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <h1 className="text-3xl md:text-4xl font-bold">{raffle.title}</h1>
            <p className="text-xl text-orange-100">{raffle.description}</p>
            
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">R$ {raffle.ticket_price.toFixed(2)}</div>
                <div className="text-sm text-orange-200">por número</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{availableNumbers.length}</div>
                <div className="text-sm text-orange-200">disponíveis</div>
              </div>
              {raffle.draw_date && (
                <div>
                  <div className="text-lg font-bold">{new Date(raffle.draw_date).toLocaleDateString('pt-BR')}</div>
                  <div className="text-sm text-orange-200">sorteio</div>
                </div>
              )}
            </div>
          </div>
          
          {raffle.image_url && (
            <div className="relative">
              <img 
                src={raffle.image_url} 
                alt={raffle.title}
                className="rounded-xl shadow-2xl w-full h-64 object-cover"
              />
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Seleção de Números */}
        <div className="lg:col-span-2 space-y-6">
          <Card data-testid="number-selection-card">
            <CardHeader>
              <CardTitle>Selecione Seus Números</CardTitle>
              <CardDescription>
                Clique nos números para selecioná-los. Números em cinza já foram vendidos.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Botões de Seleção Rápida */}
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => selectRandomNumbers(1)}
                  disabled={availableNumbers.length === 0}
                >
                  1 Aleatório
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => selectRandomNumbers(3)}
                  disabled={availableNumbers.length < 3}
                >
                  3 Aleatórios
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => selectRandomNumbers(5)}
                  disabled={availableNumbers.length < 5}
                >
                  5 Aleatórios
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedNumbers([])}
                  disabled={selectedNumbers.length === 0}
                >
                  <X className="h-4 w-4 mr-1" />
                  Limpar
                </Button>
              </div>

              {/* Grid de Números */}
              <div data-testid="numbers-grid" className="grid grid-cols-10 gap-2 max-h-96 overflow-y-auto p-2">
                {Array.from({ length: raffle.total_numbers }, (_, i) => i + 1).map((number) => {
                  const isAvailable = availableNumbers.includes(number)
                  const isSold = soldNumbers.includes(number)
                  const isReserved = reservedNumbers.includes(number)
                  const isSelected = selectedNumbers.includes(number)
                  
                  let buttonClass = 'aspect-square rounded-lg text-sm font-medium transition-all '
                  
                  if (isSelected) {
                    buttonClass += 'bg-orange-600 text-white shadow-lg scale-105'
                  } else if (isAvailable) {
                    buttonClass += 'bg-white border-2 border-gray-200 hover:border-orange-300 hover:bg-orange-50'
                  } else if (isSold) {
                    buttonClass += 'bg-red-100 text-red-400 cursor-not-allowed'
                  } else if (isReserved) {
                    buttonClass += 'bg-yellow-100 text-yellow-600 cursor-not-allowed'
                  } else {
                    buttonClass += 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }
                  
                  return (
                    <button
                      key={number}
                      data-testid={`number-${number}`}
                      onClick={() => isAvailable && toggleNumber(number)}
                      disabled={!isAvailable}
                      className={buttonClass}
                      title={
                        isSold ? 'Número já vendido' :
                        isReserved ? 'Número reservado' :
                        isAvailable ? 'Clique para selecionar' :
                        'Número indisponível'
                      }
                    >
                      {number.toString().padStart(2, '0')}
                    </button>
                  )
                })}
              </div>

              {selectedNumbers.length > 0 && (
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Números selecionados:</span>
                    <Badge className="bg-orange-100 text-orange-800">
                      {selectedNumbers.length} número{selectedNumbers.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {selectedNumbers.sort((a, b) => a - b).map((number) => (
                      <span key={number} className="bg-orange-600 text-white px-2 py-1 rounded text-sm">
                        {number.toString().padStart(2, '0')}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Formulário de Compra */}
        <div className="space-y-6 lg:sticky lg:top-24">
          <Card data-testid="purchase-form">
            <CardHeader>
              <CardTitle>Finalizar Compra</CardTitle>
              <CardDescription>
                Preencha seus dados para participar da rifa
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePurchase} className="space-y-4">
                {/* Dados do Comprador */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="buyer-name">Nome Completo *</Label>
                    <Input
                      id="buyer-name"
                      value={buyerData.name}
                      onChange={(e) => setBuyerData({...buyerData, name: e.target.value})}
                      placeholder="Seu nome completo"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="buyer-email">Email *</Label>
                    <Input
                      id="buyer-email"
                      type="email"
                      value={buyerData.email}
                      onChange={(e) => setBuyerData({...buyerData, email: e.target.value})}
                      placeholder="seu@email.com"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="buyer-phone">Telefone</Label>
                    <Input
                      id="buyer-phone"
                      value={buyerData.phone}
                      onChange={(e) => setBuyerData({...buyerData, phone: e.target.value})}
                      placeholder="(32) 99999-9999"
                    />
                  </div>
                </div>

                <Separator />

                {/* Método de Pagamento */}
                <div className="space-y-3">
                  <Label>Método de Pagamento</Label>
                  <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                    {paymentMethods.map((method) => {
                      const Icon = method.icon
                      return (
                        <div key={method.id} className="flex items-center space-x-2">
                          <RadioGroupItem value={method.id} id={method.id} />
                          <Label htmlFor={method.id} className="flex-1">
                            <div className="flex items-center space-x-3">
                              <Icon className="h-4 w-4 text-gray-600" />
                              <div>
                                <div className="font-medium">{method.name}</div>
                                <div className="text-sm text-gray-500">{method.description}</div>
                              </div>
                            </div>
                          </Label>
                        </div>
                      )
                    })}
                  </RadioGroup>
                </div>

                <Separator />

                {/* Resumo */}
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span>Números selecionados:</span>
                    <span className="font-medium">{selectedNumbers.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Valor por número:</span>
                    <span className="font-medium">R$ {raffle.ticket_price.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span className="text-orange-600">R$ {totalAmount.toFixed(2)}</span>
                  </div>
                </div>


                <Button 
                  data-testid="purchase-button"
                  type="submit" 
                  className="w-full bg-orange-600 hover:bg-orange-700"
                  disabled={purchasing || selectedNumbers.length === 0}
                >
                  {purchasing ? 'Processando...' : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Finalizar Compra
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Informações da Rifa */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações da Rifa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2">
                <Gift className="h-4 w-4 text-gray-500" />
                <span className="text-sm">
                  <strong>Preço:</strong> R$ {raffle.ticket_price.toFixed(2)} por número
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-gray-500" />
                <span className="text-sm">
                  <strong>Total:</strong> {raffle.total_numbers} números
                </span>
              </div>
              {raffle.draw_date && (
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">
                    <strong>Sorteio:</strong> {new Date(raffle.draw_date).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              )}
              
              {/* Progresso */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progresso</span>
                  <span>{soldNumbers.length}/{raffle.total_numbers}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-orange-500 to-yellow-500 h-2 rounded-full"
                    style={{ 
                      width: `${(soldNumbers.length / raffle.total_numbers) * 100}%` 
                    }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

