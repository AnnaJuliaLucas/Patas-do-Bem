"""
Mock Payment Gateway
Implementação simulada para testes e desenvolvimento
"""

import time
import uuid
import random
import base64
from datetime import datetime, timedelta
from typing import Dict, Any
from .payment_gateway import PaymentGateway, PaymentStatus, PaymentMethod, PaymentResult, validate_payment_data
import logging

logger = logging.getLogger(__name__)

class MockPaymentGateway(PaymentGateway):
    """Gateway de pagamento simulado para testes e desenvolvimento"""
    
    def __init__(self):
        # Armazenamento em memória para simulação
        self._payments = {}
        self._subscriptions = {}
        self._boletos = {}
        self._pix_codes = {}
        
        # Configurações de simulação
        self.success_rate = 0.9  # 90% de sucesso
        self.processing_delay = 2  # 2 segundos para simular processamento
    
    def create_payment(self, payment_data: Dict[str, Any]) -> Dict[str, Any]:
        """Criar um pagamento simulado"""
        try:
            # Validar dados
            if not validate_payment_data(payment_data):
                return PaymentResult(
                    success=False,
                    payment_id="",
                    status=PaymentStatus.FAILED,
                    message="Dados de pagamento inválidos"
                ).to_dict()
            
            # Simular processamento com base na success_rate
            processing_success = random.random() < self.success_rate
            
            # Se configurado para falhar, retornar falha imediatamente
            if not processing_success:
                return PaymentResult(
                    success=False,
                    payment_id="",
                    status=PaymentStatus.FAILED,
                    message="Falha no processamento do pagamento"
                ).to_dict()
            
            # Gerar ID único
            payment_id = f"mock_pay_{uuid.uuid4().hex[:12]}"
            
            # Criar registro do pagamento
            payment_record = {
                'id': payment_id,
                'amount': float(payment_data['amount']),
                'method': payment_data['payment_method'],
                'payer_name': payment_data['payer_name'],
                'payer_email': payment_data['payer_email'],
                'payer_phone': payment_data.get('payer_phone', ''),
                'description': payment_data.get('description', 'Doação Patas do Bem'),
                'status': PaymentStatus.PENDING.value,
                'created_at': datetime.now().isoformat(),
                'updated_at': datetime.now().isoformat()
            }
            
            self._payments[payment_id] = payment_record
            
            # Preparar resposta baseada no método de pagamento
            response_data = {
                'payment_id': payment_id,
                'amount': payment_record['amount'],
                'status': PaymentStatus.PENDING.value,
                'created_at': payment_record['created_at']
            }
            
            if payment_data['payment_method'] == PaymentMethod.PIX.value:
                pix_data = self.generate_pix_qr_code(payment_id, payment_record['amount'])
                response_data.update(pix_data['data'])
                
            elif payment_data['payment_method'] == PaymentMethod.BOLETO.value:
                boleto_data = self.generate_boleto(payment_id, payment_data)
                response_data.update(boleto_data['data'])
                
            elif payment_data['payment_method'] == PaymentMethod.CREDIT_CARD.value:
                response_data['requires_card_data'] = True
                response_data['checkout_url'] = f"/api/payments/{payment_id}/card-form"
            
            # Simular processamento automático para alguns casos (PIX rápido)
            if payment_data['payment_method'] == PaymentMethod.PIX.value and processing_success:
                # Simular confirmação após delay
                import threading
                threading.Timer(self.processing_delay, self._auto_confirm_payment, [payment_id]).start()
            
            return PaymentResult(
                success=True,
                payment_id=payment_id,
                status=PaymentStatus.PENDING,
                message="Pagamento criado com sucesso",
                data=response_data
            ).to_dict()
            
        except Exception as e:
            logger.error(f"Erro ao criar pagamento: {e}")
            return PaymentResult(
                success=False,
                payment_id="",
                status=PaymentStatus.FAILED,
                message=f"Erro interno: {str(e)}"
            ).to_dict()
    
    def get_payment_status(self, payment_id: str) -> Dict[str, Any]:
        """Consultar status de pagamento"""
        try:
            if payment_id not in self._payments:
                return PaymentResult(
                    success=False,
                    payment_id=payment_id,
                    status=PaymentStatus.FAILED,
                    message="Pagamento não encontrado"
                ).to_dict()
            
            payment = self._payments[payment_id]
            
            return PaymentResult(
                success=True,
                payment_id=payment_id,
                status=PaymentStatus(payment['status']),
                message="Status consultado com sucesso",
                data={
                    'payment_id': payment_id,
                    'amount': payment['amount'],
                    'status': payment['status'],
                    'method': payment['method'],
                    'created_at': payment['created_at'],
                    'updated_at': payment['updated_at']
                }
            ).to_dict()
            
        except Exception as e:
            logger.error(f"Erro ao consultar status: {e}")
            return PaymentResult(
                success=False,
                payment_id=payment_id,
                status=PaymentStatus.FAILED,
                message=f"Erro ao consultar: {str(e)}"
            ).to_dict()
    
    def create_subscription(self, subscription_data: Dict[str, Any]) -> Dict[str, Any]:
        """Criar assinatura recorrente simulada"""
        try:
            if not validate_payment_data(subscription_data):
                return PaymentResult(
                    success=False,
                    payment_id="",
                    status=PaymentStatus.FAILED,
                    message="Dados de assinatura inválidos"
                ).to_dict()
            
            subscription_id = f"mock_sub_{uuid.uuid4().hex[:12]}"
            
            # Criar registro da assinatura
            subscription_record = {
                'id': subscription_id,
                'amount': float(subscription_data['amount']),
                'frequency': subscription_data.get('frequency', 'monthly'),
                'payer_name': subscription_data['payer_name'],
                'payer_email': subscription_data['payer_email'],
                'status': 'active',
                'created_at': datetime.now().isoformat(),
                'next_payment_date': (datetime.now() + timedelta(days=30)).isoformat()
            }
            
            self._subscriptions[subscription_id] = subscription_record
            
            return PaymentResult(
                success=True,
                payment_id=subscription_id,
                status=PaymentStatus.COMPLETED,
                message="Assinatura criada com sucesso",
                data={
                    'subscription_id': subscription_id,
                    'status': 'active',
                    'next_payment_date': subscription_record['next_payment_date']
                }
            ).to_dict()
            
        except Exception as e:
            logger.error(f"Erro ao criar assinatura: {e}")
            return PaymentResult(
                success=False,
                payment_id="",
                status=PaymentStatus.FAILED,
                message=f"Erro interno: {str(e)}"
            ).to_dict()
    
    def cancel_subscription(self, subscription_id: str) -> Dict[str, Any]:
        """Cancelar assinatura"""
        try:
            if subscription_id not in self._subscriptions:
                return PaymentResult(
                    success=False,
                    payment_id=subscription_id,
                    status=PaymentStatus.FAILED,
                    message="Assinatura não encontrada"
                ).to_dict()
            
            self._subscriptions[subscription_id]['status'] = 'cancelled'
            self._subscriptions[subscription_id]['cancelled_at'] = datetime.now().isoformat()
            
            return PaymentResult(
                success=True,
                payment_id=subscription_id,
                status=PaymentStatus.CANCELLED,
                message="Assinatura cancelada com sucesso"
            ).to_dict()
            
        except Exception as e:
            logger.error(f"Erro ao cancelar assinatura: {e}")
            return PaymentResult(
                success=False,
                payment_id=subscription_id,
                status=PaymentStatus.FAILED,
                message=f"Erro interno: {str(e)}"
            ).to_dict()
    
    def generate_pix_qr_code(self, payment_id: str, amount: float) -> Dict[str, Any]:
        """Gerar QR Code PIX simulado"""
        try:
            # Simular código PIX
            pix_code = f"00020126330014BR.GOV.BCB.PIX0111{payment_id}520400005303986540{amount:.2f}5802BR5920PATAS DO BEM6009SantosDu62{len(payment_id):02d}{payment_id}6304"
            
            # Simular QR Code em base64 (imagem pequena simulada)
            qr_code_b64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
            
            pix_data = {
                'pix_code': pix_code,
                'qr_code_base64': qr_code_b64,
                'qr_code_url': f"data:image/png;base64,{qr_code_b64}",
                'expires_at': (datetime.now() + timedelta(minutes=30)).isoformat()
            }
            
            self._pix_codes[payment_id] = pix_data
            
            return PaymentResult(
                success=True,
                payment_id=payment_id,
                status=PaymentStatus.PENDING,
                message="QR Code PIX gerado",
                data=pix_data
            ).to_dict()
            
        except Exception as e:
            logger.error(f"Erro ao gerar PIX: {e}")
            return PaymentResult(
                success=False,
                payment_id=payment_id,
                status=PaymentStatus.FAILED,
                message=f"Erro ao gerar PIX: {str(e)}"
            ).to_dict()
    
    def generate_boleto(self, payment_id: str, payment_data: Dict[str, Any]) -> Dict[str, Any]:
        """Gerar boleto simulado"""
        try:
            due_date = datetime.now() + timedelta(days=3)
            barcode = f"23790000000{int(payment_data['amount'] * 100):010d}101234567890123456789"
            
            boleto_data = {
                'barcode': barcode,
                'due_date': due_date.strftime('%Y-%m-%d'),
                'boleto_url': f"/api/payments/{payment_id}/boleto.pdf",
                'bank_line': f"{barcode[:5]}.{barcode[5:10]} {barcode[10:15]}.{barcode[15:21]} {barcode[21:26]}.{barcode[26:32]} {barcode[32]} {barcode[33:]}"
            }
            
            self._boletos[payment_id] = boleto_data
            
            return PaymentResult(
                success=True,
                payment_id=payment_id,
                status=PaymentStatus.PENDING,
                message="Boleto gerado",
                data=boleto_data
            ).to_dict()
            
        except Exception as e:
            logger.error(f"Erro ao gerar boleto: {e}")
            return PaymentResult(
                success=False,
                payment_id=payment_id,
                status=PaymentStatus.FAILED,
                message=f"Erro ao gerar boleto: {str(e)}"
            ).to_dict()
    
    def process_credit_card(self, payment_id: str, card_data: Dict[str, Any]) -> Dict[str, Any]:
        """Processar pagamento no cartão simulado"""
        try:
            if payment_id not in self._payments:
                return PaymentResult(
                    success=False,
                    payment_id=payment_id,
                    status=PaymentStatus.FAILED,
                    message="Pagamento não encontrado"
                ).to_dict()
            
            # Simular validação do cartão
            required_card_fields = ['card_number', 'expiry_month', 'expiry_year', 'cvv', 'holder_name']
            for field in required_card_fields:
                if field not in card_data or not card_data[field]:
                    return PaymentResult(
                        success=False,
                        payment_id=payment_id,
                        status=PaymentStatus.FAILED,
                        message=f"Campo obrigatório: {field}"
                    ).to_dict()
            
            # Simular processamento
            processing_success = random.random() < self.success_rate
            
            if processing_success:
                self._payments[payment_id]['status'] = PaymentStatus.COMPLETED.value
                self._payments[payment_id]['updated_at'] = datetime.now().isoformat()
                self._payments[payment_id]['authorization_code'] = f"AUTH{random.randint(100000, 999999)}"
                
                return PaymentResult(
                    success=True,
                    payment_id=payment_id,
                    status=PaymentStatus.COMPLETED,
                    message="Pagamento aprovado",
                    data={
                        'authorization_code': self._payments[payment_id]['authorization_code'],
                        'card_last_digits': card_data['card_number'][-4:],
                        'processed_at': self._payments[payment_id]['updated_at']
                    }
                ).to_dict()
            else:
                self._payments[payment_id]['status'] = PaymentStatus.FAILED.value
                self._payments[payment_id]['updated_at'] = datetime.now().isoformat()
                
                return PaymentResult(
                    success=False,
                    payment_id=payment_id,
                    status=PaymentStatus.FAILED,
                    message="Pagamento recusado pelo banco"
                ).to_dict()
            
        except Exception as e:
            logger.error(f"Erro ao processar cartão: {e}")
            return PaymentResult(
                success=False,
                payment_id=payment_id,
                status=PaymentStatus.FAILED,
                message=f"Erro interno: {str(e)}"
            ).to_dict()
    
    def _auto_confirm_payment(self, payment_id: str):
        """Confirmar pagamento automaticamente (simulação PIX)"""
        try:
            if payment_id in self._payments:
                self._payments[payment_id]['status'] = PaymentStatus.COMPLETED.value
                self._payments[payment_id]['updated_at'] = datetime.now().isoformat()
                self._payments[payment_id]['confirmed_at'] = datetime.now().isoformat()
                logger.info(f"Pagamento {payment_id} confirmado automaticamente")
        except Exception as e:
            logger.error(f"Erro na confirmação automática: {e}")
    
    # Métodos utilitários para testes
    def get_all_payments(self) -> Dict[str, Any]:
        """Obter todos os pagamentos (para testes)"""
        return self._payments.copy()
    
    def get_all_subscriptions(self) -> Dict[str, Any]:
        """Obter todas as assinaturas (para testes)"""
        return self._subscriptions.copy()
    
    def clear_data(self):
        """Limpar todos os dados (para testes)"""
        self._payments.clear()
        self._subscriptions.clear()
        self._boletos.clear()
        self._pix_codes.clear()
    
    def simulate_webhook(self, payment_id: str, new_status: str) -> Dict[str, Any]:
        """Simular webhook de confirmação de pagamento"""
        try:
            if payment_id not in self._payments:
                return {'success': False, 'message': 'Pagamento não encontrado'}
            
            self._payments[payment_id]['status'] = new_status
            self._payments[payment_id]['updated_at'] = datetime.now().isoformat()
            
            return {
                'success': True,
                'payment_id': payment_id,
                'status': new_status,
                'updated_at': self._payments[payment_id]['updated_at']
            }
        except Exception as e:
            logger.error(f"Erro ao simular webhook: {e}")
            return {'success': False, 'message': str(e)}