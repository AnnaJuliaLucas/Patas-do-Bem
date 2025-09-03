from flask import Blueprint, request, jsonify
from datetime import datetime
from src.models.user import db
from src.models.donation import Donation

donation_bp = Blueprint('donation', __name__)

@donation_bp.route('/donations', methods=['POST'])
def create_donation():
    """Criar nova doação (única ou recorrente)"""
    try:
        data = request.get_json()
        
        # Validar dados obrigatórios
        required_fields = ['donor_name', 'donor_email', 'amount', 'donation_type', 'payment_method']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Campo {field} é obrigatório'}), 400
        
        # Criar nova doação
        donation = Donation(
            donor_name=data['donor_name'],
            donor_email=data['donor_email'],
            donor_phone=data.get('donor_phone'),
            amount=data['amount'],
            donation_type=data['donation_type'],
            payment_method=data['payment_method'],
            payment_status='pending'
        )
        
        db.session.add(donation)
        db.session.commit()
        
        # Simular dados de pagamento (em produção, integrar com gateway real)
        payment_data = {
            'donation_id': donation.id,
            'amount': float(donation.amount),
            'payment_method': donation.payment_method,
            'status': 'pending'
        }
        
        if donation.payment_method == 'pix':
            payment_data['pix_code'] = f'PIX{donation.id:06d}'
            payment_data['qr_code'] = f'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
        elif donation.payment_method == 'boleto':
            payment_data['boleto_url'] = f'/api/donations/{donation.id}/boleto'
        elif donation.payment_method == 'credit_card':
            payment_data['card_form_url'] = f'/api/donations/{donation.id}/card-form'
        
        return jsonify(payment_data), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@donation_bp.route('/donations', methods=['GET'])
def list_donations():
    """Listar doações (área administrativa)"""
    try:
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 20, type=int)
        status = request.args.get('status', 'all')
        
        query = Donation.query
        
        if status != 'all':
            query = query.filter(Donation.payment_status == status)
        
        donations = query.order_by(Donation.created_at.desc()).paginate(
            page=page, per_page=limit, error_out=False
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

