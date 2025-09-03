from flask import Blueprint, request, jsonify
from src.models.user import db
from src.models.contact import ContactMessage

contact_bp = Blueprint('contact', __name__)

@contact_bp.route('/contact', methods=['POST'])
def send_contact_message():
    """Enviar mensagem de contato"""
    try:
        data = request.get_json()
        
        # Validar dados obrigatórios
        required_fields = ['name', 'email', 'message']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Campo {field} é obrigatório'}), 400
        
        # Criar nova mensagem
        message = ContactMessage(
            name=data['name'],
            email=data['email'],
            phone=data.get('phone'),
            subject=data.get('subject'),
            message=data['message']
        )
        
        db.session.add(message)
        db.session.commit()
        
        return jsonify({'message': 'Mensagem enviada com sucesso'}), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@contact_bp.route('/contact/messages', methods=['GET'])
def list_contact_messages():
    """Listar mensagens de contato (Admin)"""
    try:
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 20, type=int)
        status = request.args.get('status', 'all')
        
        query = ContactMessage.query
        
        if status != 'all':
            query = query.filter(ContactMessage.status == status)
        
        messages = query.order_by(ContactMessage.created_at.desc()).paginate(
            page=page, per_page=limit, error_out=False
        )
        
        # Contar mensagens não lidas
        unread_count = ContactMessage.query.filter(ContactMessage.status == 'new').count()
        
        return jsonify({
            'messages': [message.to_dict() for message in messages.items],
            'total': messages.total,
            'pages': messages.pages,
            'current_page': page,
            'unread_count': unread_count
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@contact_bp.route('/contact/messages/<int:message_id>', methods=['PUT'])
def update_message_status(message_id):
    """Atualizar status da mensagem (Admin)"""
    try:
        message = ContactMessage.query.get_or_404(message_id)
        data = request.get_json()
        
        if 'status' in data:
            message.status = data['status']
            db.session.commit()
        
        return jsonify({'message': 'Status atualizado', 'contact_message': message.to_dict()})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

