import jwt
import os
from datetime import datetime, timedelta
from functools import wraps
from flask import request, jsonify, current_app
from src.models.admin import Admin

class AuthService:
    """Serviço de autenticação JWT"""
    
    def __init__(self):
        self.secret_key = os.getenv('JWT_SECRET_KEY', 'patas-do-bem-secret-key-2024')
        self.algorithm = 'HS256'
        self.expiration_hours = 24
    
    def generate_token(self, admin):
        """Gerar token JWT para admin"""
        payload = {
            'admin_id': admin.id,
            'username': admin.username,
            'role': admin.role,
            'exp': datetime.utcnow() + timedelta(hours=self.expiration_hours),
            'iat': datetime.utcnow()
        }
        
        token = jwt.encode(payload, self.secret_key, algorithm=self.algorithm)
        return token
    
    def verify_token(self, token):
        """Verificar e decodificar token JWT"""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            return payload
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None
    
    def login(self, username, password):
        """Fazer login do admin"""
        admin = Admin.query.filter_by(username=username, is_active=True).first()
        
        if admin and admin.check_password(password):
            admin.update_last_login()
            token = self.generate_token(admin)
            
            return {
                'success': True,
                'token': token,
                'admin': admin.to_dict(),
                'expires_in': self.expiration_hours * 3600  # seconds
            }
        
        return {
            'success': False,
            'message': 'Credenciais inválidas'
        }
    
    def get_admin_from_token(self, token):
        """Obter admin a partir do token"""
        payload = self.verify_token(token)
        if payload:
            admin = Admin.query.get(payload['admin_id'])
            if admin and admin.is_active:
                return admin
        return None

# Instância global
auth_service = AuthService()

def token_required(f):
    """Decorator para rotas que requerem autenticação"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Buscar token no header Authorization
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(' ')[1]  # Bearer <token>
            except IndexError:
                return jsonify({'error': 'Token mal formatado'}), 401
        
        if not token:
            return jsonify({'error': 'Token de acesso requerido'}), 401
        
        # Verificar token
        current_admin = auth_service.get_admin_from_token(token)
        if not current_admin:
            return jsonify({'error': 'Token inválido ou expirado'}), 401
        
        # Adicionar admin ao contexto da requisição
        request.current_admin = current_admin
        
        return f(*args, **kwargs)
    
    return decorated

def admin_required(f):
    """Decorator para rotas que requerem nível admin"""
    @wraps(f)
    def decorated(*args, **kwargs):
        if not hasattr(request, 'current_admin'):
            return jsonify({'error': 'Autenticação requerida'}), 401
        
        if request.current_admin.role != 'admin':
            return jsonify({'error': 'Acesso negado. Permissão de administrador requerida.'}), 403
        
        return f(*args, **kwargs)
    
    return decorated