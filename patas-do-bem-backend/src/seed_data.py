#!/usr/bin/env python3
"""
Script para popular o banco de dados com dados de exemplo
"""
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from datetime import datetime, date
from src.models.user import db, User
from src.models.donation import Donation
from src.models.raffle import Raffle, RaffleTicket
from src.models.contact import ContactMessage
from src.main import app

def seed_database():
    """Popular banco com dados de exemplo"""
    with app.app_context():
        # Limpar dados existentes
        db.drop_all()
        db.create_all()
        
        print("Criando usuário administrador...")
        # Criar usuário admin
        admin_user = User(
            username='admin',
            email='admin@patasdobem.org.br'
        )
        db.session.add(admin_user)
        db.session.commit()
        
        print("Criando doações de exemplo...")
        # Criar doações de exemplo
        donations = [
            Donation(
                donor_name='Maria Silva',
                donor_email='maria@email.com',
                donor_phone='(32) 99999-1111',
                amount=50.00,
                donation_type='recurring',
                payment_method='credit_card',
                payment_status='completed',
                payment_id='PAY001',
                subscription_id='SUB001'
            ),
            Donation(
                donor_name='João Santos',
                donor_email='joao@email.com',
                amount=100.00,
                donation_type='one_time',
                payment_method='pix',
                payment_status='completed',
                payment_id='PAY002'
            ),
            Donation(
                donor_name='Ana Costa',
                donor_email='ana@email.com',
                amount=20.00,
                donation_type='recurring',
                payment_method='credit_card',
                payment_status='completed',
                payment_id='PAY003',
                subscription_id='SUB003'
            )
        ]
        
        for donation in donations:
            db.session.add(donation)
        
        print("Criando rifas de exemplo...")
        # Criar rifas de exemplo
        raffles = [
            Raffle(
                title='Rifa do Bem - Cesta de Natal',
                description='Cesta de Natal completa com produtos especiais para ajudar nossos peludos!',
                image_url='/static/images/rifa_cesta_natal.jpg',
                ticket_price=10.00,
                total_numbers=100,
                draw_date=date(2025, 12, 20),
                status='active',
                created_by=admin_user.id
            ),
            Raffle(
                title='Rifa Solidária - Vale Compras R$ 500',
                description='Vale compras de R$ 500 para usar onde quiser! Toda renda vai para os animais.',
                image_url='/static/images/rifa_vale_compras.jpg',
                ticket_price=5.00,
                total_numbers=200,
                draw_date=date(2025, 10, 15),
                status='active',
                created_by=admin_user.id
            )
        ]
        
        for raffle in raffles:
            db.session.add(raffle)
        
        db.session.commit()
        
        print("Criando tickets de exemplo...")
        # Criar alguns tickets vendidos
        tickets = [
            RaffleTicket(
                raffle_id=1,
                ticket_number=1,
                buyer_name='Carlos Oliveira',
                buyer_email='carlos@email.com',
                buyer_phone='(32) 99999-2222',
                payment_status='completed',
                payment_id='RIFAPAY001',
                purchased_at=datetime.utcnow()
            ),
            RaffleTicket(
                raffle_id=1,
                ticket_number=15,
                buyer_name='Lucia Ferreira',
                buyer_email='lucia@email.com',
                payment_status='completed',
                payment_id='RIFAPAY002',
                purchased_at=datetime.utcnow()
            ),
            RaffleTicket(
                raffle_id=2,
                ticket_number=50,
                buyer_name='Pedro Almeida',
                buyer_email='pedro@email.com',
                payment_status='completed',
                payment_id='RIFAPAY003',
                purchased_at=datetime.utcnow()
            )
        ]
        
        for ticket in tickets:
            db.session.add(ticket)
        
        print("Criando mensagens de contato de exemplo...")
        # Criar mensagens de contato
        messages = [
            ContactMessage(
                name='Roberto Lima',
                email='roberto@email.com',
                phone='(32) 99999-3333',
                subject='Interesse em adoção',
                message='Olá! Gostaria de saber mais sobre o processo de adoção. Tenho interesse em adotar um gatinho.',
                status='new'
            ),
            ContactMessage(
                name='Fernanda Souza',
                email='fernanda@email.com',
                subject='Voluntariado',
                message='Gostaria de me voluntariar para ajudar a ONG. Como posso participar?',
                status='read'
            )
        ]
        
        for message in messages:
            db.session.add(message)
        
        db.session.commit()
        
        print("Banco de dados populado com sucesso!")
        print(f"- {len(donations)} doações criadas")
        print(f"- {len(raffles)} rifas criadas")
        print(f"- {len(tickets)} tickets criados")
        print(f"- {len(messages)} mensagens criadas")
        print("- 1 usuário administrador criado")

if __name__ == '__main__':
    seed_database()

