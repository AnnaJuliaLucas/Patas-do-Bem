import pytest
import time
from datetime import datetime
from src.services.mock_payment_gateway import MockPaymentGateway
from src.services.payment_gateway import PaymentStatus, PaymentMethod, validate_payment_data
from src.services.payment_factory import PaymentGatewayFactory, get_payment_gateway

class TestPaymentGateway:
    """Testes para o sistema de gateway de pagamento"""
    
    def setup_method(self):
        """Setup executado antes de cada teste"""
        self.gateway = MockPaymentGateway()
        self.gateway.clear_data()  # Limpar dados entre testes
    
    def teardown_method(self):
        """Cleanup executado após cada teste"""
        self.gateway.clear_data()
    
    def test_validate_payment_data_success(self):
        """Teste de validação de dados válidos"""
        valid_data = {
            'amount': 50.0,
            'payment_method': 'pix',
            'payer_name': 'João Silva',
            'payer_email': 'joao@example.com'
        }
        
        assert validate_payment_data(valid_data) is True
    
    def test_validate_payment_data_missing_fields(self):
        """Teste de validação com campos obrigatórios faltando"""
        invalid_data = {
            'amount': 50.0,
            'payment_method': 'pix'
            # Faltando payer_name e payer_email
        }
        
        assert validate_payment_data(invalid_data) is False
    
    def test_validate_payment_data_invalid_amount(self):
        """Teste de validação com valor inválido"""
        invalid_data = {
            'amount': -10.0,  # Valor negativo
            'payment_method': 'pix',
            'payer_name': 'João Silva',
            'payer_email': 'joao@example.com'
        }
        
        assert validate_payment_data(invalid_data) is False
    
    def test_validate_payment_data_invalid_email(self):
        """Teste de validação com email inválido"""
        invalid_data = {
            'amount': 50.0,
            'payment_method': 'pix',
            'payer_name': 'João Silva',
            'payer_email': 'email_invalido'  # Email sem @ e domínio
        }
        
        assert validate_payment_data(invalid_data) is False
    
    def test_validate_payment_data_invalid_method(self):
        """Teste de validação com método de pagamento inválido"""
        invalid_data = {
            'amount': 50.0,
            'payment_method': 'invalid_method',
            'payer_name': 'João Silva',
            'payer_email': 'joao@example.com'
        }
        
        assert validate_payment_data(invalid_data) is False

