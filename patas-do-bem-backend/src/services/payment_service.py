import requests
import json
import uuid
import qrcode
import io
import base64
from datetime import datetime, timedelta
import os

class PaymentService:
    def __init__(self):
        # Configurações do Mercado Pago (usar variáveis de ambiente em produção)
        self.mp_access_token = os.getenv('MP_ACCESS_TOKEN', 'TEST-ACCESS-TOKEN')
        self.mp_public_key = os.getenv('MP_PUBLIC_KEY', 'TEST-PUBLIC-KEY')
        
        # Configurações PIX
        self.pix_key = os.getenv('PIX_KEY', '32999999999')  # Chave PIX da ONG
        self.pix_recipient_name = 'Associação Patas do Bem'
        
    def create_pix_payment(self, amount, description, payer_email=None):
        """Cria pagamento PIX usando Mercado Pago"""
        try:
            url = "https://api.mercadopago.com/v1/payments"
            
            headers = {
                "Authorization": f"Bearer {self.mp_access_token}",
                "Content-Type": "application/json"
            }
            
            payment_data = {
                "transaction_amount": float(amount),
                "description": description,
                "payment_method_id": "pix",
                "payer": {
                    "email": payer_email or "test@test.com"
                },
                "notification_url": f"{os.getenv('BASE_URL', 'http://localhost:5000')}/api/webhooks/mercadopago"
            }
            
            response = requests.post(url, headers=headers, json=payment_data)
            
            if response.status_code == 201:
                payment_info = response.json()
                
                # Gerar QR Code PIX
                pix_code = payment_info.get('point_of_interaction', {}).get('transaction_data', {}).get('qr_code', '')
                qr_code_base64 = self._generate_qr_code(pix_code) if pix_code else None
                
                return {
                    'success': True,
                    'payment_id': payment_info['id'],
                    'status': payment_info['status'],
                    'qr_code': pix_code,
                    'qr_code_base64': qr_code_base64,
                    'amount': amount,
                    'expires_at': payment_info.get('date_of_expiration'),
                    'payment_url': payment_info.get('point_of_interaction', {}).get('transaction_data', {}).get('ticket_url')
                }
            else:
                return {
                    'success': False,
                    'error': f'Erro ao criar pagamento PIX: {response.text}'
                }
                
        except Exception as e:
            return {
                'success': False,
                'error': f'Erro interno: {str(e)}'
            }
    
    def create_credit_card_payment(self, amount, description, card_data, payer_data, installments=1):
        """Cria pagamento com cartão de crédito"""
        try:
            url = "https://api.mercadopago.com/v1/payments"
            
            headers = {
                "Authorization": f"Bearer {self.mp_access_token}",
                "Content-Type": "application/json"
            }
            
            payment_data = {
                "transaction_amount": float(amount),
                "description": description,
                "installments": installments,
                "payment_method_id": card_data.get('payment_method_id', 'visa'),
                "token": card_data.get('token'),  # Token do cartão gerado no frontend
                "payer": {
                    "email": payer_data.get('email'),
                    "identification": {
                        "type": payer_data.get('doc_type', 'CPF'),
                        "number": payer_data.get('doc_number')
                    },
                    "first_name": payer_data.get('first_name'),
                    "last_name": payer_data.get('last_name')
                },
                "notification_url": f"{os.getenv('BASE_URL', 'http://localhost:5000')}/api/webhooks/mercadopago"
            }
            
            response = requests.post(url, headers=headers, json=payment_data)
            
            if response.status_code == 201:
                payment_info = response.json()
                return {
                    'success': True,
                    'payment_id': payment_info['id'],
                    'status': payment_info['status'],
                    'status_detail': payment_info.get('status_detail'),
                    'amount': amount
                }
            else:
                return {
                    'success': False,
                    'error': f'Erro ao processar cartão: {response.text}'
                }
                
        except Exception as e:
            return {
                'success': False,
                'error': f'Erro interno: {str(e)}'
            }
    
    def create_recurring_payment(self, amount, description, payer_data, card_token, frequency='monthly'):
        """Cria assinatura recorrente"""
        try:
            url = "https://api.mercadopago.com/preapproval"
            
            headers = {
                "Authorization": f"Bearer {self.mp_access_token}",
                "Content-Type": "application/json"
            }
            
            # Data de início (próximo mês)
            start_date = datetime.now() + timedelta(days=30)
            
            subscription_data = {
                "reason": description,
                "auto_recurring": {
                    "frequency": 1,
                    "frequency_type": "months",
                    "transaction_amount": float(amount),
                    "currency_id": "BRL"
                },
                "payer_email": payer_data.get('email'),
                "card_token_id": card_token,
                "status": "authorized",
                "external_reference": str(uuid.uuid4()),
                "notification_url": f"{os.getenv('BASE_URL', 'http://localhost:5000')}/api/webhooks/mercadopago"
            }
            
            response = requests.post(url, headers=headers, json=subscription_data)
            
            if response.status_code == 201:
                subscription_info = response.json()
                return {
                    'success': True,
                    'subscription_id': subscription_info['id'],
                    'status': subscription_info['status'],
                    'amount': amount,
                    'next_payment_date': subscription_info.get('next_payment_date')
                }
            else:
                return {
                    'success': False,
                    'error': f'Erro ao criar assinatura: {response.text}'
                }
                
        except Exception as e:
            return {
                'success': False,
                'error': f'Erro interno: {str(e)}'
            }
    
    def create_boleto_payment(self, amount, description, payer_data):
        """Cria pagamento via boleto"""
        try:
            url = "https://api.mercadopago.com/v1/payments"
            
            headers = {
                "Authorization": f"Bearer {self.mp_access_token}",
                "Content-Type": "application/json"
            }
            
            # Data de vencimento (3 dias)
            due_date = (datetime.now() + timedelta(days=3)).isoformat()
            
            payment_data = {
                "transaction_amount": float(amount),
                "description": description,
                "payment_method_id": "bolbradesco",
                "payer": {
                    "email": payer_data.get('email'),
                    "first_name": payer_data.get('first_name'),
                    "last_name": payer_data.get('last_name'),
                    "identification": {
                        "type": payer_data.get('doc_type', 'CPF'),
                        "number": payer_data.get('doc_number')
                    },
                    "address": {
                        "zip_code": payer_data.get('zip_code', '36240000'),
                        "street_name": payer_data.get('street_name', 'Rua Principal'),
                        "street_number": payer_data.get('street_number', '123'),
                        "neighborhood": payer_data.get('neighborhood', 'Centro'),
                        "city": payer_data.get('city', 'Santos Dumont'),
                        "federal_unit": payer_data.get('state', 'MG')
                    }
                },
                "date_of_expiration": due_date,
                "notification_url": f"{os.getenv('BASE_URL', 'http://localhost:5000')}/api/webhooks/mercadopago"
            }
            
            response = requests.post(url, headers=headers, json=payment_data)
            
            if response.status_code == 201:
                payment_info = response.json()
                return {
                    'success': True,
                    'payment_id': payment_info['id'],
                    'status': payment_info['status'],
                    'boleto_url': payment_info.get('transaction_details', {}).get('external_resource_url'),
                    'barcode': payment_info.get('transaction_details', {}).get('barcode'),
                    'due_date': due_date,
                    'amount': amount
                }
            else:
                return {
                    'success': False,
                    'error': f'Erro ao gerar boleto: {response.text}'
                }
                
        except Exception as e:
            return {
                'success': False,
                'error': f'Erro interno: {str(e)}'
            }
    
    def get_payment_status(self, payment_id):
        """Consulta status de um pagamento"""
        try:
            url = f"https://api.mercadopago.com/v1/payments/{payment_id}"
            
            headers = {
                "Authorization": f"Bearer {self.mp_access_token}"
            }
            
            response = requests.get(url, headers=headers)
            
            if response.status_code == 200:
                payment_info = response.json()
                return {
                    'success': True,
                    'status': payment_info['status'],
                    'status_detail': payment_info.get('status_detail'),
                    'amount': payment_info.get('transaction_amount')
                }
            else:
                return {
                    'success': False,
                    'error': f'Erro ao consultar pagamento: {response.text}'
                }
                
        except Exception as e:
            return {
                'success': False,
                'error': f'Erro interno: {str(e)}'
            }
    
    def _generate_qr_code(self, pix_code):
        """Gera QR Code em base64 para PIX"""
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
            print(f"Erro ao gerar QR Code: {e}")
            return None
    
    def process_webhook(self, webhook_data):
        """Processa webhook do Mercado Pago"""
        try:
            if webhook_data.get('type') == 'payment':
                payment_id = webhook_data.get('data', {}).get('id')
                if payment_id:
                    return self.get_payment_status(payment_id)
            
            return {'success': True, 'processed': False}
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Erro ao processar webhook: {str(e)}'
            }

# Instância global do serviço
payment_service = PaymentService()

