import pytest
import json
from datetime import datetime
from src.models.raffle import Raffle, RaffleTicket

class TestRafflesAPI:
    """Testes para a API de rifas"""
    
    def test_list_raffles(self, client, create_sample_raffle):
        """Teste de listagem de rifas ativas"""
        response = client.get('/api/raffles')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'raffles' in data
        assert isinstance(data['raffles'], list)
        assert len(data['raffles']) >= 1
        
        # Verificar dados da rifa
        raffle_data = data['raffles'][0]
        assert 'id' in raffle_data
        assert 'title' in raffle_data
        assert 'sold_numbers' in raffle_data
        assert 'available_numbers' in raffle_data
    
    def test_get_raffle_details(self, client, create_sample_raffle):
        """Teste de detalhes de uma rifa específica"""
        raffle = create_sample_raffle
        
        response = client.get(f'/api/raffles/{raffle.id}')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'raffle' in data
        
        raffle_data = data['raffle']
        assert raffle_data['id'] == raffle.id
        assert raffle_data['title'] == raffle.title
        assert 'sold_numbers' in raffle_data
        assert 'available_numbers' in raffle_data
    
    def test_get_nonexistent_raffle(self, client):
        """Teste de busca por rifa inexistente"""
        response = client.get('/api/raffles/99999')
        
        assert response.status_code == 404
    
    def test_create_raffle(self, client, sample_raffle_data, auth_headers):
        """Teste de criação de rifa"""
        response = client.post('/api/raffles',
                             data=json.dumps(sample_raffle_data),
                             content_type='application/json',
                             headers=auth_headers)

        assert response.status_code == 201
        data = json.loads(response.data)
        assert 'raffle' in data
        assert data['raffle']['title'] == sample_raffle_data['title']
        assert data['raffle']['status'] == 'active'
    
    def test_create_raffle_missing_fields(self, client, auth_headers):
        """Teste de criação de rifa com campos obrigatórios faltando"""
        incomplete_data = {'title': 'Rifa Teste'}

        response = client.post('/api/raffles',
                             data=json.dumps(incomplete_data),
                             content_type='application/json',
                             headers=auth_headers)

        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'error' in data
    
    def test_update_raffle(self, client, create_sample_raffle, auth_headers):
        """Teste de atualização de rifa"""
        raffle = create_sample_raffle

        update_data = {
            'title': 'Rifa Atualizada',
            'description': 'Nova descrição'
        }

        response = client.put(f'/api/raffles/{raffle.id}',
                            data=json.dumps(update_data),
                            content_type='application/json',
                            headers=auth_headers)

        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['raffle']['title'] == 'Rifa Atualizada'
    
    def test_cancel_raffle_without_tickets(self, client, create_sample_raffle, auth_headers):
        """Teste de cancelamento de rifa sem números vendidos"""
        raffle = create_sample_raffle

        response = client.delete(f'/api/raffles/{raffle.id}',
                                headers=auth_headers)

        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'message' in data

        # Verificar se foi cancelada
        from src.models.user import db
        db.session.refresh(raffle)
        assert raffle.status == 'cancelled'
    
    def test_buy_raffle_tickets(self, client, create_sample_raffle, sample_ticket_data):
        """Teste de compra de números da rifa"""
        raffle = create_sample_raffle
        
        response = client.post(f'/api/raffles/{raffle.id}/tickets',
                             data=json.dumps(sample_ticket_data),
                             content_type='application/json')
        
        assert response.status_code == 201
        data = json.loads(response.data)
        assert 'purchase_id' in data
        assert 'total_amount' in data
        assert data['ticket_numbers'] == sample_ticket_data['selected_numbers']
        
        # Verificar se o valor total está correto
        expected_total = len(sample_ticket_data['selected_numbers']) * float(raffle.ticket_price)
        assert data['total_amount'] == expected_total
    
    def test_buy_tickets_invalid_numbers(self, client, create_sample_raffle, sample_ticket_data):
        """Teste de compra com números inválidos"""
        raffle = create_sample_raffle
        sample_ticket_data['selected_numbers'] = [0, 101]  # Fora do range
        
        response = client.post(f'/api/raffles/{raffle.id}/tickets',
                             data=json.dumps(sample_ticket_data),
                             content_type='application/json')
        
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'error' in data
    
    def test_buy_tickets_duplicate_numbers(self, client, create_sample_raffle, sample_ticket_data):
        """Teste de compra com números duplicados"""
        raffle = create_sample_raffle
        sample_ticket_data['selected_numbers'] = [1, 1, 2]  # Número duplicado
        
        response = client.post(f'/api/raffles/{raffle.id}/tickets',
                             data=json.dumps(sample_ticket_data),
                             content_type='application/json')
        
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'error' in data
        assert 'duplicados' in data['error'].lower()
    
    def test_buy_tickets_missing_fields(self, client, create_sample_raffle):
        """Teste de compra com campos obrigatórios faltando"""
        raffle = create_sample_raffle
        incomplete_data = {'buyer_name': 'João'}
        
        response = client.post(f'/api/raffles/{raffle.id}/tickets',
                             data=json.dumps(incomplete_data),
                             content_type='application/json')
        
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'error' in data
    
    def test_buy_tickets_invalid_email(self, client, create_sample_raffle, sample_ticket_data):
        """Teste de compra com email inválido"""
        raffle = create_sample_raffle
        sample_ticket_data['buyer_email'] = 'email_invalido'
        
        response = client.post(f'/api/raffles/{raffle.id}/tickets',
                             data=json.dumps(sample_ticket_data),
                             content_type='application/json')
        
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'error' in data
        assert 'email' in data['error'].lower()
    
    def test_get_raffle_numbers(self, client, create_sample_raffle):
        """Teste de obtenção dos números da rifa"""
        raffle = create_sample_raffle
        
        response = client.get(f'/api/raffles/{raffle.id}/numbers')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'available_numbers' in data
        assert 'sold_numbers' in data
        assert 'reserved_numbers' in data
        assert 'total_numbers' in data
        assert data['total_numbers'] == raffle.total_numbers
    
    def test_get_raffle_tickets_admin(self, client, create_sample_raffle):
        """Teste de listagem de tickets para admin"""
        raffle = create_sample_raffle
        
        response = client.get(f'/api/raffles/{raffle.id}/tickets')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'tickets' in data
        assert 'stats' in data
        assert isinstance(data['tickets'], list)
        assert 'total_numbers' in data['stats']
    
    def test_confirm_ticket_payment(self, client, create_sample_raffle, sample_ticket_data):
        """Teste de confirmação de pagamento de tickets"""
        raffle = create_sample_raffle
        
        # Primeiro comprar os tickets
        response = client.post(f'/api/raffles/{raffle.id}/tickets',
                             data=json.dumps(sample_ticket_data),
                             content_type='application/json')
        
        assert response.status_code == 201
        
        # Confirmar pagamento
        confirmation_data = {
            'ticket_numbers': sample_ticket_data['selected_numbers'],
            'status': 'completed',
            'payment_id': 'RIFAPAY123'
        }
        
        response = client.post(f'/api/raffles/{raffle.id}/tickets/confirm',
                             data=json.dumps(confirmation_data),
                             content_type='application/json')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'tickets' in data
        assert len(data['tickets']) == len(sample_ticket_data['selected_numbers'])
    
    def test_draw_raffle(self, client, create_sample_raffle, sample_ticket_data, auth_headers):
        """Teste de sorteio da rifa"""
        raffle = create_sample_raffle

        # Primeiro comprar e confirmar tickets
        client.post(f'/api/raffles/{raffle.id}/tickets',
                   data=json.dumps(sample_ticket_data),
                   content_type='application/json')

        confirmation_data = {
            'ticket_numbers': sample_ticket_data['selected_numbers'],
            'status': 'completed'
        }
        client.post(f'/api/raffles/{raffle.id}/tickets/confirm',
                   data=json.dumps(confirmation_data),
                   content_type='application/json')

        # Realizar sorteio
        response = client.post(f'/api/raffles/{raffle.id}/draw',
                              headers=auth_headers)

        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'winner' in data
        assert 'number' in data['winner']
        assert data['winner']['number'] in sample_ticket_data['selected_numbers']
    
    def test_draw_raffle_without_tickets(self, client, create_sample_raffle, auth_headers):
        """Teste de sorteio sem números vendidos"""
        raffle = create_sample_raffle

        response = client.post(f'/api/raffles/{raffle.id}/draw',
                              headers=auth_headers)

        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'error' in data
    
    def test_get_raffle_winners(self, client, create_sample_raffle, sample_ticket_data, auth_headers):
        """Teste de obtenção dos ganhadores"""
        raffle = create_sample_raffle

        # Comprar, confirmar e sortear
        client.post(f'/api/raffles/{raffle.id}/tickets',
                   data=json.dumps(sample_ticket_data),
                   content_type='application/json')

        confirmation_data = {
            'ticket_numbers': sample_ticket_data['selected_numbers'],
            'status': 'completed'
        }
        client.post(f'/api/raffles/{raffle.id}/tickets/confirm',
                   data=json.dumps(confirmation_data),
                   content_type='application/json')

        client.post(f'/api/raffles/{raffle.id}/draw',
                   headers=auth_headers)

        # Obter ganhadores
        response = client.get(f'/api/raffles/{raffle.id}/winners',
                             headers=auth_headers)

        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'winner' in data
        assert 'winner_number' in data['winner']
        assert 'winner_name' in data['winner']
    
    def test_get_winners_not_drawn(self, client, create_sample_raffle):
        """Teste de obtenção de ganhadores antes do sorteio"""
        raffle = create_sample_raffle
        
        response = client.get(f'/api/raffles/{raffle.id}/winners')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'message' in data
        assert 'não foi sorteada' in data['message'].lower()