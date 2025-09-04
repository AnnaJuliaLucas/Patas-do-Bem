from flask import Blueprint, request, jsonify
from datetime import datetime
from src.models.user import db
from src.models.raffle import Raffle, RaffleTicket

raffle_bp = Blueprint('raffle', __name__)

@raffle_bp.route('/raffles', methods=['GET'])
def list_raffles():
    """Listar rifas ativas (público)"""
    try:
        raffles = Raffle.query.filter(Raffle.status == 'active').order_by(Raffle.created_at.desc()).all()
        
        raffles_data = []
        for raffle in raffles:
            raffle_dict = raffle.to_dict()
            # Adicionar contagem de números vendidos
            sold_count = RaffleTicket.query.filter(
                RaffleTicket.raffle_id == raffle.id,
                RaffleTicket.payment_status == 'completed'
            ).count()
            raffle_dict['sold_numbers'] = sold_count
            raffle_dict['available_numbers'] = raffle.total_numbers - sold_count
            raffles_data.append(raffle_dict)
        
        return jsonify({'raffles': raffles_data})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@raffle_bp.route('/raffles/<int:raffle_id>', methods=['GET'])
def get_raffle(raffle_id):
    """Detalhes de uma rifa específica"""
    try:
        raffle = Raffle.query.get_or_404(raffle_id)
        
        # Números vendidos
        sold_tickets = RaffleTicket.query.filter(
            RaffleTicket.raffle_id == raffle_id,
            RaffleTicket.payment_status == 'completed'
        ).all()
        
        sold_numbers = [ticket.ticket_number for ticket in sold_tickets]
        available_numbers = [i for i in range(1, raffle.total_numbers + 1) if i not in sold_numbers]
        
        raffle_data = raffle.to_dict()
        raffle_data['sold_numbers'] = sold_numbers
        raffle_data['available_numbers'] = available_numbers
        
        return jsonify({'raffle': raffle_data})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@raffle_bp.route('/raffles', methods=['POST'])
def create_raffle():
    """Criar nova rifa (Admin)"""
    try:
        data = request.get_json()
        
        # Validar dados obrigatórios
        required_fields = ['title', 'ticket_price', 'total_numbers']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Campo {field} é obrigatório'}), 400
        
        # Criar nova rifa
        raffle = Raffle(
            title=data['title'],
            description=data.get('description'),
            image_url=data.get('image_url'),
            ticket_price=data['ticket_price'],
            total_numbers=data['total_numbers'],
            draw_date=datetime.strptime(data['draw_date'], '%Y-%m-%d').date() if data.get('draw_date') else None,
            created_by=1  # Por enquanto, usuário fixo
        )
        
        db.session.add(raffle)
        db.session.commit()
        
        return jsonify({'message': 'Rifa criada com sucesso', 'raffle': raffle.to_dict()}), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@raffle_bp.route('/raffles/<int:raffle_id>', methods=['PUT'])
def update_raffle(raffle_id):
    """Atualizar rifa (Admin)"""
    try:
        raffle = Raffle.query.get_or_404(raffle_id)
        data = request.get_json()
        
        # Atualizar campos permitidos
        allowed_fields = ['title', 'description', 'image_url', 'ticket_price', 'draw_date', 'status']
        for field in allowed_fields:
            if field in data:
                if field == 'draw_date' and data[field]:
                    setattr(raffle, field, datetime.strptime(data[field], '%Y-%m-%d').date())
                else:
                    setattr(raffle, field, data[field])
        
        raffle.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({'message': 'Rifa atualizada com sucesso', 'raffle': raffle.to_dict()})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@raffle_bp.route('/raffles/<int:raffle_id>', methods=['DELETE'])
def cancel_raffle(raffle_id):
    """Cancelar rifa (Admin)"""
    try:
        raffle = Raffle.query.get_or_404(raffle_id)
        
        # Verificar se há números vendidos
        sold_tickets = RaffleTicket.query.filter(
            RaffleTicket.raffle_id == raffle_id,
            RaffleTicket.payment_status == 'completed'
        ).count()
        
        if sold_tickets > 0:
            return jsonify({'error': 'Não é possível cancelar rifa com números já vendidos'}), 400
        
        raffle.status = 'cancelled'
        raffle.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({'message': 'Rifa cancelada com sucesso'})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@raffle_bp.route('/raffles/<int:raffle_id>/tickets', methods=['GET'])
