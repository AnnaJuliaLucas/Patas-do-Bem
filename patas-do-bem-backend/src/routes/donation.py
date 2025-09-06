from flask import Blueprint, request, jsonify
from datetime import datetime
from src.models.user import db
from src.models.donation import Donation
from src.services.payment_factory import get_payment_gateway
from src.services.payment_gateway import PaymentMethod

donation_bp = Blueprint('donation', __name__)

@donation_bp.route('/donations', methods=['POST'])
def create_donation():
    """Criar nova doação (única ou recorrente)"""
    try:
        data = request.get_json()
        
        # Validar dados obrigatórios
        required_fields = ['donor_name', 'donor_email', 'amount', 'donation_type', 'payment_method']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({'error': f'Campo {field} é obrigatório'}), 400
        
        # Validar email
        import re
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, data['donor_email']):
            return jsonify({'error': 'Formato de email inválido'}), 400
        
        # Validar valor positivo
        try:
            amount = float(data['amount'])
            if amount <= 0:
                return jsonify({'error': 'Valor deve ser positivo'}), 400
        except (ValueError, TypeError):
            return jsonify({'error': 'Valor inválido'}), 400
        
        # Validar tipo de doação
        valid_types = ['one_time', 'recurring']
        if data['donation_type'] not in valid_types:
            return jsonify({'error': 'Tipo de doação inválido'}), 400
        
        # Validar método de pagamento
        valid_methods = ['pix', 'credit_card', 'boleto']
        if data['payment_method'] not in valid_methods:
            return jsonify({'error': 'Método de pagamento inválido'}), 400
        
        # Criar nova doação
        donation = Donation(
            donor_name=data['donor_name'],
            donor_email=data['donor_email'],
            donor_phone=data.get('donor_phone'),
            amount=amount,
            donation_type=data['donation_type'],
            payment_method=data['payment_method'],
            payment_status='pending'
        )
        
        db.session.add(donation)
        db.session.commit()
        
        # Usar gateway de pagamento
        gateway = get_payment_gateway()
        
        # Preparar dados para o gateway
        gateway_data = {
            'amount': amount,
            'payment_method': data['payment_method'],
            'payer_name': data['donor_name'],
            'payer_email': data['donor_email'],
            'payer_phone': data.get('donor_phone', ''),
            'description': f'Doação {donation.donation_type} - Patas do Bem'
        }
        
        if data['donation_type'] == 'recurring':
            # Criar assinatura recorrente
            payment_result = gateway.create_subscription(gateway_data)
        else:
            # Criar pagamento único
            payment_result = gateway.create_payment(gateway_data)
        
        if not payment_result['success']:
            # Rollback da doação se pagamento falhar
            db.session.delete(donation)
            db.session.commit()
            return jsonify({'error': payment_result['message']}), 400
        
        # Atualizar doação com ID do pagamento
        donation.payment_id = payment_result['payment_id']
        if 'subscription_id' in payment_result.get('data', {}):
            donation.subscription_id = payment_result['data']['subscription_id']
        
        db.session.commit()
        
        # Preparar resposta
        response_data = {
            'donation_id': donation.id,
            'payment_id': payment_result['payment_id'],
            'amount': float(donation.amount),
            'payment_method': donation.payment_method,
            'status': payment_result['status']
        }
        
        # Adicionar dados específicos do método de pagamento
        if payment_result.get('data'):
            response_data.update(payment_result['data'])
        
        return jsonify(response_data), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@donation_bp.route('/donations', methods=['GET'])
def list_donations():
    """Listar doações (área administrativa)"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', request.args.get('limit', 20), type=int)
        status = request.args.get('status', 'all')
        donation_type = request.args.get('type', 'all')
        
        query = Donation.query
        
        if status != 'all':
            query = query.filter(Donation.payment_status == status)
        
        if donation_type != 'all':
            query = query.filter(Donation.donation_type == donation_type)
        
        donations = query.order_by(Donation.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'donations': [donation.to_dict() for donation in donations.items],
            'total': donations.total,
            'pages': donations.pages,
            'current_page': page
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@donation_bp.route('/donations/stats', methods=['GET'])
def donation_stats():
    """Estatísticas de doações"""
    try:
        # Total arrecadado
        total_amount = db.session.query(db.func.sum(Donation.amount)).filter(
            Donation.payment_status == 'completed'
        ).scalar() or 0
        
        # Doações recorrentes mensais
        monthly_recurring = db.session.query(db.func.sum(Donation.amount)).filter(
            Donation.donation_type == 'recurring',
            Donation.payment_status == 'completed'
        ).scalar() or 0
        
        # Total de doadores únicos
        total_donors = db.session.query(db.func.count(db.distinct(Donation.donor_email))).filter(
            Donation.payment_status == 'completed'
        ).scalar() or 0
        
        # Doações recentes
        recent_donations = Donation.query.filter(
            Donation.payment_status == 'completed'
        ).order_by(Donation.created_at.desc()).limit(5).all()
        
        return jsonify({
            'total_amount': float(total_amount),
            'monthly_recurring': float(monthly_recurring),
            'total_donors': total_donors,
            'recent_donations': [donation.to_dict() for donation in recent_donations]
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@donation_bp.route('/donations/<int:donation_id>/confirm', methods=['POST'])
def confirm_payment(donation_id):
    """Confirmar pagamento de doação (webhook simulado)"""
    try:
        donation = Donation.query.get_or_404(donation_id)
        
        data = request.get_json()
        payment_status = data.get('status', 'completed')
        
        donation.payment_status = payment_status
        donation.payment_id = data.get('payment_id', f'PAY{donation_id:06d}')
        donation.updated_at = datetime.utcnow()
        
        if payment_status == 'completed' and donation.donation_type == 'recurring':
            donation.subscription_id = data.get('subscription_id', f'SUB{donation_id:06d}')
        
        db.session.commit()
        
        return jsonify({'message': 'Pagamento confirmado', 'donation': donation.to_dict()})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@donation_bp.route('/donations/history', methods=['GET'])
def donation_history():
    """Histórico público de doações (anonimizado)"""
    try:
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 10, type=int)
        
        donations = Donation.query.filter(
            Donation.payment_status == 'completed'
        ).order_by(Donation.created_at.desc()).paginate(
            page=page, per_page=limit, error_out=False
        )
        
        # Anonimizar dados para exibição pública
        history = []
        for donation in donations.items:
            history.append({
                'amount': float(donation.amount),
                'donation_type': donation.donation_type,
                'date': donation.created_at.isoformat(),
                'donor_name': donation.donor_name[0] + '***' if donation.donor_name else 'Anônimo'
            })
        
        return jsonify({
            'donations': history,
            'total': donations.total,
            'pages': donations.pages,
            'current_page': page
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@donation_bp.route('/donations/<int:donation_id>/cancel', methods=['PUT'])
def cancel_donation(donation_id):
    """Cancelar doação"""
    try:
        donation = Donation.query.get_or_404(donation_id)
        
        if donation.payment_status in ['completed', 'cancelled']:
            return jsonify({'error': 'Não é possível cancelar esta doação'}), 400
        
        donation.payment_status = 'cancelled'
        donation.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({'message': 'Doação cancelada com sucesso'})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

