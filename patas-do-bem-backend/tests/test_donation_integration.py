import pytest
import json
from src.models.donation import Donation
from src.services.mock_payment_gateway import MockPaymentGateway
from src.services.payment_factory import PaymentGatewayFactory

class TestDonationIntegration:
    """Testes de integração entre doações e sistema de pagamento"""
    
    def setup_method(self):
        """Setup executado antes de cada teste"""
        # Configurar gateway mock para testes
        self.factory = PaymentGatewayFactory()
        self.factory.reset()
        self.mock_gateway = MockPaymentGateway()
        self.mock_gateway.clear_data()
        self.factory.set_gateway(self.mock_gateway)
    
    def teardown_method(self):
        """Cleanup executado após cada teste"""
        self.mock_gateway.clear_data()
        self.factory.reset()
    
    def test_create_donation_pix_with_payment_gateway(self, client):
        """Teste de criação de doação PIX usando gateway de pagamento"""
        donation_data = {
            'donor_name': 'Maria Santos',
            'donor_email': 'maria@example.com',
            'donor_phone': '(32) 99999-9999',
            'amount': 100.0,
            'donation_type': 'one_time',
            'payment_method': 'pix'
        }
        
        response = client.post('/api/donations',
                             data=json.dumps(donation_data),
                             content_type='application/json')
        
        assert response.status_code == 201
        data = json.loads(response.data)
        
        # Verificar dados da resposta
        assert 'donation_id' in data
        assert 'payment_id' in data
        assert data['payment_method'] == 'pix'
        assert data['amount'] == 100.0
        
        # Verificar dados específicos do PIX
        assert 'pix_code' in data
        assert 'qr_code_base64' in data
        assert data['qr_code_base64'] is not None
        
        # Verificar se a doação foi criada no banco
        from src.models.user import db
        donation = Donation.query.get(data['donation_id'])
        assert donation is not None
        assert donation.payment_id == data['payment_id']
        assert donation.payment_status == 'pending'
        
        # Verificar se o pagamento foi criado no gateway
        payments = self.mock_gateway.get_all_payments()
        assert len(payments) == 1
        assert data['payment_id'] in payments
    
    def test_create_donation_boleto_with_payment_gateway(self, client):
        """Teste de criação de doação boleto usando gateway de pagamento"""
        donation_data = {
            'donor_name': 'João Silva',
            'donor_email': 'joao@example.com',
            'amount': 50.0,
            'donation_type': 'one_time',
            'payment_method': 'boleto'
        }
        
        response = client.post('/api/donations',
                             data=json.dumps(donation_data),
                             content_type='application/json')
        
        assert response.status_code == 201
        data = json.loads(response.data)
        
        # Verificar dados específicos do boleto
        assert 'barcode' in data
        assert 'due_date' in data
        assert 'boleto_url' in data
        
        # Verificar se a doação foi criada no banco
        from src.models.user import db
        donation = Donation.query.get(data['donation_id'])
        assert donation is not None
        assert donation.payment_method == 'boleto'
    
    def test_create_recurring_donation_with_subscription(self, client):
        """Teste de criação de doação recorrente usando assinatura"""
        donation_data = {
            'donor_name': 'Ana Costa',
            'donor_email': 'ana@example.com',
            'amount': 30.0,
            'donation_type': 'recurring',
            'payment_method': 'credit_card'
        }
        
        response = client.post('/api/donations',
                             data=json.dumps(donation_data),
                             content_type='application/json')
        
        assert response.status_code == 201
        data = json.loads(response.data)
        
        # Verificar que foi criada uma assinatura
        assert 'subscription_id' in data
        
        # Verificar se a doação foi criada no banco com subscription_id
        from src.models.user import db
        donation = Donation.query.get(data['donation_id'])
        assert donation is not None
        assert donation.donation_type == 'recurring'
        assert donation.subscription_id == data['subscription_id']
        
        # Verificar se a assinatura foi criada no gateway
        subscriptions = self.mock_gateway.get_all_subscriptions()
        assert len(subscriptions) == 1
        assert data['subscription_id'] in subscriptions
    
    def test_create_donation_payment_failure_rollback(self, client):
        """Teste de rollback quando o gateway de pagamento falha"""
        # Configurar gateway para falhar
        self.mock_gateway.success_rate = 0.0  # 0% de sucesso
        
        donation_data = {
            'donor_name': 'Test User',
            'donor_email': 'test@example.com',
            'amount': 25.0,
            'donation_type': 'one_time',
            'payment_method': 'pix'
        }
        
        response = client.post('/api/donations',
                             data=json.dumps(donation_data),
                             content_type='application/json')
        
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'error' in data
        
        # Verificar que a doação NÃO foi salva no banco (rollback)
        from src.models.user import db
        donations = Donation.query.all()
        assert len(donations) == 0
        
        # Verificar que o pagamento NÃO foi criado no gateway
        payments = self.mock_gateway.get_all_payments()
        assert len(payments) == 0
        
        # Restaurar taxa de sucesso
        self.mock_gateway.success_rate = 0.9
    
    def test_create_donation_invalid_payment_data_validation(self, client):
        """Teste de validação de dados inválidos pelo gateway"""
        donation_data = {
            'donor_name': 'Test User',
            'donor_email': 'invalid_email',  # Email inválido
            'amount': 25.0,
            'donation_type': 'one_time',
            'payment_method': 'pix'
        }
        
        response = client.post('/api/donations',
                             data=json.dumps(donation_data),
                             content_type='application/json')
        
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'error' in data
        assert 'inválido' in data['error'].lower()
        
        # Verificar que nada foi salvo
        from src.models.user import db
        donations = Donation.query.all()
        assert len(donations) == 0
    
    def test_donation_confirmation_workflow(self, client):
        """Teste do fluxo completo de confirmação de doação"""
        # 1. Criar doação
        donation_data = {
            'donor_name': 'Carlos Lima',
            'donor_email': 'carlos@example.com',
            'amount': 75.0,
            'donation_type': 'one_time',
            'payment_method': 'pix'
        }
        
        response = client.post('/api/donations',
                             data=json.dumps(donation_data),
                             content_type='application/json')
        
        assert response.status_code == 201
        data = json.loads(response.data)
        
        donation_id = data['donation_id']
        payment_id = data['payment_id']
        
        # 2. Verificar status inicial
        from src.models.user import db
        donation = Donation.query.get(donation_id)
        assert donation.payment_status == 'pending'
        
        # 3. Simular confirmação via webhook do gateway
        webhook_result = self.mock_gateway.simulate_webhook(payment_id, 'completed')
        assert webhook_result['success'] is True
        
        # 4. Confirmar pagamento na API
        confirmation_data = {
            'status': 'completed',
            'payment_id': payment_id
        }
        
        confirm_response = client.post(f'/api/donations/{donation_id}/confirm',
                                     data=json.dumps(confirmation_data),
                                     content_type='application/json')
        
        assert confirm_response.status_code == 200
        confirm_data = json.loads(confirm_response.data)
        
        # 5. Verificar que a doação foi confirmada
        db.session.refresh(donation)
        assert donation.payment_status == 'completed'
        assert donation.payment_id == payment_id
    
    def test_multiple_donations_payment_tracking(self, client):
        """Teste de rastreamento de múltiplas doações"""
        donations_data = [
            {
                'donor_name': 'Usuário 1',
                'donor_email': 'user1@example.com',
                'amount': 20.0,
                'donation_type': 'one_time',
                'payment_method': 'pix'
            },
            {
                'donor_name': 'Usuário 2',
                'donor_email': 'user2@example.com',
                'amount': 50.0,
                'donation_type': 'recurring',
                'payment_method': 'credit_card'
            },
            {
                'donor_name': 'Usuário 3',
                'donor_email': 'user3@example.com',
                'amount': 100.0,
                'donation_type': 'one_time',
                'payment_method': 'boleto'
            }
        ]
        
        created_donations = []
        
        # Criar todas as doações
        for donation_data in donations_data:
            response = client.post('/api/donations',
                                 data=json.dumps(donation_data),
                                 content_type='application/json')
            
            assert response.status_code == 201
            data = json.loads(response.data)
            created_donations.append(data)
        
        # Verificar se todas foram criadas
        assert len(created_donations) == 3
        
        # Verificar se todas têm payment_id únicos
        payment_ids = [d['payment_id'] for d in created_donations]
        assert len(set(payment_ids)) == 3  # Todos únicos
        
        # Verificar no gateway
        payments = self.mock_gateway.get_all_payments()
        subscriptions = self.mock_gateway.get_all_subscriptions()
        
        # Deve ter 2 pagamentos únicos + 1 assinatura
        assert len(payments) == 2  # PIX + Boleto
        assert len(subscriptions) == 1  # Recurring
        
        # Verificar no banco de dados
        from src.models.user import db
        db_donations = Donation.query.all()
        assert len(db_donations) == 3
        
        # Verificar que cada doação tem o payment_id correto
        for donation in db_donations:
            assert donation.payment_id is not None
            if donation.donation_type == 'recurring':
                assert donation.subscription_id is not None
    
    def test_payment_method_specific_data_consistency(self, client):
        """Teste de consistência de dados específicos por método de pagamento"""
        test_cases = [
            {
                'method': 'pix',
                'expected_fields': ['pix_code', 'qr_code_base64', 'expires_at']
            },
            {
                'method': 'boleto',
                'expected_fields': ['barcode', 'due_date', 'boleto_url']
            },
            {
                'method': 'credit_card',
                'expected_fields': ['requires_card_data', 'checkout_url']
            }
        ]
        
        for test_case in test_cases:
            donation_data = {
                'donor_name': f'Test {test_case["method"]}',
                'donor_email': f'{test_case["method"]}@example.com',
                'amount': 40.0,
                'donation_type': 'one_time',
                'payment_method': test_case['method']
            }
            
            response = client.post('/api/donations',
                                 data=json.dumps(donation_data),
                                 content_type='application/json')
            
            assert response.status_code == 201
            data = json.loads(response.data)
            
            # Verificar que os campos específicos do método estão presentes
            for field in test_case['expected_fields']:
                assert field in data, f"Campo {field} ausente para método {test_case['method']}"
            
            # Verificar consistência no banco
            from src.models.user import db
            donation = Donation.query.get(data['donation_id'])
            assert donation.payment_method == test_case['method']