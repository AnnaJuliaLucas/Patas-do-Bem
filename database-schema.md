# Esquema do Banco de Dados - Patas do Bem

## Tabelas Principais

### 1. Users (Usuários Administrativos)
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);
```

### 2. Donations (Doações)
```sql
CREATE TABLE donations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    donor_name VARCHAR(100) NOT NULL,
    donor_email VARCHAR(100) NOT NULL,
    donor_phone VARCHAR(20),
    amount DECIMAL(10,2) NOT NULL,
    donation_type VARCHAR(20) NOT NULL, -- 'one_time' ou 'recurring'
    payment_method VARCHAR(20) NOT NULL, -- 'pix', 'credit_card', 'boleto'
    payment_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'completed', 'failed'
    payment_id VARCHAR(100), -- ID do gateway de pagamento
    subscription_id VARCHAR(100), -- Para doações recorrentes
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3. Raffles (Rifas)
```sql
CREATE TABLE raffles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    image_url VARCHAR(500),
    ticket_price DECIMAL(10,2) NOT NULL,
    total_numbers INTEGER NOT NULL,
    draw_date DATE,
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'completed', 'cancelled'
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 4. Raffle_Tickets (Números da Rifa)
```sql
CREATE TABLE raffle_tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    raffle_id INTEGER REFERENCES raffles(id),
    ticket_number INTEGER NOT NULL,
    buyer_name VARCHAR(100),
    buyer_email VARCHAR(100),
    buyer_phone VARCHAR(20),
    payment_status VARCHAR(20) DEFAULT 'pending',
    payment_id VARCHAR(100),
    purchased_at TIMESTAMP,
    UNIQUE(raffle_id, ticket_number)
);
```

### 5. Contact_Messages (Mensagens de Contato)
```sql
CREATE TABLE contact_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    subject VARCHAR(200),
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'new', -- 'new', 'read', 'replied'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Índices para Performance
```sql
CREATE INDEX idx_donations_email ON donations(donor_email);
CREATE INDEX idx_donations_status ON donations(payment_status);
CREATE INDEX idx_donations_type ON donations(donation_type);
CREATE INDEX idx_raffles_status ON raffles(status);
CREATE INDEX idx_raffle_tickets_raffle ON raffle_tickets(raffle_id);
CREATE INDEX idx_raffle_tickets_status ON raffle_tickets(payment_status);
```

## Dados Iniciais
- Usuário administrador padrão
- Exemplos de rifas para demonstração
- Configurações do sistema

