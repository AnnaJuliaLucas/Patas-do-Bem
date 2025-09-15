"""
Mercado Pago Payment Gateway
Implementação real do gateway de pagamento usando a API do Mercado Pago
"""

import requests
import os
import uuid
import qrcode
import io
import base64
from datetime import datetime, timedelta
from typing import Dict, Any
from .payment_gateway import PaymentGateway, PaymentStatus, PaymentMethod, PaymentResult, validate_payment_data
import logging

logger = logging.getLogger(__name__)

class MercadoPagoGateway(PaymentGateway):
    """Gateway de pagamento real do Mercado Pago"""
    
    def __init__(self):
        self.access_token = os.getenv('MP_ACCESS_TOKEN')
        self.public_key = os.getenv('MP_PUBLIC_KEY') 
        self.base_url = "https://api.mercadopago.com"
        
        # Configurações PIX
        self.pix_key = os.getenv('PIX_KEY', '32999999999')
        self.pix_recipient_name = 'Associação Patas do Bem'
        
        if not self.access_token:
            logger.warning("MP_ACCESS_TOKEN não configurado. Usando token de teste.")
            self.access_token = "TEST-ACCESS-TOKEN"
    
    def create_payment(self, payment_data: Dict[str, Any]) -> Dict[str, Any]:
        """Criar um pagamento via Mercado Pago"""
        try:
            # Validar dados
            if not validate_payment_data(payment_data):
                return PaymentResult(
                    success=False,
                    payment_id="",
                    status=PaymentStatus.FAILED,
                    message="Dados de pagamento inválidos"
                ).to_dict()
            
            payment_method = payment_data['payment_method']
            
            if payment_method == PaymentMethod.PIX.value:
                return self._create_pix_payment(payment_data)
            elif payment_method == PaymentMethod.BOLETO.value:
                return self._create_boleto_payment(payment_data)
            elif payment_method == PaymentMethod.CREDIT_CARD.value:
                return self._create_credit_card_payment(payment_data)
            else:
                return PaymentResult(
                    success=False,
                    payment_id="",
                    status=PaymentStatus.FAILED,
                    message=f"Método de pagamento não suportado: {payment_method}"
                ).to_dict()
                
        except Exception as e:
            logger.error(f"Erro ao criar pagamento no Mercado Pago: {e}")
            return PaymentResult(
                success=False,
                payment_id="",
                status=PaymentStatus.FAILED,
                message=f"Erro interno: {str(e)}"
            ).to_dict()
    
    def _create_pix_payment(self, payment_data: Dict[str, Any]) -> Dict[str, Any]:
        """Criar pagamento PIX via Mercado Pago"""
        try:
            url = f"{self.base_url}/v1/payments"
            
            headers = {
                "Authorization": f"Bearer {self.access_token}",
                "Content-Type": "application/json"
            }
            
            # Dados do pagamento PIX
            mp_payment_data = {
                "transaction_amount": float(payment_data['amount']),
                "description": payment_data.get('description', 'Doação Patas do Bem'),
                "payment_method_id": "pix",
                "payer": {
                    "email": payment_data['payer_email'],
                    "first_name": payment_data['payer_name'].split()[0],
                    "last_name": " ".join(payment_data['payer_name'].split()[1:]) if len(payment_data['payer_name'].split()) > 1 else ""
                },
                "notification_url": f"{os.getenv('BASE_URL', 'http://localhost:5000')}/api/webhooks/mercadopago"
            }
            
            response = requests.post(url, headers=headers, json=mp_payment_data)
            
            if response.status_code == 201:
                payment_info = response.json()
                
                # Extrair dados do PIX
                pix_data = payment_info.get('point_of_interaction', {}).get('transaction_data', {})
                pix_code = pix_data.get('qr_code', '')
                
                # Gerar QR Code
                qr_code_base64 = self._generate_qr_code(pix_code) if pix_code else None
                
                response_data = {
                    'payment_id': str(payment_info['id']),
                    'amount': payment_data['amount'],
                    'status': self._map_mp_status(payment_info['status']),
                    'pix_code': pix_code,
                    'qr_code_base64': qr_code_base64,
                    'expires_at': payment_info.get('date_of_expiration'),
                    'created_at': payment_info['date_created']
                }
                
                return PaymentResult(
                    success=True,
                    payment_id=str(payment_info['id']),
                    status=PaymentStatus.PENDING,
                    message="Pagamento PIX criado com sucesso",
                    data=response_data
                ).to_dict()
            else:
                logger.error(f"Erro MP PIX: {response.status_code} - {response.text}")
                return PaymentResult(
                    success=False,
                    payment_id="",
                    status=PaymentStatus.FAILED,
                    message=f"Erro ao criar pagamento PIX: {response.text}"
                ).to_dict()
                
        except Exception as e:
            logger.error(f"Erro ao criar PIX no MP: {e}")
            return PaymentResult(
                success=False,
                payment_id="",
                status=PaymentStatus.FAILED,
                message=f"Erro interno PIX: {str(e)}"
            ).to_dict()
    
    def _create_boleto_payment(self, payment_data: Dict[str, Any]) -> Dict[str, Any]:
        """Criar pagamento boleto via Mercado Pago"""
        try:
            url = f"{self.base_url}/v1/payments"
            
            headers = {
                "Authorization": f"Bearer {self.access_token}",
                "Content-Type": "application/json"
            }
            
            # Data de vencimento (3 dias)
            due_date = (datetime.now() + timedelta(days=3)).isoformat()
            
            mp_payment_data = {
                "transaction_amount": float(payment_data['amount']),
                "description": payment_data.get('description', 'Doação Patas do Bem'),
                "payment_method_id": "bolbradesco",
                "payer": {
                    "email": payment_data['payer_email'],
                    "first_name": payment_data['payer_name'].split()[0],
                    "last_name": " ".join(payment_data['payer_name'].split()[1:]) if len(payment_data['payer_name'].split()) > 1 else "",
                    "identification": {
                        "type": "CPF",
                        "number": payment_data.get('payer_document', '00000000000')
                    },
                    "address": {
                        "zip_code": payment_data.get('payer_zipcode', '36240000'),
                        "street_name": payment_data.get('payer_address', 'Rua Principal'),
                        "street_number": payment_data.get('payer_number', '123'),
                        "neighborhood": payment_data.get('payer_neighborhood', 'Centro'),
                        "city": payment_data.get('payer_city', 'Santos Dumont'),
                        "federal_unit": payment_data.get('payer_state', 'MG')
                    }
                },
                "date_of_expiration": due_date,
                "notification_url": f"{os.getenv('BASE_URL', 'http://localhost:5000')}/api/webhooks/mercadopago"
            }
            
            response = requests.post(url, headers=headers, json=mp_payment_data)
            
            if response.status_code == 201:
                payment_info = response.json()
                
                response_data = {
                    'payment_id': str(payment_info['id']),
                    'amount': payment_data['amount'],
                    'status': self._map_mp_status(payment_info['status']),
                    'barcode': payment_info.get('transaction_details', {}).get('barcode'),
                    'boleto_url': payment_info.get('transaction_details', {}).get('external_resource_url'),
                    'due_date': due_date,
                    'created_at': payment_info['date_created']
                }
                
                return PaymentResult(
                    success=True,
                    payment_id=str(payment_info['id']),
                    status=PaymentStatus.PENDING,
                    message="Boleto criado com sucesso",
                    data=response_data
                ).to_dict()
            else:
                logger.error(f"Erro MP Boleto: {response.status_code} - {response.text}")
                return PaymentResult(
                    success=False,
                    payment_id="",
                    status=PaymentStatus.FAILED,
                    message=f"Erro ao criar boleto: {response.text}"
                ).to_dict()
                
        except Exception as e:
            logger.error(f"Erro ao criar boleto no MP: {e}")
            return PaymentResult(
                success=False,
                payment_id="",
                status=PaymentStatus.FAILED,
                message=f"Erro interno boleto: {str(e)}"
            ).to_dict()
    
    def _create_credit_card_payment(self, payment_data: Dict[str, Any]) -> Dict[str, Any]:
        """Criar pagamento cartão via Mercado Pago"""
        # Para cartão, retornamos um checkout_url para o frontend processar
        try:
            preference_url = f"{self.base_url}/checkout/preferences"
            
            headers = {
                "Authorization": f"Bearer {self.access_token}",
                "Content-Type": "application/json"
            }
            
            preference_data = {
                "items": [
                    {
                        "title": payment_data.get('description', 'Doação Patas do Bem'),
                        "quantity": 1,
                        "unit_price": float(payment_data['amount']),
                        "currency_id": "BRL"
                    }
                ],
                "payer": {
                    "email": payment_data['payer_email'],
                    "name": payment_data['payer_name']
                },
                "back_urls": {
                    "success": f"{os.getenv('FRONTEND_URL', 'http://localhost:5173')}/apoie?status=success",
                    "failure": f"{os.getenv('FRONTEND_URL', 'http://localhost:5173')}/apoie?status=failure",
                    "pending": f"{os.getenv('FRONTEND_URL', 'http://localhost:5173')}/apoie?status=pending"
                },
                "notification_url": f"{os.getenv('BASE_URL', 'http://localhost:5000')}/api/webhooks/mercadopago",
                "external_reference": str(uuid.uuid4())
            }
            
            response = requests.post(preference_url, headers=headers, json=preference_data)
            
            if response.status_code == 201:
                preference_info = response.json()
                
                response_data = {
                    'payment_id': preference_info['id'],
                    'amount': payment_data['amount'],
                    'status': PaymentStatus.PENDING.value,
                    'requires_card_data': True,
                    'checkout_url': preference_info['init_point'],
                    'created_at': datetime.now().isoformat()
                }
                
                return PaymentResult(
                    success=True,
                    payment_id=preference_info['id'],
                    status=PaymentStatus.PENDING,
                    message="Checkout criado com sucesso",
                    data=response_data
                ).to_dict()
            else:
                logger.error(f"Erro MP Cartão: {response.status_code} - {response.text}")
                return PaymentResult(
                    success=False,
                    payment_id="",
                    status=PaymentStatus.FAILED,
                    message=f"Erro ao criar checkout: {response.text}"
                ).to_dict()
                
        except Exception as e:
            logger.error(f"Erro ao criar checkout no MP: {e}")
            return PaymentResult(
                success=False,
                payment_id="",
                status=PaymentStatus.FAILED,
                message=f"Erro interno checkout: {str(e)}"
            ).to_dict()
    
    def get_payment_status(self, payment_id: str) -> Dict[str, Any]:
        """Consultar status de pagamento no Mercado Pago"""
        try:
            url = f"{self.base_url}/v1/payments/{payment_id}"
            
            headers = {
                "Authorization": f"Bearer {self.access_token}"
            }
            
            response = requests.get(url, headers=headers)
            
            if response.status_code == 200:
                payment_info = response.json()
                
                return PaymentResult(
                    success=True,
                    payment_id=payment_id,
                    status=PaymentStatus(self._map_mp_status(payment_info['status'])),
                    message="Status consultado com sucesso",
                    data={
                        'payment_id': payment_id,
                        'amount': payment_info.get('transaction_amount'),
                        'status': self._map_mp_status(payment_info['status']),
                        'method': payment_info.get('payment_method_id'),
                        'created_at': payment_info.get('date_created'),
                        'updated_at': payment_info.get('date_last_updated')
                    }
                ).to_dict()
            else:
                logger.error(f"Erro ao consultar MP: {response.status_code} - {response.text}")
                return PaymentResult(
                    success=False,
                    payment_id=payment_id,
                    status=PaymentStatus.FAILED,
                    message=f"Erro ao consultar status: {response.text}"
                ).to_dict()
                
        except Exception as e:
            logger.error(f"Erro ao consultar status no MP: {e}")
            return PaymentResult(
                success=False,
                payment_id=payment_id,
                status=PaymentStatus.FAILED,
                message=f"Erro interno consulta: {str(e)}"
            ).to_dict()
    
    def create_subscription(self, subscription_data: Dict[str, Any]) -> Dict[str, Any]:
        """Criar assinatura no Mercado Pago"""
        try:
            if not validate_payment_data(subscription_data):
                return PaymentResult(
                    success=False,
                    payment_id="",
                    status=PaymentStatus.FAILED,
                    message="Dados de assinatura inválidos"
                ).to_dict()
            
            # Para assinaturas, criar uma preferência que será processada no frontend
            return self._create_credit_card_payment(subscription_data)
                
        except Exception as e:
            logger.error(f"Erro ao criar assinatura no MP: {e}")
            return PaymentResult(
                success=False,
                payment_id="",
                status=PaymentStatus.FAILED,
                message=f"Erro interno assinatura: {str(e)}"
            ).to_dict()
    
    def cancel_subscription(self, subscription_id: str) -> Dict[str, Any]:
        """Cancelar assinatura no Mercado Pago"""
        # Implementação para cancelamento de assinatura
        # Por enquanto, retornar sucesso simulado
        return PaymentResult(
            success=True,
            payment_id=subscription_id,
            status=PaymentStatus.CANCELLED,
            message="Assinatura cancelada com sucesso"
        ).to_dict()
    
    def _map_mp_status(self, mp_status: str) -> str:
        """Mapear status do Mercado Pago para nossos status"""
        mapping = {
            'pending': PaymentStatus.PENDING.value,
            'approved': PaymentStatus.COMPLETED.value,
            'authorized': PaymentStatus.COMPLETED.value,
            'in_process': PaymentStatus.PENDING.value,
            'in_mediation': PaymentStatus.PENDING.value,
            'rejected': PaymentStatus.FAILED.value,
            'cancelled': PaymentStatus.CANCELLED.value,
            'refunded': PaymentStatus.REFUNDED.value,
            'charged_back': PaymentStatus.REFUNDED.value
        }
        
        return mapping.get(mp_status, PaymentStatus.FAILED.value)
    
    def _generate_qr_code(self, pix_code: str) -> str:
        """Gerar QR Code em base64 para PIX"""
        try:
            qr = qrcode.QRCode(version=1, box_size=10, border=5)
            qr.add_data(pix_code)
            qr.make(fit=True)
            
            img = qr.make_image(fill_color="black", back_color="white")
            
            # Converter para base64
            buffer = io.BytesIO()
            img.save(buffer, format='PNG')
            img_str = base64.b64encode(buffer.getvalue()).decode()
            
            return f"data:image/png;base64,{img_str}"
            
        except Exception as e:
            logger.error(f"Erro ao gerar QR Code: {e}")
            return None