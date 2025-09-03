# 🐾 Instruções de Instalação - Patas do Bem

## 📦 Conteúdo do Projeto

O arquivo ZIP contém:
- **patas-do-bem-backend/**: Servidor Flask (Python)
- **patas-do-bem-frontend/**: Interface React (JavaScript)
- **patas-do-bem-assets/**: Imagens e recursos visuais
- **Documentação**: README.md, esquemas e especificações

## 🛠️ Pré-requisitos

### 1. Python 3.11+
```bash
# Verificar versão
python --version
# ou
python3 --version
```

### 2. Node.js 20+ e pnpm
```bash
# Instalar Node.js: https://nodejs.org
node --version

# Instalar pnpm
npm install -g pnpm
```

## 🚀 Instalação Passo a Passo

### 1. Extrair o Projeto
```bash
unzip patas-do-bem-projeto.zip
cd patas-do-bem-projeto/
```

### 2. Configurar Backend (Flask)
```bash
cd patas-do-bem-backend

# Criar ambiente virtual
python -m venv venv

# Ativar ambiente virtual
# Linux/Mac:
source venv/bin/activate
# Windows:
venv\Scripts\activate

# Instalar dependências
pip install -r requirements.txt

# Testar backend
python src/main.py
```

O backend estará rodando em: http://localhost:5000

### 3. Configurar Frontend (React)
```bash
# Em outro terminal
cd patas-do-bem-frontend

# Instalar dependências
pnpm install

# Executar em desenvolvimento
pnpm run dev
```

O frontend estará rodando em: http://localhost:5173

## ⚙️ Configuração de Pagamentos

### Para Pagamentos Reais (Mercado Pago)

1. **Criar conta no Mercado Pago Developers**
   - Acesse: https://www.mercadopago.com.br/developers
   - Crie uma aplicação
   - Obtenha as credenciais

2. **Configurar Variáveis de Ambiente**
   
   Crie arquivo `.env` em `patas-do-bem-backend/`:
   ```env
   # Mercado Pago - OBRIGATÓRIO para pagamentos reais
   MP_ACCESS_TOKEN=APP_USR-seu_access_token_aqui
   MP_PUBLIC_KEY=APP_USR-sua_public_key_aqui
   
   # PIX da ONG
   PIX_KEY=32999999999
   PIX_RECIPIENT_NAME=Associação Patas do Bem
   
   # URL base (para webhooks em produção)
   BASE_URL=https://seu-dominio.com
   ```

3. **Configurar Webhooks**
   - No painel do Mercado Pago
   - URL: `https://seu-dominio.com/api/webhooks/mercadopago`
   - Eventos: `payment`, `subscription`

## 🌐 Deploy em Produção

### Opção 1: Servidor Próprio

1. **Preparar Produção**
   ```bash
   # Build do frontend
   cd patas-do-bem-frontend
   pnpm run build
   
   # Copiar para backend
   cp -r dist/* ../patas-do-bem-backend/src/static/
   ```

2. **Executar com Gunicorn**
   ```bash
   cd patas-do-bem-backend
   pip install gunicorn
   gunicorn -w 4 -b 0.0.0.0:5000 src.main:app
   ```

### Opção 2: Heroku

1. **Preparar Heroku**
   ```bash
   # Instalar Heroku CLI
   # Criar Procfile no backend:
   echo "web: gunicorn -w 4 -b 0.0.0.0:\$PORT src.main:app" > Procfile
   ```

2. **Deploy**
   ```bash
   heroku create patas-do-bem
   git add .
   git commit -m "Deploy inicial"
   git push heroku main
   ```

### Opção 3: Vercel/Netlify

1. **Frontend**: Deploy direto da pasta `dist/`
2. **Backend**: Usar Railway, Render ou similar

## 🔧 Configurações Importantes

### 1. Banco de Dados
- **Desenvolvimento**: SQLite (incluído)
- **Produção**: PostgreSQL recomendado

### 2. Segurança
- Alterar `SECRET_KEY` no Flask
- Configurar HTTPS em produção
- Validar dados de entrada

### 3. Email (Opcional)
Para notificações por email, adicionar:
```env
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=seu_email@gmail.com
SMTP_PASSWORD=sua_senha_app
```

## 📱 Funcionalidades Principais

### ✅ Sistema de Doações
- Doações únicas e recorrentes
- PIX, cartão e boleto
- Painel administrativo

### ✅ Sistema de Rifas
- Criação e gestão de rifas
- Seleção de números
- Controle de vendas

### ✅ Área Administrativa
- Dashboard com estatísticas
- Gestão de rifas
- Histórico de doações
- Mensagens de contato

## 🆘 Solução de Problemas

### Erro de Módulo Python
```bash
# Verificar se está no ambiente virtual
which python
# Reinstalar dependências
pip install -r requirements.txt
```

### Erro de Dependências Node
```bash
# Limpar cache
pnpm store prune
# Reinstalar
rm -rf node_modules
pnpm install
```

### Problemas de CORS
- Verificar se CORS está configurado no Flask
- Verificar proxy no vite.config.js

## 📞 Suporte

Para dúvidas técnicas:
1. Verificar logs do console (F12 no navegador)
2. Verificar logs do Flask no terminal
3. Consultar documentação do Mercado Pago

---

**🎉 Projeto desenvolvido para a Associação Patas do Bem**
**Proteção Animal de Santos Dumont/MG**

