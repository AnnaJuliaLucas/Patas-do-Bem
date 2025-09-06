import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from datetime import datetime
from jinja2 import Environment, FileSystemLoader
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        self.smtp_server = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
        self.smtp_port = int(os.getenv('SMTP_PORT', 587))
        self.smtp_username = os.getenv('SMTP_USERNAME', '')
        self.smtp_password = os.getenv('SMTP_PASSWORD', '')
        self.from_email = os.getenv('FROM_EMAIL', self.smtp_username)
        self.from_name = os.getenv('FROM_NAME', 'Patas do Bem')
        
        # Setup Jinja2 template environment
        template_dir = os.path.join(os.path.dirname(__file__), '..', 'templates', 'email')
        self.env = Environment(loader=FileSystemLoader(template_dir))
    
    def _create_smtp_connection(self):
        """Criar conexão SMTP"""
        try:
            server = smtplib.SMTP(self.smtp_server, self.smtp_port)
            server.starttls()
            if self.smtp_username and self.smtp_password:
                server.login(self.smtp_username, self.smtp_password)
            return server
        except Exception as e:
            logger.error(f"Erro ao conectar SMTP: {e}")
            return None
    
    def _send_email(self, to_email, subject, html_body, text_body=None, attachments=None):
        """Enviar email genérico"""
        if not self.smtp_username or not self.smtp_password:
            logger.warning("Configurações SMTP não encontradas. Email não será enviado.")
            return False
        
        try:
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = f"{self.from_name} <{self.from_email}>"
            msg['To'] = to_email
            
            # Adicionar corpo do texto
            if text_body:
                text_part = MIMEText(text_body, 'plain', 'utf-8')
                msg.attach(text_part)
            
            # Adicionar corpo HTML
            html_part = MIMEText(html_body, 'html', 'utf-8')
            msg.attach(html_part)
            
            # Adicionar anexos se houver
            if attachments:
                for attachment in attachments:
                    part = MIMEBase('application', 'octet-stream')
                    with open(attachment['path'], 'rb') as f:
                        part.set_payload(f.read())
                    encoders.encode_base64(part)
                    part.add_header(
                        'Content-Disposition',
                        f'attachment; filename= {attachment["name"]}'
                    )
                    msg.attach(part)
            
            # Enviar email
            server = self._create_smtp_connection()
            if server:
                server.send_message(msg)
                server.quit()
                logger.info(f"Email enviado para {to_email}")
                return True
            else:
                return False
                
        except Exception as e:
            logger.error(f"Erro ao enviar email: {e}")
            return False
    
    def send_donation_confirmation(self, donation_data):
        """Enviar confirmação de doação"""
        try:
            template = self.env.get_template('donation_confirmation.html')
            
            context = {
                'donor_name': donation_data['donor_name'],
                'amount': donation_data['amount'],
                'donation_type': donation_data['donation_type'],
                'payment_method': donation_data['payment_method'],
                'date': datetime.now().strftime('%d/%m/%Y %H:%M'),
                'organization_name': 'Associação Patas do Bem'
            }
            
            html_body = template.render(context)
            subject = f"Confirmação de Doação - Patas do Bem"
            
            return self._send_email(
                to_email=donation_data['donor_email'],
                subject=subject,
                html_body=html_body
            )
            
        except Exception as e:
            logger.error(f"Erro ao enviar confirmação de doação: {e}")
            return False
    
    def send_raffle_ticket_confirmation(self, ticket_data):
        """Enviar confirmação de compra de números da rifa"""
        try:
            template = self.env.get_template('raffle_confirmation.html')
            
            context = {
                'buyer_name': ticket_data['buyer_name'],
                'raffle_title': ticket_data['raffle_title'],
                'ticket_numbers': ticket_data['ticket_numbers'],
                'total_amount': ticket_data['total_amount'],
                'draw_date': ticket_data.get('draw_date', ''),
                'date': datetime.now().strftime('%d/%m/%Y %H:%M'),
                'organization_name': 'Associação Patas do Bem'
            }
            
            html_body = template.render(context)
            subject = f"Confirmação de Participação - Rifa Patas do Bem"
            
            return self._send_email(
                to_email=ticket_data['buyer_email'],
                subject=subject,
                html_body=html_body
            )
            
        except Exception as e:
            logger.error(f"Erro ao enviar confirmação de rifa: {e}")
            return False
    
    def send_raffle_winner_notification(self, winner_data):
        """Notificar ganhador da rifa"""
        try:
            template = self.env.get_template('raffle_winner.html')
            
            context = {
                'winner_name': winner_data['winner_name'],
                'raffle_title': winner_data['raffle_title'],
                'winner_number': winner_data['winner_number'],
                'prize_description': winner_data.get('prize_description', ''),
                'contact_info': winner_data.get('contact_info', ''),
                'organization_name': 'Associação Patas do Bem'
            }
            
            html_body = template.render(context)
            subject = f"🎉 Parabéns! Você ganhou a rifa - Patas do Bem"
            
            return self._send_email(
                to_email=winner_data['winner_email'],
                subject=subject,
                html_body=html_body
            )
            
        except Exception as e:
            logger.error(f"Erro ao enviar notificação de ganhador: {e}")
            return False
    
    def send_contact_notification(self, contact_data):
        """Enviar notificação de novo contato para administradores"""
        try:
            admin_email = os.getenv('ADMIN_EMAIL', 'admin@patasdobem.org.br')
            
            template = self.env.get_template('contact_notification.html')
            
            context = {
                'name': contact_data['name'],
                'email': contact_data['email'],
                'phone': contact_data.get('phone', ''),
                'subject': contact_data['subject'],
                'message': contact_data['message'],
                'date': datetime.now().strftime('%d/%m/%Y %H:%M'),
                'organization_name': 'Associação Patas do Bem'
            }
            
            html_body = template.render(context)
            subject = f"Nova Mensagem de Contato - {contact_data['name']}"
            
            return self._send_email(
                to_email=admin_email,
                subject=subject,
                html_body=html_body
            )
            
        except Exception as e:
            logger.error(f"Erro ao enviar notificação de contato: {e}")
            return False
    
    def send_monthly_report(self, report_data, recipients):
        """Enviar relatório mensal para administradores"""
        try:
            template = self.env.get_template('monthly_report.html')
            
            context = {
                'month_year': report_data['month_year'],
                'total_donations': report_data['total_donations'],
                'total_amount': report_data['total_amount'],
                'new_donors': report_data['new_donors'],
                'raffles_completed': report_data['raffles_completed'],
                'animals_helped': report_data.get('animals_helped', 0),
                'organization_name': 'Associação Patas do Bem'
            }
            
            html_body = template.render(context)
            subject = f"Relatório Mensal - {report_data['month_year']} - Patas do Bem"
            
            # Enviar para todos os administradores
            success_count = 0
            for recipient in recipients:
                if self._send_email(
                    to_email=recipient,
                    subject=subject,
                    html_body=html_body
                ):
                    success_count += 1
            
            return success_count > 0
            
        except Exception as e:
            logger.error(f"Erro ao enviar relatório mensal: {e}")
            return False

# Instância global do serviço
email_service = EmailService()