def get_raffle_tickets(raffle_id):
    """Listar participantes da rifa (Admin)"""
    try:
        raffle = Raffle.query.get_or_404(raffle_id)
        
        tickets = RaffleTicket.query.filter(RaffleTicket.raffle_id == raffle_id).all()
        
        # Estatísticas
        total_sold = len([t for t in tickets if t.payment_status == 'completed'])
        total_pending = len([t for t in tickets if t.payment_status == 'pending'])
        total_revenue = sum([raffle.ticket_price for t in tickets if t.payment_status == 'completed'])
        
        stats = {
            'total_numbers': raffle.total_numbers,
            'sold_numbers': total_sold,
            'pending_numbers': total_pending,
            'available_numbers': raffle.total_numbers - total_sold - total_pending,
            'total_revenue': float(total_revenue)
        }
        
        return jsonify({
            'tickets': [ticket.to_dict() for ticket in tickets],
            'stats': stats
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@raffle_bp.route('/raffles/<int:raffle_id>/tickets', methods=['POST'])
def buy_raffle_tickets(raffle_id):
    """Comprar números da rifa"""
    try:
        data = request.get_json()
        
        raffle = Raffle.query.get_or_404(raffle_id)
        
        if raffle.status != 'active':
            return jsonify({'error': 'Rifa não está ativa'}), 400
        
        # Validar dados obrigatórios
        required_fields = ['buyer_name', 'buyer_email', 'selected_numbers', 'payment_method']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({'error': f'Campo {field} é obrigatório'}), 400
        
        # Validar email
        import re
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, data['buyer_email']):
            return jsonify({'error': 'Formato de email inválido'}), 400
        
        ticket_numbers = data['selected_numbers']
        
        # Validar se é uma lista
        if not isinstance(ticket_numbers, list):
            return jsonify({'error': 'selected_numbers deve ser uma lista'}), 400
        
        # Validar se há números
        if len(ticket_numbers) == 0:
            return jsonify({'error': 'Deve selecionar pelo menos um número'}), 400
        
        # Validar números duplicados
        if len(ticket_numbers) != len(set(ticket_numbers)):
            return jsonify({'error': 'Números duplicados não são permitidos'}), 400
        
        # Verificar se os números estão disponíveis
        existing_tickets = RaffleTicket.query.filter(
            RaffleTicket.raffle_id == raffle_id,
            RaffleTicket.ticket_number.in_(ticket_numbers)
        ).all()
        
        if existing_tickets:
            unavailable = [t.ticket_number for t in existing_tickets]
            return jsonify({'error': f'Números já reservados: {unavailable}'}), 400
        
        # Criar tickets
        tickets = []
        for number in ticket_numbers:
            if number < 1 or number > raffle.total_numbers:
                return jsonify({'error': f'Número {number} inválido'}), 400
            
            ticket = RaffleTicket(
                raffle_id=raffle_id,
                ticket_number=number,
                buyer_name=data['buyer_name'],
                buyer_email=data['buyer_email'],
                buyer_phone=data.get('buyer_phone'),
                payment_status='pending'
            )
            tickets.append(ticket)
            db.session.add(ticket)
        
        db.session.commit()
        
        # Calcular total
        total_amount = len(ticket_numbers) * raffle.ticket_price
        
        # Simular dados de pagamento
        payment_data = {
            'purchase_id': f'RAFFLE{raffle_id}_{tickets[0].id}',
            'raffle_id': raffle_id,
            'ticket_numbers': ticket_numbers,
            'total_amount': float(total_amount),
            'payment_method': data['payment_method'],
            'status': 'pending'
        }
        
        if data['payment_method'] == 'pix':
            payment_data['pix_code'] = f'RIFAPIX{raffle_id}{tickets[0].id}'
            payment_data['qr_code'] = f'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
        
        return jsonify(payment_data), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@raffle_bp.route('/raffles/<int:raffle_id>/tickets/confirm', methods=['POST'])
def confirm_ticket_payment(raffle_id):
    """Confirmar pagamento de números da rifa"""
    try:
        data = request.get_json()
        ticket_numbers = data.get('ticket_numbers', [])
        payment_status = data.get('status', 'completed')
        
        tickets = RaffleTicket.query.filter(
            RaffleTicket.raffle_id == raffle_id,
            RaffleTicket.ticket_number.in_(ticket_numbers)
        ).all()
        
        for ticket in tickets:
            ticket.payment_status = payment_status
            ticket.payment_id = data.get('payment_id', f'RIFAPAY{ticket.id}')
            if payment_status == 'completed':
                ticket.purchased_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({'message': 'Pagamento confirmado', 'tickets': [t.to_dict() for t in tickets]})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@raffle_bp.route('/raffles/<int:raffle_id>/numbers', methods=['GET'])
def get_raffle_numbers(raffle_id):
    """Obter números disponíveis e vendidos da rifa"""
    try:
        raffle = Raffle.query.get_or_404(raffle_id)
        
        # Números vendidos (pagamentos confirmados)
        sold_tickets = RaffleTicket.query.filter(
            RaffleTicket.raffle_id == raffle_id,
            RaffleTicket.payment_status == 'completed'
        ).all()
        
        # Números reservados (pagamentos pendentes)
        reserved_tickets = RaffleTicket.query.filter(
            RaffleTicket.raffle_id == raffle_id,
            RaffleTicket.payment_status == 'pending'
        ).all()
        
        sold_numbers = [ticket.ticket_number for ticket in sold_tickets]
        reserved_numbers = [ticket.ticket_number for ticket in reserved_tickets]
        all_unavailable = set(sold_numbers + reserved_numbers)
        
        available_numbers = [i for i in range(1, raffle.total_numbers + 1) if i not in all_unavailable]
        
        return jsonify({
            'available_numbers': available_numbers,
            'sold_numbers': sold_numbers,
            'reserved_numbers': reserved_numbers,
            'total_numbers': raffle.total_numbers
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@raffle_bp.route('/raffles/<int:raffle_id>/draw', methods=['POST'])
def draw_raffle(raffle_id):
    """Realizar sorteio da rifa (Admin)"""
    try:
        import random
        
        raffle = Raffle.query.get_or_404(raffle_id)
        
        if raffle.status != 'active':
            return jsonify({'error': 'Rifa não está ativa para sorteio'}), 400
        
        # Obter todos os números vendidos
        sold_tickets = RaffleTicket.query.filter(
            RaffleTicket.raffle_id == raffle_id,
            RaffleTicket.payment_status == 'completed'
        ).all()
        
        if not sold_tickets:
            return jsonify({'error': 'Nenhum número foi vendido para esta rifa'}), 400
        
        # Sortear um número aleatório entre os vendidos
        winning_ticket = random.choice(sold_tickets)
        
        # Atualizar rifa com o resultado
        raffle.status = 'completed'
        raffle.winner_number = winning_ticket.ticket_number
        raffle.winner_name = winning_ticket.buyer_name
        raffle.winner_email = winning_ticket.buyer_email
        raffle.drawn_at = datetime.utcnow()
        raffle.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Sorteio realizado com sucesso',
            'winner': {
                'number': winning_ticket.ticket_number,
                'name': winning_ticket.buyer_name,
                'email': winning_ticket.buyer_email
            },
            'drawn_at': raffle.drawn_at.isoformat()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@raffle_bp.route('/raffles/<int:raffle_id>/winners', methods=['GET'])
def get_raffle_winners(raffle_id):
    """Obter ganhadores da rifa"""
    try:
        raffle = Raffle.query.get_or_404(raffle_id)
        
        if raffle.status != 'completed' or not raffle.winner_number:
            return jsonify({'message': 'Rifa ainda não foi sorteada'})
        
        winner_data = {
            'raffle_id': raffle_id,
            'raffle_title': raffle.title,
            'winner_number': raffle.winner_number,
            'winner_name': raffle.winner_name,
            'drawn_at': raffle.drawn_at.isoformat() if raffle.drawn_at else None,
            'prize_description': raffle.description
        }
        
        return jsonify({'winner': winner_data})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

