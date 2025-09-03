# Projeto Site ONG Patas do Bem - Planejamento

## Informações da ONG
- **Nome**: Associação Patas do Bem - Proteção Animal de Santos Dumont/MG
- **História**: 10 anos de atuação, iniciou com Projeto Castra Cat
- **Atividades**: Castrações, resgates, adoções, voluntariado, eventos, parcerias
- **Logo**: Disponível (pata com coração no centro, cores laranja/amarelo e preto)

## Estrutura do Site

### 1. Home 🐾
- Seção hero com missão da ONG
- Quem somos (história e Projeto Castra Cat)
- Galeria de fotos dos animais
- Histórias de impacto
- Banner/card fixo para rifas ativas (destaque)
- Call-to-action para doações

### 2. Apoie ❤️
- **Prioridade**: Assinaturas mensais com cobrança recorrente
- Planos: R$20, R$50, R$100
- Doações avulsas
- Métodos de pagamento: Pix, cartão (crédito/débito), boleto
- Sistema de cobrança recorrente no cartão

### 3. Contato 📞
- Links para redes sociais (Instagram, Facebook, TikTok)
- WhatsApp direto
- E-mail institucional
- Formulário de contato

### 4. Rifas 🎟️
- Página pública: rifas abertas com descrição, foto, valor, números
- Seleção de números e pagamento
- Confirmação de compra
- **Área administrativa restrita**:
  - Criar nova rifa
  - Gerenciar participantes
  - Acompanhar números vendidos
  - Encerrar rifas

## Arquitetura Técnica

### Backend (Flask)
- API REST para gerenciamento de dados
- Sistema de autenticação para área administrativa
- Integração com gateways de pagamento brasileiros
- Banco de dados SQLite para desenvolvimento
- Endpoints principais:
  - `/api/donations` - Doações e assinaturas
  - `/api/raffles` - Gerenciamento de rifas
  - `/api/admin` - Área administrativa
  - `/api/auth` - Autenticação

### Frontend (React)
- Interface responsiva e moderna
- Componentes reutilizáveis
- Integração com APIs de pagamento
- Dashboard administrativo
- Design focado em conversão para doações

### Funcionalidades Críticas
1. **Sistema de Doações Recorrentes**
   - Integração com gateway de pagamento
   - Gestão de assinaturas mensais
   - Processamento de cartão de crédito

2. **Sistema de Rifas**
   - Criação e gestão de rifas
   - Seleção de números
   - Controle de disponibilidade
   - Área administrativa completa

3. **Pagamentos**
   - Pix (QR Code e copia e cola)
   - Cartão de crédito/débito
   - Boleto bancário
   - Cobrança recorrente

## Próximos Passos
1. Coletar imagens de animais e assets visuais
2. Desenvolver backend Flask com APIs
3. Criar frontend React responsivo
4. Integrar sistemas de pagamento
5. Implementar área administrativa
6. Testes e deploy do protótipo

