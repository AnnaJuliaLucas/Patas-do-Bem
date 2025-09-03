from flask import Blueprint, request, jsonify
from src.models.user import db
from src.models.donation import Donation
from src.models.raffle import Raffle, RaffleTicket
from src.models.contact import ContactMessage

config_bp = Blueprint('config', __name__)

@config_bp.route('/config', methods=['GET'])
def get_public_config():
    """Configurações públicas do site"""
    try:
        config = {
            'organization_name': 'Associação Patas do Bem - Proteção Animal de Santos Dumont/MG',
            'social_links': {
                'instagram': 'https://instagram.com/patasdobem',
                'facebook': 'https://facebook.com/patasdobem',
                'tiktok': 'https://tiktok.com/@patasdobem',
                'whatsapp': 'https://wa.me/5532999999999'
            },
            'contact_info': {
                'email': 'contato@patasdobem.org.br',
                'phone': '(32) 99999-9999',
                'address': 'Santos Dumont, MG'
            },
            'donation_plans': [
                {
                    'id': 'plan_20',
                    'name': 'Apoiador',
                    'amount': 20.00,
                    'description': 'Ajude com R$ 20 mensais'
                },
                {
                    'id': 'plan_50',
                    'name': 'Protetor',
                    'amount': 50.00,
                    'description': 'Ajude com R$ 50 mensais'
                },
                {
                    'id': 'plan_100',
                    'name': 'Guardião',
                    'amount': 100.00,
                    'description': 'Ajude com R$ 100 mensais'
                }
            ],
            'about': {
                'mission': 'Proteger e cuidar de animais em situação de vulnerabilidade, promovendo adoções responsáveis e conscientização sobre bem-estar animal.',
                'history': 'Há 10 anos atuando em Santos Dumont/MG, iniciamos com o Projeto Castra Cat e hoje somos uma ONG consolidada.',
                'activities': [
                    'Castrações gratuitas',
                    'Resgates de animais',
                    'Adoções responsáveis',
                    'Campanhas de conscientização',
                    'Parcerias com veterinários',
                    'Eventos beneficentes'
                ]
            }
        }
        
        return jsonify(config)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@config_bp.route('/dashboard', methods=['GET'])
def get_dashboard_data():
    """Dados do dashboard administrativo"""
    try:
        # Estatísticas de doações
        total_donations = db.session.query(db.func.sum(Donation.amount)).filter(
            Donation.payment_status == 'completed'
        ).scalar() or 0
        
        monthly_recurring = db.session.query(db.func.sum(Donation.amount)).filter(
            Donation.donation_type == 'recurring',
            Donation.payment_status == 'completed'
        ).scalar() or 0
        
        total_donors = db.session.query(db.func.count(db.distinct(Donation.donor_email))).filter(
            Donation.payment_status == 'completed'
        ).scalar() or 0
        
        # Estatísticas de rifas
        active_raffles = Raffle.query.filter(Raffle.status == 'active').count()
        
        total_raffle_revenue = db.session.query(
            db.func.sum(Raffle.ticket_price * db.func.count(RaffleTicket.id))
        ).join(RaffleTicket).filter(
            RaffleTicket.payment_status == 'completed'
        ).scalar() or 0
        
        # Mensagens não lidas
        unread_messages = ContactMessage.query.filter(ContactMessage.status == 'new').count()
        
        # Atividades recentes
        recent_donations = Donation.query.filter(
            Donation.payment_status == 'completed'
        ).order_by(Donation.created_at.desc()).limit(5).all()
        
        recent_messages = ContactMessage.query.order_by(
            ContactMessage.created_at.desc()
        ).limit(3).all()
        
        # Ações pendentes
        pending_actions = []
        
        if unread_messages > 0:
            pending_actions.append({
                'type': 'messages',
                'count': unread_messages,
                'description': f'{unread_messages} mensagem(ns) não lida(s)'
            })
        
        pending_donations = Donation.query.filter(Donation.payment_status == 'pending').count()
        if pending_donations > 0:
            pending_actions.append({
                'type': 'donations',
                'count': pending_donations,
                'description': f'{pending_donations} doação(ões) pendente(s)'
            })
        
        dashboard_data = {
            'donations_summary': {
                'total_amount': float(total_donations),
                'monthly_recurring': float(monthly_recurring),
                'total_donors': total_donors
            },
            'raffles_summary': {
                'active_raffles': active_raffles,
                'total_revenue': float(total_raffle_revenue)
            },
            'recent_activity': [
                {
                    'type': 'donation',
                    'description': f'Doação de R$ {donation.amount} por {donation.donor_name}',
                    'date': donation.created_at.isoformat()
                }
                for donation in recent_donations
            ] + [
                {
                    'type': 'message',
                    'description': f'Nova mensagem de {message.name}',
                    'date': message.created_at.isoformat()
                }
                for message in recent_messages
            ],
            'pending_actions': pending_actions
        }
        
        # Ordenar atividades recentes por data
        dashboard_data['recent_activity'].sort(key=lambda x: x['date'], reverse=True)
        dashboard_data['recent_activity'] = dashboard_data['recent_activity'][:10]
        
        return jsonify(dashboard_data)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

