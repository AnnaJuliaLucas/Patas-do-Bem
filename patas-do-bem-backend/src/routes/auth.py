from flask import Blueprint, request, jsonify
from src.models.admin import Admin
from src.models.user import db
from src.services.auth_service import auth_service, token_required

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/auth/login', methods=['POST'])
def login():
    """Login do administrador"""
    try:
        data = request.get_json()
        
        if not data or not data.get('username') or not data.get('password'):
            return jsonify({'error': 'Username e password são obrigatórios'}), 400
        
        result = auth_service.login(data['username'], data['password'])
        
        if result['success']:
            return jsonify({
                'message': 'Login realizado com sucesso',
                'token': result['token'],
                'admin': result['admin'],
                'expires_in': result['expires_in']
            }), 200
        else:
            return jsonify({'error': result['message']}), 401
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/auth/logout', methods=['POST'])
@token_required
def logout():
    """Logout do administrador"""
    # Com JWT, o logout é apenas client-side (remover token)
    return jsonify({'message': 'Logout realizado com sucesso'}), 200

@auth_bp.route('/auth/me', methods=['GET'])
@token_required
def get_current_admin():
    """Obter informações do admin atual"""
    try:
        return jsonify({
            'admin': request.current_admin.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/auth/refresh', methods=['POST'])
@token_required
def refresh_token():
    """Renovar token JWT"""
    try:
        new_token = auth_service.generate_token(request.current_admin)
        
        return jsonify({
            'message': 'Token renovado com sucesso',
            'token': new_token,
            'expires_in': auth_service.expiration_hours * 3600
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/auth/change-password', methods=['POST'])
@token_required
def change_password():
    """Alterar senha do admin atual"""
    try:
        data = request.get_json()
        
        if not data or not data.get('current_password') or not data.get('new_password'):
            return jsonify({'error': 'Senha atual e nova senha são obrigatórias'}), 400
        
        admin = request.current_admin
        
        # Verificar senha atual
        if not admin.check_password(data['current_password']):
            return jsonify({'error': 'Senha atual incorreta'}), 401
        
        # Validar nova senha
        if len(data['new_password']) < 6:
            return jsonify({'error': 'Nova senha deve ter pelo menos 6 caracteres'}), 400
        
        # Alterar senha
        admin.set_password(data['new_password'])
        db.session.commit()
        
        return jsonify({'message': 'Senha alterada com sucesso'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Rota para criar primeiro admin (apenas para desenvolvimento)
@auth_bp.route('/auth/setup-admin', methods=['POST'])
def setup_admin():
    """Criar primeiro administrador (apenas se não existir nenhum)"""
    try:
        # Verificar se já existe algum admin
        if Admin.query.count() > 0:
            return jsonify({'error': 'Administrador já existe'}), 400
        
        data = request.get_json()
        
        if not data or not data.get('username') or not data.get('password') or not data.get('email'):
            return jsonify({'error': 'Username, password e email são obrigatórios'}), 400
        
        # Validações
        if len(data['username']) < 3:
            return jsonify({'error': 'Username deve ter pelo menos 3 caracteres'}), 400
        
        if len(data['password']) < 6:
            return jsonify({'error': 'Password deve ter pelo menos 6 caracteres'}), 400
        
        # Criar admin
        admin = Admin(
            username=data['username'],
            email=data['email'],
            role='admin'
        )
        admin.set_password(data['password'])
        
        db.session.add(admin)
        db.session.commit()
        
        return jsonify({
            'message': 'Administrador criado com sucesso',
            'admin': admin.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500