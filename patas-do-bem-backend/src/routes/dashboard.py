from flask import Blueprint, jsonify, request
from sqlalchemy import func, desc
from datetime import datetime, timedelta
from src.models.user import db
from src.models.donation import Donation
from src.models.raffle import Raffle, RaffleTicket
from src.models.contact import ContactMessage
from src.services.auth_service import token_required, admin_required

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/dashboard', methods=['GET'])
@token_required
@admin_required
def get_dashboard_data():
    """Get dashboard statistics and data"""
    try:
        # Donations summary
        total_donations = db.session.query(func.count(Donation.id)).scalar() or 0
        total_amount = db.session.query(func.sum(Donation.amount)).scalar() or 0.0
        
        # Monthly recurring donations
        monthly_recurring = db.session.query(func.sum(Donation.amount)).filter(
            Donation.donation_type == 'recurring',
            Donation.payment_status == 'completed'
        ).scalar() or 0.0
        
        # Total unique donors
        total_donors = db.session.query(func.count(func.distinct(Donation.donor_email))).scalar() or 0
        
        # Raffles summary
        active_raffles = db.session.query(func.count(Raffle.id)).filter(
            Raffle.status == 'active'
        ).scalar() or 0
        
        total_raffles = db.session.query(func.count(Raffle.id)).scalar() or 0
        
        # Contact messages summary
        total_messages = db.session.query(func.count(ContactMessage.id)).scalar() or 0
        unread_messages = db.session.query(func.count(ContactMessage.id)).filter(
            ContactMessage.status == 'new'
        ).scalar() or 0
        
        # Recent activity (last 30 days)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        
        recent_donations = db.session.query(Donation).filter(
            Donation.created_at >= thirty_days_ago,
            Donation.payment_status == 'completed'
        ).order_by(desc(Donation.created_at)).limit(5).all()
        
        recent_messages = db.session.query(ContactMessage).filter(
            ContactMessage.created_at >= thirty_days_ago
        ).order_by(desc(ContactMessage.created_at)).limit(5).all()
        
        # Build recent activity list
        recent_activity = []
        
        for donation in recent_donations:
            recent_activity.append({
                'type': 'donation',
                'description': f'Nova doação de R$ {donation.amount:.2f} de {donation.donor_name}',
                'date': donation.created_at.isoformat(),
                'amount': donation.amount
            })
        
        for message in recent_messages:
            recent_activity.append({
                'type': 'message',
                'description': f'Nova mensagem de {message.name}: {message.subject or "Sem assunto"}',
                'date': message.created_at.isoformat(),
                'email': message.email
            })
        
        # Sort by date
        recent_activity.sort(key=lambda x: x['date'], reverse=True)
        recent_activity = recent_activity[:10]  # Top 10 most recent
        
        # Pending actions
        pending_actions = []
        
        if unread_messages > 0:
            pending_actions.append({
                'description': 'Mensagens não lidas',
                'count': unread_messages,
                'type': 'messages'
            })
        
        return jsonify({
            'donations_summary': {
                'total_donations': total_donations,
                'total_amount': float(total_amount),
                'monthly_recurring': float(monthly_recurring),
                'total_donors': total_donors
            },
            'raffles_summary': {
                'active_raffles': active_raffles,
                'total_raffles': total_raffles
            },
            'messages_summary': {
                'total_messages': total_messages,
                'unread_messages': unread_messages
            },
            'recent_activity': recent_activity,
            'pending_actions': pending_actions
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500