# 📚 Documentação da API - Patas do Bem

## 🔗 Base URL
```
http://localhost:5000/api
```

## 🔑 Autenticação
A maioria dos endpoints públicos não requer autenticação. Endpoints administrativos requerem token JWT no header `Authorization: Bearer <token>`.

---

## 📊 Doações

### POST /api/donations
Criar nova doação (única ou recorrente)

**Request Body:**
```json
{
  "donor_name": "string (obrigatório)",
  "donor_email": "string (obrigatório, formato email)",
  "donor_phone": "string (opcional)",
  "amount": "number (obrigatório, > 0)",
  "donation_type": "one_time|recurring (obrigatório)",
  "payment_method": "pix|credit_card|boleto (obrigatório)"
}
```

**Response (201):**
```json
{
  "donation_id": "integer",
  "amount": "number",
  "payment_method": "string",
  "status": "pending",
  "pix_code": "string (se PIX)",
  "qr_code": "string (se PIX)",
  "boleto_url": "string (se boleto)",
  "card_form_url": "string (se cartão)"
}
```

**Possíveis Erros:**
- `400`: Dados inválidos (email, valor negativo, tipo inválido)

### GET /api/donations
Listar doações (área administrativa)

**Query Parameters:**
- `page`: Número da página (padrão: 1)
- `per_page`: Itens por página (padrão: 20)
- `status`: Filtrar por status (`all|pending|completed|failed`)
- `type`: Filtrar por tipo (`all|one_time|recurring`)

**Response (200):**
```json
{
  "donations": [
    {
      "id": "integer",
      "donor_name": "string",
      "donor_email": "string",
      "amount": "number",
      "donation_type": "string",
      "payment_status": "string",
      "created_at": "datetime"
    }
  ],
  "total": "integer",
  "pages": "integer",
  "current_page": "integer"
}
```

### GET /api/donations/stats
Estatísticas de doações

**Response (200):**
```json
{
  "total_amount": "number",
  "monthly_recurring": "number",
  "total_donors": "integer",
  "recent_donations": [
    {
      "id": "integer",
      "donor_name": "string",
      "amount": "number",
      "created_at": "datetime"
    }
  ]
}
```

### POST /api/donations/{id}/confirm
Confirmar pagamento de doação (webhook)

**Request Body:**
```json
{
  "status": "completed|failed",
  "payment_id": "string",
  "subscription_id": "string (opcional para recorrentes)"
}
```

### GET /api/donations/history
Histórico público de doações (anonimizado)

**Query Parameters:**
- `page`: Número da página (padrão: 1)
- `limit`: Itens por página (padrão: 10)

**Response (200):**
```json
{
  "donations": [
    {
      "amount": "number",
      "donation_type": "string",
      "date": "datetime",
      "donor_name": "string (anonimizado)"
    }
  ],
  "total": "integer"
}
```

---

## 🎟️ Rifas

### GET /api/raffles
Listar rifas ativas (público)

**Response (200):**
```json
{
  "raffles": [
    {
      "id": "integer",
      "title": "string",
      "description": "string",
      "ticket_price": "number",
      "total_numbers": "integer",
      "draw_date": "date",
      "status": "active",
      "sold_numbers": "integer",
      "available_numbers": "integer"
    }
  ]
}
```

### GET /api/raffles/{id}
Detalhes de uma rifa específica

**Response (200):**
```json
{
  "raffle": {
    "id": "integer",
    "title": "string",
    "description": "string",
    "ticket_price": "number",
    "total_numbers": "integer",
    "draw_date": "date",
    "sold_numbers": [1, 5, 10],
    "available_numbers": [2, 3, 4, 6, 7, 8, 9]
  }
}
```

