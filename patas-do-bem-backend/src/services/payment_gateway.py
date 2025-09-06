"""
Payment Gateway Abstraction Layer
Permite facilmente trocar entre diferentes gateways de pagamento (Mock, Mercado Pago, etc.)
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from enum import Enum
import logging

logger = logging.getLogger(__name__)

class PaymentStatus(Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class PaymentMethod(Enum):
    PIX = "pix"
    CREDIT_CARD = "credit_card"
    BOLETO = "boleto"

class PaymentGateway(ABC):
    """Interface abstrata para gateways de pagamento"""
    
    @abstractmethod
    def create_payment(self, payment_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Criar um pagamento
        
        Args:
            payment_data: Dados do pagamento
            
        Returns:
            Dict contendo informações do pagamento criado
        """
        pass
    
    @abstractmethod
    def get_payment_status(self, payment_id: str) -> Dict[str, Any]:
        """
        Consultar status de um pagamento
        
        Args:
            payment_id: ID do pagamento
            
        Returns:
            Dict contendo status e informações do pagamento
        """
        pass
    
    @abstractmethod
    def create_subscription(self, subscription_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Criar uma assinatura recorrente
        
        Args:
            subscription_data: Dados da assinatura
            
        Returns:
            Dict contendo informações da assinatura criada
        """
        pass
    
    @abstractmethod
    def cancel_subscription(self, subscription_id: str) -> Dict[str, Any]:
        """
        Cancelar uma assinatura recorrente
        
        Args:
            subscription_id: ID da assinatura
            
        Returns:
            Dict contendo confirmação do cancelamento
        """
        pass
    
    @abstractmethod
    def generate_pix_qr_code(self, payment_id: str, amount: float) -> Dict[str, Any]:
        """
        Gerar QR Code PIX
        
        Args:
            payment_id: ID do pagamento
            amount: Valor do pagamento
            
        Returns:
            Dict contendo QR code e código PIX
        """
        pass
    
    @abstractmethod
    def generate_boleto(self, payment_id: str, payment_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Gerar boleto bancário
        
        Args:
            payment_id: ID do pagamento
            payment_data: Dados do pagamento e comprador
            
        Returns:
            Dict contendo URL e dados do boleto
        """
        pass
    
    @abstractmethod
    def process_credit_card(self, payment_id: str, card_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Processar pagamento no cartão de crédito
        
        Args:
            payment_id: ID do pagamento
            card_data: Dados do cartão
            
        Returns:
            Dict contendo resultado do processamento
        """
        pass

class PaymentResult:
    """Classe para padronizar retornos dos gateways"""
    
    def __init__(self, success: bool, payment_id: str, status: PaymentStatus, 
                 message: str = "", data: Optional[Dict[str, Any]] = None):
        self.success = success
        self.payment_id = payment_id
        self.status = status
        self.message = message
        self.data = data or {}
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'success': self.success,
            'payment_id': self.payment_id,
            'status': self.status.value,
            'message': self.message,
            'data': self.data
        }

def validate_payment_data(payment_data: Dict[str, Any]) -> bool:
    """
    Valida dados básicos de pagamento
    
    Args:
        payment_data: Dados do pagamento
        
    Returns:
        True se válido, False caso contrário
    """
    required_fields = ['amount', 'payment_method', 'payer_name', 'payer_email']
    
    for field in required_fields:
        if field not in payment_data or not payment_data[field]:
            logger.error(f"Campo obrigatório ausente: {field}")
            return False
    
    # Validar valor
    try:
        amount = float(payment_data['amount'])
        if amount <= 0:
            logger.error("Valor deve ser positivo")
            return False
    except (ValueError, TypeError):
        logger.error("Valor inválido")
        return False
    
    # Validar método de pagamento
    try:
        PaymentMethod(payment_data['payment_method'])
    except ValueError:
        logger.error(f"Método de pagamento inválido: {payment_data['payment_method']}")
        return False
    
    # Validar email básico
    email = payment_data['payer_email']
    if '@' not in email or '.' not in email.split('@')[1]:
        logger.error("Email inválido")
        return False
    
    return True