import { useState, useEffect } from 'react'
import { Heart, Users, TrendingUp, CheckCircle, Star } from 'lucide-react'
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group'
import { PaymentModal } from '../components/PaymentModal'
import { useApp } from '@/contexts/AppContext'

export function Apoie() {
  const { state, actions } = useApp()
  const { config } = state
  
  const [donationType, setDonationType] = useState('recurring')
  const [selectedPlan, setSelectedPlan] = useState('plan_50')
  const [customAmount, setCustomAmount] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  })
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentData, setPaymentData] = useState(null)

  const getPlans = () => {
    if (config?.donation_plans) {
      return config.donation_plans.map(plan => ({
        ...plan,
        popular: plan.amount === 50
      }))
    }
    
    return [
      { id: 'plan_20', amount: 20, name: 'Apoiador', description: 'Ajude com R$ 20 mensais', popular: false },
      { id: 'plan_50', amount: 50, name: 'Protetor', description: 'Ajude com R$ 50 mensais', popular: true },
      { id: 'plan_100', amount: 100, name: 'Guardião', description: 'Ajude com R$ 100 mensais', popular: false }
    ]
  }

  const plans = getPlans()

  const getCurrentAmount = () => {
    if (selectedPlan === 'custom') {
      return parseFloat(customAmount) || 0
    }
    const plan = plans.find(p => p.id === selectedPlan)
    return plan ? plan.amount : 0
  }

  const getCurrentPlanName = () => {
    if (selectedPlan === 'custom') {
      return 'Valor Personalizado'
    }
    const plan = plans.find(p => p.id === selectedPlan)
    return plan ? plan.name : ''
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const amount = getCurrentAmount()
    if (amount <= 0) {
      actions.showError('Por favor, selecione um valor válido')
      return
    }

    if (!formData.name || !formData.email) {
      actions.showError('Por favor, preencha nome e email')
      return
    }

    try {
      // Criar a doação no backend
      const donationData = {
        donor_name: formData.name,
        donor_email: formData.email,
        donor_phone: formData.phone,
        amount: amount,
        donation_type: donationType,
        payment_method: 'pix' // Default to PIX, will be updated in payment modal
      }

      const donation = await actions.createDonation(donationData)

      // Preparar dados do pagamento
      const payment = {
        donation_id: donation.donation_id,
        amount: amount,
        description: donationType === 'recurring' 
          ? `Doação Mensal - ${getCurrentPlanName()} - Patas do Bem`
          : `Doação Única - Patas do Bem`,
        type: 'donation',
        donationType: donationType,
        payer: formData
      }

      setPaymentData(payment)
      setShowPaymentModal(true)
    } catch (error) {
      console.error('Erro ao criar doação:', error)
    }
  }

  const handlePaymentSuccess = (result) => {
    console.log('Pagamento realizado:', result)
    setShowPaymentModal(false)
    
    // Mostrar mensagem de sucesso
    actions.showSuccess('Pagamento processado com sucesso! Obrigado pelo seu apoio!')
    
    // Reset form
    setFormData({ name: '', email: '', phone: '' })
    setCustomAmount('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Apoie Nossa Causa</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Sua contribuição faz toda a diferença na vida dos animais que resgatamos. 
            Escolha a forma que mais se adequa ao seu perfil.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8">
            {/* Tipo de Doação */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Tipo de Doação</h2>
              <RadioGroup value={donationType} onValueChange={setDonationType} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3 p-4 border-2 border-orange-200 rounded-lg hover:border-orange-300 transition-colors">
                  <RadioGroupItem value="recurring" id="recurring" />
                  <label htmlFor="recurring" className="flex-1 cursor-pointer">
                    <div className="font-semibold text-gray-900">Doação Mensal</div>
                    <div className="text-sm text-gray-600">Apoio contínuo e automático</div>
                    <div className="text-xs text-orange-600 font-medium">Recomendado</div>
                  </label>
                </div>
                <div className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-lg hover:border-orange-300 transition-colors">
                  <RadioGroupItem value="one_time" id="one_time" />
                  <label htmlFor="one_time" className="flex-1 cursor-pointer">
                    <div className="font-semibold text-gray-900">Doação Única</div>
                    <div className="text-sm text-gray-600">Contribuição pontual</div>
                  </label>
                </div>
              </RadioGroup>
            </div>

            {/* Planos de Apoio */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Planos de Apoio</h2>
              <p className="text-gray-600 mb-6">Escolha um dos nossos planos ou defina um valor personalizado</p>
              
              <RadioGroup value={selectedPlan} onValueChange={setSelectedPlan} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {plans.map((plan) => (
                  <div key={plan.id} className={`relative p-6 border-2 rounded-lg transition-colors ${plan.popular ? 'border-orange-400 bg-orange-50' : 'border-gray-200 hover:border-orange-300'}`}>
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <span className="bg-orange-600 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                          <Star className="w-3 h-3" />
                          Popular
                        </span>
                      </div>
                    )}
                    <RadioGroupItem value={plan.id} id={plan.id} className="sr-only" />
                    <label htmlFor={plan.id} className="cursor-pointer block">
                      <div className="text-3xl font-bold text-gray-900 mb-2">
                        R$ {plan.amount.toFixed(2).replace('.', ',')}
                      </div>
                      <div className="text-lg font-semibold text-orange-600 mb-2">{plan.name}</div>
                      <div className="text-sm text-gray-600">{plan.description}</div>
                    </label>
                  </div>
                ))}
              </RadioGroup>

              {/* Valor Personalizado */}
              <RadioGroup value={selectedPlan} onValueChange={setSelectedPlan}>
                <div className="p-4 border-2 border-gray-200 rounded-lg">
                  <RadioGroupItem value="custom" id="custom" className="sr-only" />
                  <label htmlFor="custom" className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="plan"
                      value="custom"
                      checked={selectedPlan === 'custom'}
                      onChange={() => setSelectedPlan('custom')}
                      className="w-4 h-4 text-orange-600"
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 mb-2">Valor Personalizado</div>
                      <input
                        type="number"
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="Digite o valor (ex: 25.00)"
                        min="5"
                        step="0.01"
                      />
                    </div>
                  </label>
                </div>
              </RadioGroup>
            </div>

            {/* Seus Dados */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Seus Dados</h2>
              <p className="text-gray-600 mb-6">Preencha seus dados para finalizar a doação</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Seu nome completo"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="seu@email.com"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="(32) 99999-9999"
                  />
                </div>
              </div>
            </div>

            {/* Resumo */}
            <div className="bg-gray-50 p-6 rounded-lg mb-8">
              <h3 className="font-semibold text-gray-900 mb-4">Resumo da Doação</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Tipo:</span>
                  <span className="font-medium">
                    {donationType === 'recurring' ? 'Mensal' : 'Única'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Valor:</span>
                  <span className="font-medium">R$ {getCurrentAmount().toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Plano:</span>
                  <span className="font-medium">{getCurrentPlanName()}</span>
                </div>
              </div>
            </div>

            {/* Botão de Submissão */}
            <button
              type="submit"
              className="w-full bg-orange-600 text-white py-4 px-6 rounded-lg text-lg font-semibold hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"
            >
              <Heart className="w-5 h-5" />
              {donationType === 'recurring' ? 'Continuar para Pagamento' : 'Continuar para Pagamento'}
            </button>
          </form>

          {/* Por que Doar */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Transparência Total</h3>
              <p className="text-gray-600">Relatórios mensais de atividades</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Impacto Direto</h3>
              <p className="text-gray-600">100% dos recursos para os animais</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Facilidade</h3>
              <p className="text-gray-600">Cancele quando quiser</p>
            </div>
          </div>

          {/* Veja o Impacto */}
          <div className="mt-16 bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Veja o Impacto da Sua Doação</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600 mb-2">R$ 20</div>
                <p className="text-gray-600">Alimenta 5 animais por 1 dia</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600 mb-2">R$ 50</div>
                <p className="text-gray-600">Custeia 1 castração completa</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600 mb-2">R$ 100</div>
                <p className="text-gray-600">Cobre tratamento veterinário</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Pagamento */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        paymentData={paymentData}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  )
}

