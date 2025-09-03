from datetime import datetime
from src.models.user import db

class Donation(db.Model):
    __tablename__ = 'donations'
    
    id = db.Column(db.Integer, primary_key=True)
    donor_name = db.Column(db.String(100), nullable=False)
    donor_email = db.Column(db.String(100), nullable=False)
    donor_phone = db.Column(db.String(20))
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    donation_type = db.Column(db.String(20), nullable=False)  # 'one_time' ou 'recurring'
    payment_method = db.Column(db.String(20), nullable=False)  # 'pix', 'credit_card', 'boleto'
    payment_status = db.Column(db.String(20), default='pending')  # 'pending', 'completed', 'failed'
    payment_id = db.Column(db.String(100))  # ID do gateway de pagamento
    subscription_id = db.Column(db.String(100))  # Para doações recorrentes
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f'<Donation {self.id}: {self.donor_name} - R${self.amount}>'

    def to_dict(self):
        return {
            'id': self.id,
            'donor_name': self.donor_name,
            'donor_email': self.donor_email,
            'donor_phone': self.donor_phone,
            'amount': float(self.amount),
            'donation_type': self.donation_type,
            'payment_method': self.payment_method,
            'payment_status': self.payment_status,
            'payment_id': self.payment_id,
            'subscription_id': self.subscription_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