class TestMockPaymentGateway:
    """Testes específicos para o Mock Payment Gateway"""
    
    def setup_method(self):
        """Setup executado antes de cada teste"""
        self.gateway = MockPaymentGateway()
        self.gateway.clear_data()
        
        self.sample_payment_data = {
            'amount': 100.0,
            'payment_method': 'pix',
            'payer_name': 'Maria Santos',
            'payer_email': 'maria@example.com',
            'payer_phone': '(32) 99999-9999',
            'description': 'Doação teste'
        }
    
    def teardown_method(self):
        """Cleanup executado após cada teste"""
        self.gateway.clear_data()
    
    def test_create_payment_success(self):
        """Teste de criação de pagamento com sucesso"""
        result = self.gateway.create_payment(self.sample_payment_data)
        
        assert result['success'] is True
        assert result['status'] == PaymentStatus.PENDING.value
        assert 'payment_id' in result
        assert result['payment_id'].startswith('mock_pay_')
        
        # Verificar se foi armazenado
        payments = self.gateway.get_all_payments()
        assert len(payments) == 1
        assert result['payment_id'] in payments
    
    def test_create_payment_pix_generates_qr_code(self):
        """Teste de criação de pagamento PIX gera QR code"""
        self.sample_payment_data['payment_method'] = 'pix'
        result = self.gateway.create_payment(self.sample_payment_data)
        
        assert result['success'] is True
        assert 'pix_code' in result['data']
        assert 'qr_code_base64' in result['data']
        assert result['data']['qr_code_base64'] is not None
    
    def test_create_payment_boleto_generates_barcode(self):
        """Teste de criação de pagamento boleto gera código de barras"""
        self.sample_payment_data['payment_method'] = 'boleto'
        result = self.gateway.create_payment(self.sample_payment_data)
        
        assert result['success'] is True
        assert 'barcode' in result['data']
        assert 'due_date' in result['data']
        assert 'boleto_url' in result['data']
    
    def test_create_payment_credit_card_requires_form(self):
        """Teste de criação de pagamento cartão indica necessidade de formulário"""
        self.sample_payment_data['payment_method'] = 'credit_card'
        result = self.gateway.create_payment(self.sample_payment_data)
        
        assert result['success'] is True
        assert 'requires_card_data' in result['data']
        assert result['data']['requires_card_data'] is True
    
    def test_create_payment_invalid_data(self):
        """Teste de criação de pagamento com dados inválidos"""
        invalid_data = {
            'amount': -50.0,  # Valor inválido
            'payment_method': 'pix',
            'payer_name': 'Test',
            'payer_email': 'invalid_email'  # Email inválido
        }
        
        result = self.gateway.create_payment(invalid_data)
        
        assert result['success'] is False
        assert 'inválidos' in result['message'].lower()
        
        # Verificar que não foi armazenado
        payments = self.gateway.get_all_payments()
        assert len(payments) == 0
    
    def test_get_payment_status_success(self):
        """Teste de consulta de status com sucesso"""
        # Criar pagamento primeiro
        create_result = self.gateway.create_payment(self.sample_payment_data)
        payment_id = create_result['payment_id']
        
        # Consultar status
        status_result = self.gateway.get_payment_status(payment_id)
        
        assert status_result['success'] is True
        assert status_result['data']['payment_id'] == payment_id
        assert status_result['data']['amount'] == self.sample_payment_data['amount']
        assert status_result['data']['status'] == PaymentStatus.PENDING.value
    
    def test_get_payment_status_not_found(self):
        """Teste de consulta de status para pagamento inexistente"""
        result = self.gateway.get_payment_status('nonexistent_payment')
        
        assert result['success'] is False
        assert 'não encontrado' in result['message'].lower()
    
    def test_create_subscription_success(self):
        """Teste de criação de assinatura com sucesso"""
        subscription_data = self.sample_payment_data.copy()
        subscription_data['frequency'] = 'monthly'
        
        result = self.gateway.create_subscription(subscription_data)
        
        assert result['success'] is True
        assert result['status'] == PaymentStatus.COMPLETED.value
        assert 'subscription_id' in result['data']
        assert result['data']['status'] == 'active'
        
        # Verificar se foi armazenado
        subscriptions = self.gateway.get_all_subscriptions()
        assert len(subscriptions) == 1
    
    def test_cancel_subscription_success(self):
        """Teste de cancelamento de assinatura com sucesso"""
        # Criar assinatura primeiro
        create_result = self.gateway.create_subscription(self.sample_payment_data)
        subscription_id = create_result['data']['subscription_id']
        
        # Cancelar assinatura
        cancel_result = self.gateway.cancel_subscription(subscription_id)
        
        assert cancel_result['success'] is True
        assert cancel_result['status'] == PaymentStatus.CANCELLED.value
        
        # Verificar se foi atualizada
        subscriptions = self.gateway.get_all_subscriptions()
        assert subscriptions[subscription_id]['status'] == 'cancelled'
    
    def test_cancel_subscription_not_found(self):
        """Teste de cancelamento de assinatura inexistente"""
        result = self.gateway.cancel_subscription('nonexistent_subscription')
        
        assert result['success'] is False
        assert 'não encontrada' in result['message'].lower()
    
    def test_process_credit_card_success(self):
        """Teste de processamento de cartão com sucesso"""
        # Criar pagamento primeiro
        create_result = self.gateway.create_payment(self.sample_payment_data)
        payment_id = create_result['payment_id']
        
        card_data = {
            'card_number': '4111111111111111',
            'expiry_month': '12',
            'expiry_year': '2025',
            'cvv': '123',
            'holder_name': 'MARIA SANTOS'
        }
        
        # Configurar alta taxa de sucesso para este teste
        original_rate = self.gateway.success_rate
        self.gateway.success_rate = 1.0
        
        result = self.gateway.process_credit_card(payment_id, card_data)
        
        # Restaurar taxa original
        self.gateway.success_rate = original_rate
        
        assert result['success'] is True
        assert 'authorization_code' in result['data']
        assert 'card_last_digits' in result['data']
        assert result['data']['card_last_digits'] == '1111'
    
    def test_process_credit_card_missing_data(self):
        """Teste de processamento de cartão com dados faltando"""
        # Criar pagamento primeiro
        create_result = self.gateway.create_payment(self.sample_payment_data)
        payment_id = create_result['payment_id']
        
        incomplete_card_data = {
            'card_number': '4111111111111111'
            # Faltando outros campos obrigatórios
        }
        
        result = self.gateway.process_credit_card(payment_id, incomplete_card_data)
        
        assert result['success'] is False
        assert 'obrigatório' in result['message'].lower()
    
    def test_simulate_webhook_success(self):
        """Teste de simulação de webhook"""
        # Criar pagamento primeiro
        create_result = self.gateway.create_payment(self.sample_payment_data)
        payment_id = create_result['payment_id']
        
        # Simular webhook de confirmação
        webhook_result = self.gateway.simulate_webhook(payment_id, PaymentStatus.COMPLETED.value)
        
        assert webhook_result['success'] is True
        assert webhook_result['status'] == PaymentStatus.COMPLETED.value
        
        # Verificar se o pagamento foi atualizado
        payments = self.gateway.get_all_payments()
        assert payments[payment_id]['status'] == PaymentStatus.COMPLETED.value
    
    def test_auto_confirm_pix_payment(self):
        """Teste de confirmação automática de pagamento PIX"""
        self.sample_payment_data['payment_method'] = 'pix'
        
        # Configurar alta taxa de sucesso
        original_rate = self.gateway.success_rate
        self.gateway.success_rate = 1.0
        
        create_result = self.gateway.create_payment(self.sample_payment_data)
        payment_id = create_result['payment_id']
        
        # Aguardar confirmação automática (simular delay)
        time.sleep(0.1)  # Pequeno delay para simular processamento
        
        # Simular confirmação automática manualmente (já que não podemos aguardar os 2 segundos reais)
        self.gateway._auto_confirm_payment(payment_id)
        
        # Verificar se foi confirmado
        payments = self.gateway.get_all_payments()
        assert payments[payment_id]['status'] == PaymentStatus.COMPLETED.value
        assert 'confirmed_at' in payments[payment_id]
        
        # Restaurar taxa original
        self.gateway.success_rate = original_rate

