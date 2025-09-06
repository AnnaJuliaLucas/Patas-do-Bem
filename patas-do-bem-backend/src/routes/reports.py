from flask import Blueprint, request, jsonify, send_file
from datetime import datetime, timedelta
from sqlalchemy import func, extract
from src.models.user import db
from src.models.donation import Donation
from src.models.raffle import Raffle, RaffleTicket
from src.models.contact import ContactMessage
import csv
import io
import json
from collections import defaultdict

reports_bp = Blueprint('reports', __name__)

@reports_bp.route('/reports/dashboard', methods=['GET'])
def dashboard_stats():
    """Estatísticas para o dashboard administrativo"""
    try:
        # Período padrão: últimos 30 dias
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=30)
        
        # Doações no período
        donations_query = Donation.query.filter(
            Donation.created_at >= start_date,
            Donation.payment_status == 'completed'
        )
        
        total_donations = donations_query.count()
        total_amount = db.session.query(func.sum(Donation.amount)).filter(
            Donation.created_at >= start_date,
            Donation.payment_status == 'completed'
        ).scalar() or 0
        
        # Doações recorrentes ativas
        recurring_donations = Donation.query.filter(
            Donation.donation_type == 'recurring',
            Donation.payment_status == 'completed'
        ).count()
        
        recurring_amount = db.session.query(func.sum(Donation.amount)).filter(
            Donation.donation_type == 'recurring',
            Donation.payment_status == 'completed'
        ).scalar() or 0
        
        # Rifas ativas
        active_raffles = Raffle.query.filter(Raffle.status == 'active').count()
        
        # Total de números vendidos este mês
        tickets_sold = RaffleTicket.query.join(Raffle).filter(
            RaffleTicket.purchased_at >= start_date,
            RaffleTicket.payment_status == 'completed'
        ).count()
        
        # Mensagens de contato não lidas
        unread_messages = ContactMessage.query.filter(
            ContactMessage.status == 'unread'
        ).count()
        
        # Doações por dia (últimos 7 dias)
        daily_donations = []
        for i in range(7):
            date = end_date - timedelta(days=i)
            day_start = date.replace(hour=0, minute=0, second=0, microsecond=0)
            day_end = day_start + timedelta(days=1)
            
            day_amount = db.session.query(func.sum(Donation.amount)).filter(
                Donation.created_at >= day_start,
                Donation.created_at < day_end,
                Donation.payment_status == 'completed'
            ).scalar() or 0
            
            daily_donations.append({
                'date': day_start.strftime('%Y-%m-%d'),
                'amount': float(day_amount)
            })
        
        # Doações recentes
        recent_donations = Donation.query.filter(
            Donation.payment_status == 'completed'
        ).order_by(Donation.created_at.desc()).limit(10).all()
        
        return jsonify({
            'period': {
                'start_date': start_date.isoformat(),
                'end_date': end_date.isoformat()
            },
            'donations': {
                'total_count': total_donations,
                'total_amount': float(total_amount),
                'recurring_count': recurring_donations,
                'recurring_monthly': float(recurring_amount)
            },
            'raffles': {
                'active_count': active_raffles,
                'tickets_sold_month': tickets_sold
            },
            'contact': {
                'unread_messages': unread_messages
            },
            'charts': {
                'daily_donations': daily_donations[::-1]  # Ordem cronológica
            },
            'recent_activity': [donation.to_dict() for donation in recent_donations]
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@reports_bp.route('/reports/donations', methods=['GET'])
def donations_report():
    """Relatório detalhado de doações"""
    try:
        # Parâmetros de filtro
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        donation_type = request.args.get('type', 'all')
        status = request.args.get('status', 'completed')
        
        query = Donation.query
        
        # Aplicar filtros
        if start_date:
            query = query.filter(Donation.created_at >= datetime.fromisoformat(start_date))
        if end_date:
            query = query.filter(Donation.created_at <= datetime.fromisoformat(end_date))
        if donation_type != 'all':
            query = query.filter(Donation.donation_type == donation_type)
        if status != 'all':
            query = query.filter(Donation.payment_status == status)
        
        donations = query.order_by(Donation.created_at.desc()).all()
        
        # Estatísticas
        total_amount = sum(float(d.amount) for d in donations)
        total_count = len(donations)
        
        # Agrupar por mês
        monthly_data = defaultdict(lambda: {'count': 0, 'amount': 0})
        for donation in donations:
            month_key = donation.created_at.strftime('%Y-%m')
            monthly_data[month_key]['count'] += 1
            monthly_data[month_key]['amount'] += float(donation.amount)
        
        # Agrupar por tipo
        type_data = defaultdict(lambda: {'count': 0, 'amount': 0})
        for donation in donations:
            type_data[donation.donation_type]['count'] += 1
            type_data[donation.donation_type]['amount'] += float(donation.amount)
        
        return jsonify({
            'summary': {
                'total_count': total_count,
                'total_amount': total_amount,
                'average_donation': total_amount / total_count if total_count > 0 else 0
            },
            'monthly_breakdown': dict(monthly_data),
            'type_breakdown': dict(type_data),
            'donations': [donation.to_dict() for donation in donations]
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@reports_bp.route('/reports/raffles', methods=['GET'])
def raffles_report():
    """Relatório detalhado de rifas"""
    try:
        status_filter = request.args.get('status', 'all')
        
        query = Raffle.query
        if status_filter != 'all':
            query = query.filter(Raffle.status == status_filter)
        
        raffles = query.order_by(Raffle.created_at.desc()).all()
        
        raffles_data = []
        total_revenue = 0
        
        for raffle in raffles:
            # Calcular estatísticas de cada rifa
            tickets_sold = RaffleTicket.query.filter(
                RaffleTicket.raffle_id == raffle.id,
                RaffleTicket.payment_status == 'completed'
            ).count()
            
            revenue = tickets_sold * float(raffle.ticket_price)
            total_revenue += revenue
            
            raffle_dict = raffle.to_dict()
            raffle_dict.update({
                'tickets_sold': tickets_sold,
                'tickets_available': raffle.total_numbers - tickets_sold,
                'revenue': revenue,
                'completion_rate': (tickets_sold / raffle.total_numbers) * 100 if raffle.total_numbers > 0 else 0
            })
            
            raffles_data.append(raffle_dict)
        
        return jsonify({
            'summary': {
                'total_raffles': len(raffles),
                'total_revenue': total_revenue,
                'active_raffles': len([r for r in raffles if r.status == 'active']),
                'completed_raffles': len([r for r in raffles if r.status == 'completed'])
            },
            'raffles': raffles_data
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@reports_bp.route('/reports/financial', methods=['GET'])
def financial_report():
    """Relatório financeiro consolidado"""
    try:
        year = request.args.get('year', datetime.utcnow().year, type=int)
        
        # Doações por mês do ano
        monthly_donations = {}
        for month in range(1, 13):
            month_donations = db.session.query(func.sum(Donation.amount)).filter(
                extract('year', Donation.created_at) == year,
                extract('month', Donation.created_at) == month,
                Donation.payment_status == 'completed'
            ).scalar() or 0
            
            monthly_donations[f"{year}-{month:02d}"] = float(month_donations)
        
        # Receita de rifas por mês
        monthly_raffles = {}
        for month in range(1, 13):
            # Calcular receita de rifas completadas neste mês
            month_raffles = Raffle.query.filter(
                extract('year', Raffle.drawn_at) == year,
                extract('month', Raffle.drawn_at) == month,
                Raffle.status == 'completed'
            ).all()
            
            month_revenue = 0
            for raffle in month_raffles:
                tickets_sold = RaffleTicket.query.filter(
                    RaffleTicket.raffle_id == raffle.id,
                    RaffleTicket.payment_status == 'completed'
                ).count()
                month_revenue += tickets_sold * float(raffle.ticket_price)
            
            monthly_raffles[f"{year}-{month:02d}"] = month_revenue
        
        # Totais anuais
        total_donations = sum(monthly_donations.values())
        total_raffles = sum(monthly_raffles.values())
        total_revenue = total_donations + total_raffles
        
        # Top doadores (anonimizados)
        top_donors = db.session.query(
            Donation.donor_email,
            func.sum(Donation.amount).label('total_amount')
        ).filter(
            extract('year', Donation.created_at) == year,
            Donation.payment_status == 'completed'
        ).group_by(Donation.donor_email).order_by(
            func.sum(Donation.amount).desc()
        ).limit(10).all()
        
        top_donors_data = [
            {
                'donor_id': f"Doador_{i+1}",
                'total_amount': float(donor[1])
            }
            for i, donor in enumerate(top_donors)
        ]
        
        return jsonify({
            'year': year,
            'summary': {
                'total_revenue': total_revenue,
                'donations_revenue': total_donations,
                'raffles_revenue': total_raffles,
                'donations_percentage': (total_donations / total_revenue) * 100 if total_revenue > 0 else 0,
                'raffles_percentage': (total_raffles / total_revenue) * 100 if total_revenue > 0 else 0
            },
            'monthly_data': {
                'donations': monthly_donations,
                'raffles': monthly_raffles
            },
            'top_donors': top_donors_data
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@reports_bp.route('/reports/export/donations', methods=['GET'])
def export_donations():
    """Exportar relatório de doações em CSV"""
    try:
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        query = Donation.query.filter(Donation.payment_status == 'completed')
        
        if start_date:
            query = query.filter(Donation.created_at >= datetime.fromisoformat(start_date))
        if end_date:
            query = query.filter(Donation.created_at <= datetime.fromisoformat(end_date))
        
        donations = query.order_by(Donation.created_at.desc()).all()
        
        # Criar CSV
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Cabeçalho
        writer.writerow([
            'Data', 'Nome', 'Email', 'Valor', 'Tipo', 'Método de Pagamento', 'Status'
        ])
        
        # Dados
        for donation in donations:
            writer.writerow([
                donation.created_at.strftime('%d/%m/%Y %H:%M'),
                donation.donor_name,
                donation.donor_email,
                f"R$ {donation.amount:.2f}",
                'Recorrente' if donation.donation_type == 'recurring' else 'Única',
                donation.payment_method.upper(),
                donation.payment_status
            ])
        
        output.seek(0)
        
        # Criar arquivo em memória
        csv_data = output.getvalue()
        output.close()
        
        # Retornar arquivo
        return jsonify({
            'filename': f'doacoes_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv',
            'data': csv_data,
            'total_records': len(donations)
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@reports_bp.route('/reports/monthly-summary', methods=['GET'])
def monthly_summary():
    """Relatório de resumo mensal para emails automatizados"""
    try:
        month = request.args.get('month', datetime.utcnow().month, type=int)
        year = request.args.get('year', datetime.utcnow().year, type=int)
        
        start_date = datetime(year, month, 1)
        if month == 12:
            end_date = datetime(year + 1, 1, 1)
        else:
            end_date = datetime(year, month + 1, 1)
        
        # Doações do mês
        monthly_donations = Donation.query.filter(
            Donation.created_at >= start_date,
            Donation.created_at < end_date,
            Donation.payment_status == 'completed'
        ).all()
        
        total_donations = len(monthly_donations)
        total_amount = sum(float(d.amount) for d in monthly_donations)
        
        # Novos doadores
        existing_donors = db.session.query(Donation.donor_email).filter(
            Donation.created_at < start_date,
            Donation.payment_status == 'completed'
        ).distinct().subquery()
        
        new_donors = db.session.query(func.count(func.distinct(Donation.donor_email))).filter(
            Donation.created_at >= start_date,
            Donation.created_at < end_date,
            Donation.payment_status == 'completed',
            ~Donation.donor_email.in_(existing_donors)
        ).scalar() or 0
        
        # Rifas completadas
        raffles_completed = Raffle.query.filter(
            Raffle.drawn_at >= start_date,
            Raffle.drawn_at < end_date,
            Raffle.status == 'completed'
        ).count()
        
        return jsonify({
            'month_year': start_date.strftime('%B de %Y'),
            'total_donations': total_donations,
            'total_amount': total_amount,
            'new_donors': new_donors,
            'raffles_completed': raffles_completed,
            'animals_helped': total_donations * 2  # Estimativa: cada doação ajuda 2 animais
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500