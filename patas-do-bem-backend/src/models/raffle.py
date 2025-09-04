from datetime import datetime
from src.models.user import db

class Raffle(db.Model):
    __tablename__ = 'raffles'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    image_url = db.Column(db.String(500))
    ticket_price = db.Column(db.Numeric(10, 2), nullable=False)
    total_numbers = db.Column(db.Integer, nullable=False)
    draw_date = db.Column(db.Date)
    status = db.Column(db.String(20), default='active')  # 'active', 'completed', 'cancelled'
    winner_number = db.Column(db.Integer)
    winner_name = db.Column(db.String(100))
    winner_email = db.Column(db.String(100))
    drawn_at = db.Column(db.DateTime)
    created_by = db.Column(db.Integer, db.ForeignKey('user.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relacionamento com tickets
    tickets = db.relationship('RaffleTicket', backref='raffle', lazy=True, cascade='all, delete-orphan')

    def __repr__(self):
        return f'<Raffle {self.id}: {self.title}>'

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'image_url': self.image_url,
            'ticket_price': float(self.ticket_price),
            'total_numbers': self.total_numbers,
            'draw_date': self.draw_date.isoformat() if self.draw_date else None,
            'status': self.status,
            'winner_number': self.winner_number,
            'winner_name': self.winner_name,
            'winner_email': self.winner_email,
            'drawn_at': self.drawn_at.isoformat() if self.drawn_at else None,
            'created_by': self.created_by,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class RaffleTicket(db.Model):
    __tablename__ = 'raffle_tickets'
    
    id = db.Column(db.Integer, primary_key=True)
    raffle_id = db.Column(db.Integer, db.ForeignKey('raffles.id'), nullable=False)
    ticket_number = db.Column(db.Integer, nullable=False)
    buyer_name = db.Column(db.String(100))
    buyer_email = db.Column(db.String(100))
    buyer_phone = db.Column(db.String(20))
    payment_status = db.Column(db.String(20), default='pending')
    payment_id = db.Column(db.String(100))
    purchased_at = db.Column(db.DateTime)
    
    # Constraint para garantir que cada número seja único por rifa
    __table_args__ = (db.UniqueConstraint('raffle_id', 'ticket_number', name='unique_raffle_ticket'),)

    def __repr__(self):
        return f'<RaffleTicket {self.id}: Rifa {self.raffle_id} - Número {self.ticket_number}>'

    def to_dict(self):
        return {
            'id': self.id,
            'raffle_id': self.raffle_id,
            'ticket_number': self.ticket_number,
            'buyer_name': self.buyer_name,
            'buyer_email': self.buyer_email,
            'buyer_phone': self.buyer_phone,
            'payment_status': self.payment_status,
            'payment_id': self.payment_id,
            'purchased_at': self.purchased_at.isoformat() if self.purchased_at else None
        }

