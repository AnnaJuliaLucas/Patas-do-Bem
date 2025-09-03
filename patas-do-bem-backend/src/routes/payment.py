from flask import Blueprint, request, jsonify
from src.services.payment_service import payment_service
from src.models.donation import Donation
from src.models.raffle import RaffleTicket
from src.models.user import db
import uuid

payment_bp = Blueprint('payment', __name__)

@payment_bp.route('/api/payments/pix', methods=['POST'])
def create_pix_payment():
    """Cria pagamento PIX"""
    try:
        data = request.get_json()
        
        # Validar dados obrigatórios
        required_fields = ['amount', 'description', 'payer_email']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'Campo {field} é obrigatório'}), 400
        
        # Criar pagamento PIX
        payment_result = payment_service.create_pix_payment(
            amount=data['amount'],
            description=data['description'],
            payer_email=data['payer_email']
        )
        
        if payment_result['success']:
            # Salvar referência no banco se for doação
            if data.get('type') == 'donation':
                donation = Donation(
                    donor_name=data.get('donor_name'),
                    donor_email=data['payer_email'],
                    donor_phone=data.get('donor_phone'),
                    amount=data['amount'],
                    donation_type=data.get('donation_type', 'one_time'),
                    payment_method='pix',
                    payment_id=payment_result['payment_id'],
                    payment_status='pending'
                )
                db.session.add(donation)
                db.session.commit()
            
            return jsonify({
                'success': True,
                'payment_id': payment_result['payment_id'],
                'qr_code': payment_result['qr_code'],
                'qr_code_base64': payment_result['qr_code_base64'],
                'amount': payment_result['amount'],
                'status': payment_result['status']
            })
        else:
            return jsonify({'error': payment_result['error']}), 400
            
    except Exception as e:
        return jsonify({'error': f'Erro interno: {str(e)}'}), 500

@payment_bp.route('/api/payments/credit-card', methods=['POST'])
def create_credit_card_payment():
    """Cria pagamento com cartão de crédito"""
    try:
        data = request.get_json()
        
        # Validar dados obrigatórios
        required_fields = ['amount', 'description', 'card_token', 'payer_email']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'Campo {field} é obrigatório'}), 400
        
        card_data = {
            'token': data['card_token'],
            'payment_method_id': data.get('payment_method_id', 'visa')
        }
        
        payer_data = {
            'email': data['payer_email'],
            'first_name': data.get('payer_first_name', ''),
            'last_name': data.get('payer_last_name', ''),
            'doc_type': data.get('payer_doc_type', 'CPF'),
            'doc_number': data.get('payer_doc_number', '')
        }
        
        # Criar pagamento
        payment_result = payment_service.create_credit_card_payment(
            amount=data['amount'],
            description=data['description'],
            card_data=card_data,
            payer_data=payer_data,
            installments=data.get('installments', 1)
        )
        
        if payment_result['success']:
            # Salvar referência no banco se for doação
            if data.get('type') == 'donation':
                donation = Donation(
                    donor_name=f"{payer_data['first_name']} {payer_data['last_name']}",
                    donor_email=data['payer_email'],
                    donor_phone=data.get('donor_phone'),
                    amount=data['amount'],
                    donation_type=data.get('donation_type', 'one_time'),
                    payment_method='credit_card',
                    payment_id=payment_result['payment_id'],
                    payment_status=payment_result['status']
                )
                db.session.add(donation)
                db.session.commit()
            
            return jsonify({
                'success': True,
                'payment_id': payment_result['payment_id'],
                'status': payment_result['status'],
                'status_detail': payment_result.get('status_detail'),
                'amount': payment_result['amount']
            })
        else:
            return jsonify({'error': payment_result['error']}), 400
            
    except Exception as e:
        return jsonify({'error': f'Erro interno: {str(e)}'}), 500

@payment_bp.route('/api/payments/recurring', methods=['POST'])
def create_recurring_payment():
    """Cria assinatura recorrente"""
    try:
        data = request.get_json()
        
        # Validar dados obrigatórios
        required_fields = ['amount', 'description', 'card_token', 'payer_email']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'Campo {field} é obrigatório'}), 400
        
        payer_data = {
            'email': data['payer_email'],
            'first_name': data.get('payer_first_name', ''),
            'last_name': data.get('payer_last_name', '')
        }
        
        # Criar assinatura
        subscription_result = payment_service.create_recurring_payment(
            amount=data['amount'],
            description=data['description'],
            payer_data=payer_data,
            card_token=data['card_token'],
            frequency=data.get('frequency', 'monthly')
        )
        
        if subscription_result['success']:
            # Salvar doação recorrente
            donation = Donation(
                donor_name=f"{payer_data['first_name']} {payer_data['last_name']}",
                donor_email=data['payer_email'],
                donor_phone=data.get('donor_phone'),
                amount=data['amount'],
                donation_type='recurring',
                payment_method='credit_card',
                payment_id=subscription_result['subscription_id'],
                payment_status=subscription_result['status']
            )
            db.session.add(donation)
            db.session.commit()
            
            return jsonify({
                'success': True,
                'subscription_id': subscription_result['subscription_id'],
                'status': subscription_result['status'],
                'amount': subscription_result['amount'],
                'next_payment_date': subscription_result.get('next_payment_date')
            })
        else:
            return jsonify({'error': subscription_result['error']}), 400
            
    except Exception as e:
        return jsonify({'error': f'Erro interno: {str(e)}'}), 500

