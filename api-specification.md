# Especificação das APIs - Patas do Bem

## Autenticação
### POST /api/auth/login
- **Descrição**: Login de usuário administrativo
- **Body**: `{"username": "string", "password": "string"}`
- **Response**: `{"token": "jwt_token", "user": {...}}`

### POST /api/auth/logout
- **Descrição**: Logout do usuário
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `{"message": "Logout successful"}`

## Doações
### POST /api/donations
- **Descrição**: Criar nova doação (única ou recorrente)
- **Body**: 
```json
{
  "donor_name": "string",
  "donor_email": "string", 
  "donor_phone": "string",
  "amount": "number",
  "donation_type": "one_time|recurring",
  "payment_method": "pix|credit_card|boleto"
}
```
- **Response**: `{"donation_id": "string", "payment_data": {...}}`

### GET /api/donations
- **Descrição**: Listar doações (área administrativa)
- **Headers**: `Authorization: Bearer <token>`
- **Query**: `?page=1&limit=20&status=all`
- **Response**: `{"donations": [...], "total": number, "pages": number}`

### GET /api/donations/stats
- **Descrição**: Estatísticas de doações
- **Headers**: `Authorization: Bearer <token>`
- **Response**: 
```json
{
  "total_amount": "number",
  "monthly_recurring": "number",
  "total_donors": "number",
  "recent_donations": [...]
}
```

## Rifas
### GET /api/raffles
- **Descrição**: Listar rifas ativas (público)
- **Response**: `{"raffles": [...]}`

### GET /api/raffles/:id
- **Descrição**: Detalhes de uma rifa específica
- **Response**: 
```json
{
  "raffle": {...},
  "available_numbers": [...],
  "sold_numbers": [...]
}
```

### POST /api/raffles (Admin)
- **Descrição**: Criar nova rifa
- **Headers**: `Authorization: Bearer <token>`
- **Body**: 
```json
{
  "title": "string",
  "description": "string",
  "image_url": "string",
  "ticket_price": "number",
  "total_numbers": "number",
  "draw_date": "date"
}
```

### PUT /api/raffles/:id (Admin)
- **Descrição**: Atualizar rifa
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{...dados_atualizados}`

### DELETE /api/raffles/:id (Admin)
- **Descrição**: Cancelar rifa
- **Headers**: `Authorization: Bearer <token>`

### GET /api/raffles/:id/tickets (Admin)
- **Descrição**: Listar participantes da rifa
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `{"tickets": [...], "stats": {...}}`

## Compra de Números da Rifa
### POST /api/raffles/:id/tickets
- **Descrição**: Comprar números da rifa
- **Body**: 
```json
{
  "buyer_name": "string",
  "buyer_email": "string",
  "buyer_phone": "string",
  "ticket_numbers": [1, 5, 10],
  "payment_method": "pix|credit_card|boleto"
}
```
- **Response**: `{"purchase_id": "string", "payment_data": {...}}`

## Contato
### POST /api/contact
- **Descrição**: Enviar mensagem de contato
- **Body**: 
```json
{
  "name": "string",
  "email": "string",
  "phone": "string",
  "subject": "string",
  "message": "string"
}
```
- **Response**: `{"message": "Mensagem enviada com sucesso"}`

### GET /api/contact/messages (Admin)
- **Descrição**: Listar mensagens de contato
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `{"messages": [...], "unread_count": number}`

## Configurações e Dados Gerais
### GET /api/config
- **Descrição**: Configurações públicas do site
- **Response**: 
```json
{
  "organization_name": "string",
  "social_links": {...},
  "contact_info": {...},
  "donation_plans": [...]
}
```

### GET /api/dashboard (Admin)
- **Descrição**: Dados do dashboard administrativo
- **Headers**: `Authorization: Bearer <token>`
- **Response**: 
```json
{
  "donations_summary": {...},
  "raffles_summary": {...},
  "recent_activity": [...],
  "pending_actions": [...]
}
```

## Webhooks de Pagamento
### POST /api/webhooks/payment
- **Descrição**: Receber notificações de pagamento
- **Body**: `{...dados_do_gateway}`
- **Response**: `{"status": "received"}`

## Códigos de Status HTTP
- **200**: Sucesso
- **201**: Criado com sucesso
- **400**: Dados inválidos
- **401**: Não autorizado
- **403**: Acesso negado
- **404**: Não encontrado
- **500**: Erro interno do servidor

