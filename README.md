# Patas do Bem - Site da ONG

Sistema completo para a Associação Patas do Bem - Proteção Animal de Santos Dumont/MG.

## 📋 Funcionalidades

### 🏠 Site Principal
- **Home**: Apresentação da ONG, missão e atividades
- **Apoie**: Sistema de doações únicas e recorrentes
- **Rifas**: Listagem e participação em rifas ativas
- **Contato**: Formulário de contato e redes sociais
- **Admin**: Painel administrativo para gestão

### 💳 Sistema de Pagamentos
- **PIX**: Geração automática de QR Code
- **Cartão de Crédito**: Pagamentos únicos e recorrentes
- **Boleto**: Geração automática com vencimento em 3 dias
- **Webhooks**: Confirmação automática de pagamentos

### 🎟️ Sistema de Rifas
- Criação e gestão de rifas
- Seleção de números pelos participantes
- Controle de números vendidos/disponíveis
- Área administrativa para gestão

## 🛠️ Tecnologias

### Backend (Flask)
- **Flask**: Framework web Python
- **SQLAlchemy**: ORM para banco de dados
- **SQLite**: Banco de dados
- **Flask-CORS**: Suporte a CORS
- **Mercado Pago API**: Gateway de pagamentos
- **QRCode**: Geração de QR Codes PIX

### Frontend (React)
- **React 19**: Framework frontend
- **Vite**: Build tool
- **Tailwind CSS**: Framework CSS
- **Radix UI**: Componentes de interface
- **Lucide React**: Ícones
- **React Router**: Roteamento

## 🚀 Como Executar

### Pré-requisitos
- Python 3.11+
- Node.js 20+
- pnpm

### Backend
```bash
cd patas-do-bem-backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou venv\Scripts\activate  # Windows
pip install -r requirements.txt
python src/main.py
```

### Frontend (Desenvolvimento)
```bash
cd patas-do-bem-frontend
pnpm install
pnpm run dev
```

### Build de Produção
```bash
cd patas-do-bem-frontend
pnpm run build
# Copiar dist/* para patas-do-bem-backend/src/static/
```

## ⚙️ Configuração

### Variáveis de Ambiente
Crie um arquivo `.env` no diretório do backend:

```env
# Mercado Pago (obrigatório para pagamentos reais)
MP_ACCESS_TOKEN=seu_access_token_aqui
MP_PUBLIC_KEY=sua_public_key_aqui

# PIX
PIX_KEY=32999999999
PIX_RECIPIENT_NAME=Associação Patas do Bem

# Base URL (para webhooks)
BASE_URL=https://seu-dominio.com
```

### Configuração do Mercado Pago
1. Crie uma conta no [Mercado Pago Developers](https://www.mercadopago.com.br/developers)
2. Obtenha suas credenciais de teste/produção
3. Configure as variáveis de ambiente
4. Configure a URL de webhook: `https://seu-dominio.com/api/webhooks/mercadopago`

## 📁 Estrutura do Projeto

```
patas-do-bem-backend/
├── src/
│   ├── models/          # Modelos do banco de dados
│   ├── routes/          # Rotas da API
│   ├── services/        # Serviços (pagamentos, etc.)
│   ├── static/          # Arquivos estáticos (frontend build)
│   └── main.py          # Aplicação principal
└── requirements.txt

patas-do-bem-frontend/
├── src/
│   ├── components/      # Componentes React
│   ├── pages/          # Páginas da aplicação
│   ├── services/       # Serviços (API calls)
│   └── App.jsx         # Componente principal
└── package.json
```

## 🔧 APIs Disponíveis

### Configurações
- `GET /api/config` - Configurações gerais do site

### Doações
- `POST /api/donations` - Criar doação
- `GET /api/donations` - Listar doações (admin)

### Rifas
- `GET /api/raffles` - Listar rifas ativas
- `GET /api/raffles/{id}` - Detalhes da rifa
- `POST /api/raffles/{id}/tickets` - Comprar números
- `POST /api/raffles` - Criar rifa (admin)

### Pagamentos
- `POST /api/payments/pix` - Criar pagamento PIX
- `POST /api/payments/credit-card` - Pagamento cartão
- `POST /api/payments/recurring` - Assinatura recorrente
- `POST /api/payments/boleto` - Gerar boleto
- `GET /api/payments/{id}/status` - Status do pagamento

### Contato
- `POST /api/contact` - Enviar mensagem

## 🎨 Design

- **Cores**: Laranja (#EA580C) e amarelo como cores principais
- **Logo**: Integrado no header e footer
- **Responsivo**: Funciona em desktop e mobile
- **Acessível**: Componentes com boa usabilidade

## 🔒 Segurança

- Validação de dados no frontend e backend
- Sanitização de inputs
- CORS configurado adequadamente
- Tokens de pagamento seguros
- Webhooks para confirmação

## 📞 Suporte

Para dúvidas sobre configuração ou uso:
- Email: contato@patasdobem.org.br
- WhatsApp: (32) 99999-9999

---

**Desenvolvido com ❤️ para a Associação Patas do Bem**

