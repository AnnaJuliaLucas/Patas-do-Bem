// Serviço de integração com pagamentos
class PaymentService {
  constructor() {
    this.baseURL = '/api';
  }

  // Configurações do Mercado Pago
  async getPaymentConfig() {
    try {
      const response = await fetch(`${this.baseURL}/payments/config`);
      return await response.json();
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
      return null;
    }
  }

  // Criar pagamento PIX
  async createPixPayment(paymentData) {
    try {
      const response = await fetch(`${this.baseURL}/payments/pix`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData)
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Erro ao criar pagamento PIX');
      }

      return result;
    } catch (error) {
      console.error('Erro no pagamento PIX:', error);
      throw error;
    }
  }

  // Criar pagamento com cartão
  async createCreditCardPayment(paymentData) {
    try {
      const response = await fetch(`${this.baseURL}/payments/credit-card`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData)
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Erro ao processar cartão');
      }

      return result;
    } catch (error) {
      console.error('Erro no pagamento com cartão:', error);
      throw error;
    }
  }

  // Criar assinatura recorrente
  async createRecurringPayment(subscriptionData) {
    try {
      const response = await fetch(`${this.baseURL}/payments/recurring`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscriptionData)
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Erro ao criar assinatura');
      }

      return result;
    } catch (error) {
      console.error('Erro na assinatura:', error);
      throw error;
    }
  }

  // Criar pagamento via boleto
  async createBoletoPayment(paymentData) {
    try {
      const response = await fetch(`${this.baseURL}/payments/boleto`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData)
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Erro ao gerar boleto');
      }

      return result;
    } catch (error) {
      console.error('Erro no boleto:', error);
      throw error;
    }
  }

  // Consultar status do pagamento
  async getPaymentStatus(paymentId) {
    try {
      const response = await fetch(`${this.baseURL}/payments/${paymentId}/status`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Erro ao consultar status');
      }

      return result;
    } catch (error) {
      console.error('Erro ao consultar status:', error);
      throw error;
    }
  }

  // Inicializar Mercado Pago no frontend
  async initializeMercadoPago() {
    try {
      const config = await this.getPaymentConfig();
      
      if (config && config.mercado_pago && window.MercadoPago) {
        const mp = new window.MercadoPago(config.mercado_pago.public_key, {
          locale: 'pt-BR'
        });
        
        return mp;
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao inicializar Mercado Pago:', error);
      return null;
    }
  }

  // Criar token do cartão
  async createCardToken(mp, cardData) {
    try {
      const cardToken = await mp.createCardToken({
        cardNumber: cardData.number,
        cardholderName: cardData.holderName,
        cardExpirationMonth: cardData.expirationMonth,
        cardExpirationYear: cardData.expirationYear,
        securityCode: cardData.securityCode,
        identificationType: cardData.identificationType,
        identificationNumber: cardData.identificationNumber
      });

      return cardToken;
    } catch (error) {
      console.error('Erro ao criar token do cartão:', error);
      throw error;
    }
  }

  // Validar dados do cartão
  validateCardData(cardData) {
    const errors = [];

    if (!cardData.number || cardData.number.length < 13) {
      errors.push('Número do cartão inválido');
    }

    if (!cardData.holderName || cardData.holderName.length < 3) {
      errors.push('Nome do portador é obrigatório');
    }

    if (!cardData.expirationMonth || cardData.expirationMonth < 1 || cardData.expirationMonth > 12) {
      errors.push('Mês de vencimento inválido');
    }

    if (!cardData.expirationYear || cardData.expirationYear < new Date().getFullYear()) {
      errors.push('Ano de vencimento inválido');
    }

    if (!cardData.securityCode || cardData.securityCode.length < 3) {
      errors.push('Código de segurança inválido');
    }

    if (!cardData.identificationNumber) {
      errors.push('CPF é obrigatório');
    }

    return errors;
  }

  // Formatar valor monetário
  formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  // Gerar referência única
  generateReference() {
    return `PATAS_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const paymentService = new PaymentService();