### POST /api/raffles
Criar nova rifa (Admin)

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "title": "string (obrigatório)",
  "description": "string (opcional)",
  "image_url": "string (opcional)",
  "ticket_price": "number (obrigatório)",
  "total_numbers": "integer (obrigatório)",
  "draw_date": "YYYY-MM-DD (opcional)"
}
```

**Response (201):**
```json
{
  "message": "Rifa criada com sucesso",
  "raffle": {
    "id": "integer",
    "title": "string",
    "status": "active"
  }
}
```

### PUT /api/raffles/{id}
Atualizar rifa (Admin)

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "title": "string (opcional)",
  "description": "string (opcional)",
  "ticket_price": "number (opcional)",
  "draw_date": "YYYY-MM-DD (opcional)",
  "status": "active|completed|cancelled (opcional)"
}
```

### DELETE /api/raffles/{id}
Cancelar rifa (Admin)

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "message": "Rifa cancelada com sucesso"
}
```

**Possíveis Erros:**
- `400`: Não é possível cancelar rifa com números já vendidos

### POST /api/raffles/{id}/tickets
Comprar números da rifa

**Request Body:**
```json
{
  "buyer_name": "string (obrigatório)",
  "buyer_email": "string (obrigatório, formato email)",
  "buyer_phone": "string (opcional)",
  "selected_numbers": "[1, 5, 10] (obrigatório, array de integers)",
  "payment_method": "pix|credit_card|boleto (obrigatório)"
}
```

**Response (201):**
```json
{
  "purchase_id": "string",
  "raffle_id": "integer",
  "ticket_numbers": "[1, 5, 10]",
  "total_amount": "number",
  "payment_method": "string",
  "status": "pending",
  "pix_code": "string (se PIX)",
  "qr_code": "string (se PIX)"
}
```

**Possíveis Erros:**
- `400`: Números duplicados, fora do range, já reservados

### GET /api/raffles/{id}/tickets
Listar participantes da rifa (Admin)

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "tickets": [
    {
      "id": "integer",
      "ticket_number": "integer",
      "buyer_name": "string",
      "buyer_email": "string",
      "payment_status": "string",
      "purchased_at": "datetime"
    }
  ],
  "stats": {
    "total_numbers": "integer",
    "sold_numbers": "integer",
    "pending_numbers": "integer",
    "available_numbers": "integer",
    "total_revenue": "number"
  }
}
```

### GET /api/raffles/{id}/numbers
Obter números disponíveis e vendidos

**Response (200):**
```json
{
  "available_numbers": "[2, 3, 4]",
  "sold_numbers": "[1, 5]",
  "reserved_numbers": "[6, 7]",
  "total_numbers": "integer"
}
```

### POST /api/raffles/{id}/draw
Realizar sorteio da rifa (Admin)

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "message": "Sorteio realizado com sucesso",
  "winner": {
    "number": "integer",
    "name": "string",
    "email": "string"
  },
  "drawn_at": "datetime"
}
```

### GET /api/raffles/{id}/winners
Obter ganhadores da rifa

**Response (200):**
```json
{
  "winner": {
    "raffle_id": "integer",
    "raffle_title": "string",
    "winner_number": "integer",
    "winner_name": "string",
    "drawn_at": "datetime",
    "prize_description": "string"
  }
}
```

---

## 📞 Contato

### POST /api/contact
Enviar mensagem de contato

**Request Body:**
```json
{
  "name": "string (obrigatório)",
  "email": "string (obrigatório, formato email)",
  "phone": "string (opcional)",
  "subject": "string (obrigatório)",
  "message": "string (obrigatório)"
}
```

**Response (201):**
```json
{
  "message": "Mensagem enviada com sucesso",
  "contact": {
    "id": "integer",
    "name": "string",
    "subject": "string",
    "created_at": "datetime"
  }
}
```

### GET /api/contact/messages
Listar mensagens de contato (Admin)

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "messages": [
    {
      "id": "integer",
      "name": "string",
      "email": "string",
      "subject": "string",
      "message": "string",
      "status": "string",
      "created_at": "datetime"
    }
  ],
  "unread_count": "integer"
}
```

---

## ⚙️ Configurações

