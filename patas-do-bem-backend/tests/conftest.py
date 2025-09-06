import pytest
import os
import tempfile
from src.main import app
from src.models.user import db
from src.models.donation import Donation
from src.models.raffle import Raffle, RaffleTicket
from src.models.contact import ContactMessage

@pytest.fixture
def client():
    """Cria um cliente de teste Flask"""
    # Criar banco temporário
    db_fd, app.config['DATABASE'] = tempfile.mkstemp()
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    app.config['WTF_CSRF_ENABLED'] = False
    
    with app.test_client() as client:
        with app.app_context():
            db.create_all()
            yield client
            db.drop_all()
    
    os.close(db_fd)
    os.unlink(app.config['DATABASE'])

@pytest.fixture
def sample_donation_data():
    """Dados de exemplo para testes de doação"""
    return {
        'donor_name': 'João Silva',
        'donor_email': 'joao@example.com',
        'donor_phone': '(32) 99999-9999',
        'amount': 50.0,
        'donation_type': 'one_time',
        'payment_method': 'pix'
    }

@pytest.fixture
def sample_raffle_data():
    """Dados de exemplo para testes de rifa"""
    return {
        'title': 'Rifa Beneficente',
        'description': 'Ajude nossos animais',
        'ticket_price': 10.0,
        'total_numbers': 100,
        'draw_date': '2024-12-31'
    }

@pytest.fixture
def sample_ticket_data():
    """Dados de exemplo para compra de números"""
    return {
        'buyer_name': 'Maria Santos',
        'buyer_email': 'maria@example.com',
        'buyer_phone': '(32) 88888-8888',
        'selected_numbers': [1, 5, 10],
        'payment_method': 'pix'
    }

@pytest.fixture
def sample_contact_data():
    """Dados de exemplo para contato"""
    return {
        'name': 'Ana Costa',
        'email': 'ana@example.com',
        'phone': '(32) 77777-7777',
        'subject': 'Dúvida sobre adoção',
        'message': 'Gostaria de informações sobre o processo de adoção.'
    }

@pytest.fixture
def create_sample_donation(client, sample_donation_data):
    """Cria uma doação de exemplo no banco de dados"""
    donation = Donation(**sample_donation_data)
    db.session.add(donation)
    db.session.commit()
    return donation

@pytest.fixture
def create_sample_raffle(client, sample_raffle_data):
    """Cria uma rifa de exemplo no banco de dados"""
    from datetime import datetime
    raffle_data = sample_raffle_data.copy()
    raffle_data['draw_date'] = datetime.strptime(raffle_data['draw_date'], '%Y-%m-%d').date()
    raffle_data['created_by'] = 1
    
    raffle = Raffle(**raffle_data)
    db.session.add(raffle)
    db.session.commit()
    return raffle