class TestPaymentGatewayFactory:
    """Testes para o Payment Gateway Factory"""
    
    def setup_method(self):
        """Setup executado antes de cada teste"""
        self.factory = PaymentGatewayFactory()
        self.factory.reset()
    
    def teardown_method(self):
        """Cleanup executado após cada teste"""
        self.factory.reset()
    
    def test_get_gateway_default_mock(self):
        """Teste de obtenção do gateway padrão (mock)"""
        gateway = self.factory.get_gateway()
        
        assert gateway is not None
        assert isinstance(gateway, MockPaymentGateway)
    
    def test_get_gateway_singleton(self):
        """Teste de que o factory retorna a mesma instância (singleton)"""
        gateway1 = self.factory.get_gateway()
        gateway2 = self.factory.get_gateway()
        
        assert gateway1 is gateway2
    
    def test_set_gateway_manually(self):
        """Teste de definição manual do gateway"""
        custom_gateway = MockPaymentGateway()
        self.factory.set_gateway(custom_gateway)
        
        retrieved_gateway = self.factory.get_gateway()
        
        assert retrieved_gateway is custom_gateway
    
    def test_get_payment_gateway_function(self):
        """Teste da função utilitária get_payment_gateway"""
        gateway = get_payment_gateway()
        
        assert gateway is not None
        assert isinstance(gateway, MockPaymentGateway)

class TestPaymentIntegration:
    """Testes de integração do sistema de pagamentos"""
    
    def setup_method(self):
        """Setup executado antes de cada teste"""
        # Usar o gateway mock para testes
        self.factory = PaymentGatewayFactory()
        self.factory.reset()
        self.gateway = MockPaymentGateway()
        self.factory.set_gateway(self.gateway)
        self.gateway.clear_data()
    
    def teardown_method(self):
        """Cleanup executado após cada teste"""
        self.gateway.clear_data()
        self.factory.reset()
    
    def test_complete_payment_flow_pix(self):
        """Teste de fluxo completo de pagamento PIX"""
        # 1. Criar pagamento
        payment_data = {
            'amount': 75.50,
            'payment_method': 'pix',
            'payer_name': 'Ana Costa',
            'payer_email': 'ana@example.com',
            'description': 'Doação mensal - Teste'
        }
        
        create_result = self.gateway.create_payment(payment_data)
        assert create_result['success'] is True
        
        payment_id = create_result['payment_id']
        
        # 2. Verificar que o QR code foi gerado
        assert 'pix_code' in create_result['data']
        assert 'qr_code_base64' in create_result['data']
        
        # 3. Consultar status inicial
        status_result = self.gateway.get_payment_status(payment_id)
        assert status_result['data']['status'] == PaymentStatus.PENDING.value
        
        # 4. Simular confirmação via webhook
        webhook_result = self.gateway.simulate_webhook(payment_id, PaymentStatus.COMPLETED.value)
        assert webhook_result['success'] is True
        
        # 5. Consultar status final
        final_status = self.gateway.get_payment_status(payment_id)
        assert final_status['data']['status'] == PaymentStatus.COMPLETED.value
    
    def test_complete_subscription_flow(self):
        """Teste de fluxo completo de assinatura"""
        # 1. Criar assinatura
        subscription_data = {
            'amount': 50.0,
            'payment_method': 'credit_card',
            'payer_name': 'Carlos Silva',
            'payer_email': 'carlos@example.com',
            'description': 'Assinatura mensal - Teste',
            'frequency': 'monthly'
        }
        
        create_result = self.gateway.create_subscription(subscription_data)
        assert create_result['success'] is True
        
        subscription_id = create_result['data']['subscription_id']
        
        # 2. Verificar que a assinatura está ativa
        subscriptions = self.gateway.get_all_subscriptions()
        assert subscriptions[subscription_id]['status'] == 'active'
        
        # 3. Cancelar assinatura
        cancel_result = self.gateway.cancel_subscription(subscription_id)
        assert cancel_result['success'] is True
        
        # 4. Verificar que foi cancelada
        updated_subscriptions = self.gateway.get_all_subscriptions()
        assert updated_subscriptions[subscription_id]['status'] == 'cancelled'