import { useState, useEffect } from 'react'
import { X, CreditCard, Smartphone, FileText, Loader2 } from 'lucide-react'
import { paymentService } from '../services/paymentService'

export function PaymentModal({ isOpen, onClose, paymentData, onSuccess }) {
  const [step, setStep] = useState('method') // method, form, processing, success, error
  const [paymentMethod, setPaymentMethod] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  
  // Dados do formulário
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    cpf: '',
    // Dados do cartão
    cardNumber: '',
    cardName: '',
    cardExpiry: '',
    cardCvv: '',
    // Dados do endereço (para boleto)
    zipCode: '',
    street: '',
    number: '',
    neighborhood: '',
    city: 'Santos Dumont',
    state: 'MG'
  })

  useEffect(() => {
    if (!isOpen) {
      // Reset ao fechar
      setStep('method')
      setPaymentMethod('')
      setError('')
      setResult(null)
      setFormData({
        name: '',
        email: '',
        phone: '',
        cpf: '',
        cardNumber: '',
        cardName: '',
        cardExpiry: '',
        cardCvv: '',
        zipCode: '',
        street: '',
        number: '',
        neighborhood: '',
        city: 'Santos Dumont',
        state: 'MG'
      })
    }
  }, [isOpen])

  const handleMethodSelect = (method) => {
    setPaymentMethod(method)
    setStep('form')
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const processPayment = async () => {
    setLoading(true)
    setError('')
    setStep('processing')

    try {
      let result

      if (paymentMethod === 'pix') {
        result = await paymentService.createPixPayment({
          amount: paymentData.amount,
          description: paymentData.description,
          payer_email: formData.email,
          type: paymentData.type,
          donor_name: formData.name,
          donor_phone: formData.phone,
          donation_type: paymentData.donationType || 'one_time'
        })
      } else if (paymentMethod === 'credit_card') {
        // Em produção, aqui seria criado o token do cartão via Mercado Pago SDK
        const cardToken = 'CARD_TOKEN_PLACEHOLDER' // Placeholder para demonstração
        
        if (paymentData.donationType === 'recurring') {
          result = await paymentService.createRecurringPayment({
            amount: paymentData.amount,
            description: paymentData.description,
            card_token: cardToken,
            payer_email: formData.email,
            payer_first_name: formData.name.split(' ')[0],
            payer_last_name: formData.name.split(' ').slice(1).join(' '),
            donor_phone: formData.phone
          })
        } else {
          result = await paymentService.createCreditCardPayment({
            amount: paymentData.amount,
            description: paymentData.description,
            card_token: cardToken,
            payer_email: formData.email,
            payer_first_name: formData.name.split(' ')[0],
            payer_last_name: formData.name.split(' ').slice(1).join(' '),
            type: paymentData.type,
            donor_name: formData.name,
            donor_phone: formData.phone,
            donation_type: paymentData.donationType || 'one_time'
          })
        }
      } else if (paymentMethod === 'boleto') {
        result = await paymentService.createBoletoPayment({
          amount: paymentData.amount,
          description: paymentData.description,
          payer_email: formData.email,
          payer_first_name: formData.name.split(' ')[0],
          payer_last_name: formData.name.split(' ').slice(1).join(' '),
          payer_doc_type: 'CPF',
          payer_doc_number: formData.cpf,
          payer_zip_code: formData.zipCode,
          payer_street_name: formData.street,
          payer_street_number: formData.number,
          payer_neighborhood: formData.neighborhood,
          payer_city: formData.city,
          payer_state: formData.state,
          type: paymentData.type,
          donor_phone: formData.phone,
          donation_type: paymentData.donationType || 'one_time'
        })
      }

      if (result.success) {
        setResult(result)
        setStep('success')
        if (onSuccess) onSuccess(result)
      } else {
        setError(result.error)
        setStep('error')
      }
    } catch (err) {
      setError(err.message)
      setStep('error')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">
            {step === 'method' && 'Escolha o Pagamento'}
            {step === 'form' && 'Dados do Pagamento'}
            {step === 'processing' && 'Processando...'}
            {step === 'success' && 'Pagamento Criado!'}
            {step === 'error' && 'Erro no Pagamento'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Resumo do pagamento */}
          <div className="bg-orange-50 p-4 rounded-lg mb-6">
            <h3 className="font-semibold text-orange-900 mb-2">{paymentData.description}</h3>
            <p className="text-2xl font-bold text-orange-600">
              R$ {paymentData.amount?.toFixed(2).replace('.', ',')}
            </p>
            {paymentData.donationType === 'recurring' && (
              <p className="text-sm text-orange-700 mt-1">Cobrança mensal automática</p>
            )}
          </div>

          {/* Seleção de método */}
          {step === 'method' && (
            <div className="space-y-3">
              <button
                onClick={() => handleMethodSelect('pix')}
                className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors flex items-center gap-3"
              >
                <Smartphone className="w-6 h-6 text-green-600" />
                <div className="text-left">
                  <div className="font-semibold">PIX</div>
                  <div className="text-sm text-gray-600">Pagamento instantâneo</div>
                </div>
              </button>

              <button
                onClick={() => handleMethodSelect('credit_card')}
                className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors flex items-center gap-3"
              >
                <CreditCard className="w-6 h-6 text-blue-600" />
                <div className="text-left">
                  <div className="font-semibold">Cartão de Crédito</div>
                  <div className="text-sm text-gray-600">
                    {paymentData.donationType === 'recurring' ? 'Cobrança automática' : 'À vista ou parcelado'}
                  </div>
                </div>
              </button>

              {paymentData.donationType !== 'recurring' && (
                <button
                  onClick={() => handleMethodSelect('boleto')}
                  className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors flex items-center gap-3"
                >
                  <FileText className="w-6 h-6 text-gray-600" />
                  <div className="text-left">
                    <div className="font-semibold">Boleto Bancário</div>
                    <div className="text-sm text-gray-600">Vencimento em 3 dias</div>
                  </div>
                </button>
              )}
            </div>
          )}

          {/* Formulário */}
          {step === 'form' && (
            <div className="space-y-4">
              {/* Dados pessoais */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Seu nome completo"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="seu@email.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="(32) 99999-9999"
                />
              </div>

              {(paymentMethod === 'credit_card' || paymentMethod === 'boleto') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CPF *
                  </label>
                  <input
                    type="text"
                    value={formData.cpf}
                    onChange={(e) => handleInputChange('cpf', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="000.000.000-00"
                    required
                  />
                </div>
              )}

              {/* Dados do cartão */}
              {paymentMethod === 'credit_card' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Número do Cartão *
                    </label>
                    <input
                      type="text"
                      value={formData.cardNumber}
                      onChange={(e) => handleInputChange('cardNumber', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="0000 0000 0000 0000"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome no Cartão *
                    </label>
                    <input
                      type="text"
                      value={formData.cardName}
                      onChange={(e) => handleInputChange('cardName', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="Nome como está no cartão"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Validade *
                      </label>
                      <input
                        type="text"
                        value={formData.cardExpiry}
                        onChange={(e) => handleInputChange('cardExpiry', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="MM/AA"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        CVV *
                      </label>
                      <input
                        type="text"
                        value={formData.cardCvv}
                        onChange={(e) => handleInputChange('cardCvv', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="000"
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Dados do endereço para boleto */}
              {paymentMethod === 'boleto' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CEP *
                    </label>
                    <input
                      type="text"
                      value={formData.zipCode}
                      onChange={(e) => handleInputChange('zipCode', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="00000-000"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Endereço *
                    </label>
                    <input
                      type="text"
                      value={formData.street}
                      onChange={(e) => handleInputChange('street', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="Rua, Avenida..."
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Número *
                      </label>
                      <input
                        type="text"
                        value={formData.number}
                        onChange={(e) => handleInputChange('number', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="123"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bairro *
                      </label>
                      <input
                        type="text"
                        value={formData.neighborhood}
                        onChange={(e) => handleInputChange('neighborhood', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="Centro"
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Botões */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setStep('method')}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Voltar
                </button>
                <button
                  onClick={processPayment}
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {paymentMethod === 'pix' && 'Gerar PIX'}
                  {paymentMethod === 'credit_card' && (paymentData.donationType === 'recurring' ? 'Assinar' : 'Pagar')}
                  {paymentMethod === 'boleto' && 'Gerar Boleto'}
                </button>
              </div>
            </div>
          )}

          {/* Processando */}
          {step === 'processing' && (
            <div className="text-center py-8">
              <Loader2 className="w-12 h-12 animate-spin text-orange-600 mx-auto mb-4" />
              <p className="text-gray-600">Processando seu pagamento...</p>
            </div>
          )}

          {/* Sucesso */}
          {step === 'success' && result && (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>

              {paymentMethod === 'pix' && result.qr_code_base64 && (
                <div className="mb-4">
                  <p className="text-gray-600 mb-3">Escaneie o QR Code para pagar:</p>
                  <img 
                    src={result.qr_code_base64} 
                    alt="QR Code PIX" 
                    className="mx-auto border rounded-lg"
                    style={{ maxWidth: '200px' }}
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Ou copie e cole o código PIX no seu banco
                  </p>
                </div>
              )}

              {paymentMethod === 'credit_card' && (
                <div className="mb-4">
                  <p className="text-green-600 font-semibold">
                    {paymentData.donationType === 'recurring' ? 'Assinatura criada!' : 'Pagamento aprovado!'}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    ID: {result.payment_id || result.subscription_id}
                  </p>
                </div>
              )}

              {paymentMethod === 'boleto' && result.boleto_url && (
                <div className="mb-4">
                  <p className="text-gray-600 mb-3">Boleto gerado com sucesso!</p>
                  <a
                    href={result.boleto_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    Baixar Boleto
                  </a>
                  <p className="text-xs text-gray-500 mt-2">
                    Vencimento: {new Date(result.due_date).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              )}

              <button
                onClick={onClose}
                className="w-full px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                Fechar
              </button>
            </div>
          )}

          {/* Erro */}
          {step === 'error' && (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <X className="w-8 h-8 text-red-600" />
              </div>
              <p className="text-red-600 font-semibold mb-2">Erro no Pagamento</p>
              <p className="text-gray-600 mb-4">{error}</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setStep('method')}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Tentar Novamente
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

