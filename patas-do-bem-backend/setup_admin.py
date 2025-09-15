#!/usr/bin/env python3
"""
Script para criar o primeiro administrador do sistema
"""

import os
import sys
sys.path.insert(0, os.path.dirname(__file__))

from src.models.user import db
from src.models.admin import Admin
from src.main import app

def create_admin():
    """Criar primeiro administrador"""
    with app.app_context():
        # Verificar se já existe algum admin
        if Admin.query.count() > 0:
            print("❌ Administrador já existe no sistema!")
            return
        
        print("🔐 Setup do Primeiro Administrador - Patas do Bem")
        print("=" * 50)
        
        username = input("Username: ").strip()
        if len(username) < 3:
            print("❌ Username deve ter pelo menos 3 caracteres!")
            return
        
        email = input("Email: ").strip()
        if '@' not in email:
            print("❌ Email inválido!")
            return
        
        password = input("Senha (mín. 6 chars): ").strip()
        if len(password) < 6:
            print("❌ Senha deve ter pelo menos 6 caracteres!")
            return
        
        try:
            # Criar admin
            admin = Admin(
                username=username,
                email=email,
                role='admin'
            )
            admin.set_password(password)
            
            db.session.add(admin)
            db.session.commit()
            
            print("\n✅ Administrador criado com sucesso!")
            print(f"👤 Username: {username}")
            print(f"📧 Email: {email}")
            print(f"🔑 Role: admin")
            print("\n🚀 Agora você pode fazer login no sistema!")
            print("📍 Endpoint: POST /api/auth/login")
            
        except Exception as e:
            print(f"❌ Erro ao criar administrador: {e}")
            db.session.rollback()

if __name__ == '__main__':
    create_admin()