### GET /api/config
Configurações públicas do site

**Response (200):**
```json
{
  "organization_name": "string",
  "location": "string",
  "description": "string",
  "contact_email": "string",
  "contact_phone": "string",
  "social_links": {
    "instagram": "string",
    "facebook": "string",
    "whatsapp": "string"
  },
  "donation_plans": [
    {
      "id": "string",
      "amount": "number",
      "name": "string",
      "description": "string"
    }
  ]
}
```

---

## 📊 Relatórios (Admin)

### GET /api/reports/dashboard
Estatísticas para dashboard administrativo

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "period": {
    "start_date": "datetime",
    "end_date": "datetime"
  },
  "donations": {
    "total_count": "integer",
    "total_amount": "number",
    "recurring_count": "integer",
    "recurring_monthly": "number"
  },
  "raffles": {
    "active_count": "integer",
    "tickets_sold_month": "integer"
  },
  "charts": {
    "daily_donations": [
      {
        "date": "YYYY-MM-DD",
        "amount": "number"
      }
    ]
  },
  "recent_activity": []
}
```

### GET /api/reports/financial
Relatório financeiro consolidado

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `year`: Ano do relatório (padrão: ano atual)

**Response (200):**
```json
{
  "year": "integer",
  "summary": {
    "total_revenue": "number",
    "donations_revenue": "number",
    "raffles_revenue": "number",
    "donations_percentage": "number",
    "raffles_percentage": "number"
  },
  "monthly_data": {
    "donations": {
      "2024-01": "number",
      "2024-02": "number"
    },
    "raffles": {
      "2024-01": "number",
      "2024-02": "number"
    }
  }
}
```

---

## 🚨 Códigos de Status HTTP

### Sucesso
- **200**: OK - Requisição bem-sucedida
- **201**: Created - Recurso criado com sucesso

### Erro do Cliente
- **400**: Bad Request - Dados inválidos ou malformados
- **401**: Unauthorized - Token de autenticação ausente ou inválido
- **403**: Forbidden - Acesso negado
- **404**: Not Found - Recurso não encontrado
- **429**: Too Many Requests - Rate limit excedido

### Erro do Servidor
- **500**: Internal Server Error - Erro interno do servidor

---

## 🔒 Rate Limiting

### Limites por Endpoint:
- **API Geral**: 100 requisições por minuto
- **Pagamentos**: 5 requisições por minuto
- **Endpoints Sensíveis**: 10 requisições por minuto

### Headers de Response:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

---

## 📝 Exemplos de Uso

### Criar Doação PIX:
```bash
curl -X POST http://localhost:5000/api/donations \
  -H "Content-Type: application/json" \
  -d '{
    "donor_name": "João Silva",
    "donor_email": "joao@example.com",
    "amount": 50.0,
    "donation_type": "one_time",
    "payment_method": "pix"
  }'
```

### Comprar Números da Rifa:
```bash
curl -X POST http://localhost:5000/api/raffles/1/tickets \
  -H "Content-Type: application/json" \
  -d '{
    "buyer_name": "Maria Santos",
    "buyer_email": "maria@example.com",
    "selected_numbers": [1, 5, 10],
    "payment_method": "pix"
  }'
```

### Listar Rifas Ativas:
```bash
curl -X GET http://localhost:5000/api/raffles
```

---

## 🐛 Tratamento de Erros

Todas as respostas de erro seguem o formato:

```json
{
  "error": "Descrição do erro",
  "code": "ERROR_CODE (opcional)",
  "details": "Detalhes adicionais (opcional)"
}
```

### Exemplos de Erros Comuns:

**Dados Inválidos (400):**
```json
{
  "error": "Formato de email inválido"
}
```

**Rate Limit (429):**
```json
{
  "error": "Rate limit exceeded. Too many requests.",
  "retry_after": 900
}
```

**Recurso Não Encontrado (404):**
```json
{
  "error": "Rifa não encontrada"
}
```