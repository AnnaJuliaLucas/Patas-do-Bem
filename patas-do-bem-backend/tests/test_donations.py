import pytest
import json
from src.models.donation import Donation

class TestDonationsAPI:
    """Testes para a API de doações"""
    
    def test_create_donation_success(self, client, sample_donation_data):
        """Teste de criação de doação com sucesso"""
        response = client.post('/api/donations', 
                             data=json.dumps(sample_donation_data),
                             content_type='application/json')
        
        assert response.status_code == 201
        data = json.loads(response.data)
        assert 'donation_id' in data
        assert data['amount'] == sample_donation_data['amount']
        assert data['payment_method'] == sample_donation_data['payment_method']
    
    def test_create_donation_missing_fields(self, client):
        """Teste de criação de doação com campos obrigatórios faltando"""
        incomplete_data = {'donor_name': 'João'}
        
        response = client.post('/api/donations',
                             data=json.dumps(incomplete_data),
                             content_type='application/json')
        
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'error' in data
    
    def test_create_donation_invalid_email(self, client, sample_donation_data):
        """Teste de criação de doação com email inválido"""
        sample_donation_data['donor_email'] = 'email_invalido'
        
        response = client.post('/api/donations',
                             data=json.dumps(sample_donation_data),
                             content_type='application/json')
        
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'error' in data
        assert 'email' in data['error'].lower()
    
    def test_create_donation_negative_amount(self, client, sample_donation_data):
        """Teste de criação de doação com valor negativo"""
        sample_donation_data['amount'] = -10.0
        
        response = client.post('/api/donations',
                             data=json.dumps(sample_donation_data),
                             content_type='application/json')
        
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'error' in data
        assert 'positivo' in data['error'].lower()
    
    def test_create_donation_invalid_type(self, client, sample_donation_data):
        """Teste de criação de doação com tipo inválido"""
        sample_donation_data['donation_type'] = 'invalid_type'
        
        response = client.post('/api/donations',
                             data=json.dumps(sample_donation_data),
                             content_type='application/json')
        
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'error' in data
    
    def test_create_donation_invalid_payment_method(self, client, sample_donation_data):
        """Teste de criação de doação com método de pagamento inválido"""
        sample_donation_data['payment_method'] = 'invalid_method'
        
        response = client.post('/api/donations',
                             data=json.dumps(sample_donation_data),
                             content_type='application/json')
        
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'error' in data
    
    def test_list_donations(self, client, create_sample_donation):
        """Teste de listagem de doações"""
        response = client.get('/api/donations')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'donations' in data
        assert isinstance(data['donations'], list)
        assert len(data['donations']) >= 1
    
    def test_list_donations_with_filters(self, client, create_sample_donation):
        """Teste de listagem de doações com filtros"""
        response = client.get('/api/donations?status=pending&type=one_time')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'donations' in data
    
    def test_donation_stats(self, client, create_sample_donation):
        """Teste de estatísticas de doações"""
        # Confirmar o pagamento da doação para aparecer nas estatísticas
        donation = create_sample_donation
        donation.payment_status = 'completed'
        from src.models.user import db
        db.session.commit()
        
        response = client.get('/api/donations/stats')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'total_amount' in data
        assert 'total_donors' in data
        assert 'recent_donations' in data
        assert isinstance(data['recent_donations'], list)
    
    def test_confirm_payment(self, client, create_sample_donation):
        """Teste de confirmação de pagamento"""
        donation = create_sample_donation
        
        confirmation_data = {
            'status': 'completed',
            'payment_id': 'PAY123456'
        }
        
        response = client.post(f'/api/donations/{donation.id}/confirm',
                             data=json.dumps(confirmation_data),
                             content_type='application/json')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['donation']['payment_status'] == 'completed'
        assert data['donation']['payment_id'] == 'PAY123456'
    
    def test_confirm_payment_nonexistent(self, client):
        """Teste de confirmação de pagamento para doação inexistente"""
        confirmation_data = {'status': 'completed'}
        
        response = client.post('/api/donations/99999/confirm',
                             data=json.dumps(confirmation_data),
                             content_type='application/json')
        
        assert response.status_code == 404
    
    def test_donation_history(self, client, create_sample_donation):
        """Teste de histórico público de doações"""
        # Confirmar o pagamento para aparecer no histórico
        donation = create_sample_donation
        donation.payment_status = 'completed'
        from src.models.user import db
        db.session.commit()
        
        response = client.get('/api/donations/history')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'donations' in data
        assert isinstance(data['donations'], list)
        
        # Verificar se os dados estão anonimizados
        if data['donations']:
            donation_data = data['donations'][0]
            assert 'donor_name' in donation_data
            assert '***' in donation_data['donor_name']  # Nome anonimizado
            assert 'donor_email' not in donation_data  # Email não deve estar presente
    
    def test_cancel_donation(self, client, create_sample_donation):
        """Teste de cancelamento de doação"""
        donation = create_sample_donation
        
        response = client.put(f'/api/donations/{donation.id}/cancel')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'message' in data
        
        # Verificar se o status foi atualizado
        from src.models.user import db
        db.session.refresh(donation)
        assert donation.payment_status == 'cancelled'
    
    def test_cancel_completed_donation(self, client, create_sample_donation):
        """Teste de cancelamento de doação já confirmada"""
        donation = create_sample_donation
        donation.payment_status = 'completed'
        from src.models.user import db
        db.session.commit()
        
        response = client.put(f'/api/donations/{donation.id}/cancel')
        
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'error' in data