@payment_bp.route('/api/payments/boleto', methods=['POST'])
def create_boleto_payment():
    """Cria pagamento via boleto"""
    try:
        data = request.get_json()
        
        # Validar dados obrigatórios
        required_fields = ['amount', 'description', 'payer_email', 'payer_first_name', 'payer_last_name']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'Campo {field} é obrigatório'}), 400
        
        payer_data = {
            'email': data['payer_email'],
            'first_name': data['payer_first_name'],
            'last_name': data['payer_last_name'],
            'doc_type': data.get('payer_doc_type', 'CPF'),
            'doc_number': data.get('payer_doc_number', ''),
            'zip_code': data.get('payer_zip_code', '36240000'),
            'street_name': data.get('payer_street_name', 'Rua Principal'),
            'street_number': data.get('payer_street_number', '123'),
            'neighborhood': data.get('payer_neighborhood', 'Centro'),
            'city': data.get('payer_city', 'Santos Dumont'),
            'state': data.get('payer_state', 'MG')
        }
        
        # Criar boleto
        payment_result = payment_service.create_boleto_payment(
            amount=data['amount'],
            description=data['description'],
            payer_data=payer_data
        )
        
        if payment_result['success']:
            # Salvar referência no banco se for doação
            if data.get('type') == 'donation':
                donation = Donation(
                    donor_name=f"{payer_data['first_name']} {payer_data['last_name']}",
                    donor_email=data['payer_email'],
                    donor_phone=data.get('donor_phone'),
                    amount=data['amount'],
                    donation_type=data.get('donation_type', 'one_time'),
                    payment_method='boleto',
                    payment_id=payment_result['payment_id'],
                    payment_status='pending'
                )
                db.session.add(donation)
                db.session.commit()
            
            return jsonify({
                'success': True,
                'payment_id': payment_result['payment_id'],
                'boleto_url': payment_result['boleto_url'],
                'barcode': payment_result['barcode'],
                'due_date': payment_result['due_date'],
                'amount': payment_result['amount']
            })
        else:
            return jsonify({'error': payment_result['error']}), 400
            
    except Exception as e:
        return jsonify({'error': f'Erro interno: {str(e)}'}), 500

@payment_bp.route('/api/payments/<payment_id>/status', methods=['GET'])
def get_payment_status(payment_id):
    """Consulta status de um pagamento"""
    try:
        status_result = payment_service.get_payment_status(payment_id)
        
        if status_result['success']:
            # Atualizar status no banco de dados
            donation = Donation.query.filter_by(payment_id=payment_id).first()
            if donation:
                donation.payment_status = status_result['status']
                db.session.commit()
            
            return jsonify({
                'success': True,
                'status': status_result['status'],
                'status_detail': status_result.get('status_detail'),
                'amount': status_result.get('amount')
            })
        else:
            return jsonify({'error': status_result['error']}), 400
            
    except Exception as e:
        return jsonify({'error': f'Erro interno: {str(e)}'}), 500

@payment_bp.route('/api/webhooks/mercadopago', methods=['POST'])
def mercadopago_webhook():
    """Webhook do Mercado Pago"""
    try:
        webhook_data = request.get_json()
        
        # Processar webhook
        result = payment_service.process_webhook(webhook_data)
        
        if result['success'] and result.get('status'):
            # Atualizar status no banco
            payment_id = webhook_data.get('data', {}).get('id')
            if payment_id:
                donation = Donation.query.filter_by(payment_id=str(payment_id)).first()
                if donation:
                    donation.payment_status = result['status']
                    db.session.commit()
        
        return jsonify({'success': True}), 200
        
    except Exception as e:
        print(f"Erro no webhook: {e}")
        return jsonify({'error': 'Erro interno'}), 500

@payment_bp.route('/api/payments/config', methods=['GET'])
def get_payment_config():
    """Retorna configurações de pagamento para o frontend"""
    return jsonify({
        'mercado_pago': {
            'public_key': payment_service.mp_public_key
        },
        'pix': {
            'key': payment_service.pix_key,
            'recipient_name': payment_service.pix_recipient_name
        }
    })

