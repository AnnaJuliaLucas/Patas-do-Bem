"""
Payment Gateway Factory
Permite alternar entre diferentes gateways de pagamento facilmente
"""

import os
from .payment_gateway import PaymentGateway
from .mock_payment_gateway import MockPaymentGateway
import logging

logger = logging.getLogger(__name__)

class PaymentGatewayFactory:
    """Factory para criar instâncias de gateways de pagamento"""
    
    _instance = None
    _gateway = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(PaymentGatewayFactory, cls).__new__(cls)
        return cls._instance
    
    def get_gateway(self) -> PaymentGateway:
        """
        Retorna a instância do gateway de pagamento configurado
        
        Returns:
            PaymentGateway: Instância do gateway
        """
        if self._gateway is None:
            self._gateway = self._create_gateway()
        
        return self._gateway
    
    def _create_gateway(self) -> PaymentGateway:
        """
        Cria a instância do gateway baseado na configuração
        
        Returns:
            PaymentGateway: Instância do gateway configurado
        """
        # Verificar variável de ambiente para determinar o gateway
        gateway_type = os.getenv('PAYMENT_GATEWAY', 'mock').lower()
        
        if gateway_type == 'mock' or gateway_type == 'test':
            logger.info("Usando Mock Payment Gateway")
            return MockPaymentGateway()
        
        elif gateway_type == 'mercadopago':
            logger.info("Usando Mercado Pago Gateway")
            return self._create_mercadopago_gateway()
        
        elif gateway_type == 'stripe':
            logger.info("Usando Stripe Gateway")
            return self._create_stripe_gateway()
        
        else:
            logger.warning(f"Gateway desconhecido '{gateway_type}', usando Mock")
            return MockPaymentGateway()
    
    def _create_mercadopago_gateway(self):
        """
        Cria gateway do Mercado Pago
        """
        try:
            # Importar e criar gateway do Mercado Pago
            from .mercadopago_gateway import MercadoPagoGateway
            return MercadoPagoGateway()
        
        except ImportError as e:
            logger.error(f"Gateway Mercado Pago não disponível: {e}, usando Mock")
            return MockPaymentGateway()
        except Exception as e:
            logger.error(f"Erro ao criar gateway Mercado Pago: {e}, usando Mock")
            return MockPaymentGateway()
    
    def _create_stripe_gateway(self):
        """
        Cria gateway do Stripe
        TODO: Implementar quando necessário
        """
        try:
            # Importar e criar gateway do Stripe
            # from .stripe_gateway import StripeGateway
            # return StripeGateway()
            
            # Por enquanto, retornar mock se não implementado
            logger.warning("Gateway Stripe não implementado, usando Mock")
            return MockPaymentGateway()
        
        except ImportError:
            logger.error("Gateway Stripe não disponível, usando Mock")
            return MockPaymentGateway()
    
    def set_gateway(self, gateway: PaymentGateway):
        """
        Define manualmente o gateway (útil para testes)
        
        Args:
            gateway: Instância do gateway
        """
        self._gateway = gateway
        logger.info(f"Gateway definido manualmente: {type(gateway).__name__}")
    
    def reset(self):
        """
        Reseta o factory (útil para testes)
        """
        self._gateway = None

# Instância global do factory
payment_factory = PaymentGatewayFactory()

def get_payment_gateway() -> PaymentGateway:
    """
    Função utilitária para obter o gateway de pagamento
    
    Returns:
        PaymentGateway: Instância do gateway configurado
    """
    return payment_factory.get_gateway()