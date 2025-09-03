# 🐾 Instruções para Windows - Patas do Bem

## 📋 Pré-requisitos

Antes de executar o projeto, certifique-se de ter instalado:

### 1. Python 3.11 ou superior
- Baixe em: https://www.python.org/downloads/
- **IMPORTANTE**: Durante a instalação, marque a opção "Add Python to PATH"

### 2. Node.js 20 ou superior
- Baixe em: https://nodejs.org/
- Escolha a versão LTS (recomendada)

### 3. pnpm (gerenciador de pacotes)
Após instalar o Node.js, abra o Prompt de Comando (cmd) como Administrador e execute:
```cmd
npm install -g pnpm
```

## 🚀 Execução com Um Único Comando

1. **Extraia o projeto** para uma pasta de sua escolha (ex: `C:\patas-do-bem\`)

2. **Abra o Prompt de Comando** na pasta do projeto:
   - Navegue até a pasta onde extraiu o projeto
   - Ou abra a pasta no Windows Explorer, digite `cmd` na barra de endereços e pressione Enter

3. **Execute o script de instalação e execução**:
   ```cmd
   run.bat
   ```

## 📝 O que o script faz automaticamente:

1. ✅ Navega para o diretório do backend
2. ✅ Cria um ambiente virtual Python
3. ✅ Ativa o ambiente virtual
4. ✅ Instala todas as dependências do backend
5. ✅ Navega para o diretório do frontend
6. ✅ Instala todas as dependências do frontend
7. ✅ Constrói o frontend para produção
8. ✅ Copia os arquivos do frontend para o backend
9. ✅ Inicia o servidor

## 🌐 Acessando a aplicação

Após a execução bem-sucedida do script, a aplicação estará disponível em:
- **URL**: http://localhost:5000
- **Frontend**: Interface completa da ONG
- **Backend**: API REST para gerenciamento

## 🔧 Correções Implementadas

### Problemas de Visibilidade dos Botões - CORRIGIDOS ✅

Os seguintes problemas foram identificados e corrigidos:

1. **Botões sem bordas visíveis**: Adicionadas bordas com contraste adequado
2. **Botões "ghost" invisíveis**: Implementado estilo com borda transparente que aparece no hover
3. **Radio buttons pouco visíveis**: Aumentada a espessura da borda e melhorado o contraste
4. **Falta de feedback visual**: Adicionadas sombras e efeitos de hover

### Melhorias Implementadas:

- ✅ Bordas mais visíveis em todos os tipos de botão
- ✅ Melhor contraste de cores
- ✅ Efeitos de hover mais pronunciados
- ✅ Sombras sutis para melhor definição
- ✅ Compatibilidade com modo claro e escuro
- ✅ Ícones sempre visíveis

## 🆘 Solução de Problemas

### Erro: "Python não é reconhecido"
```cmd
# Reinstale o Python marcando "Add to PATH"
# Ou adicione manualmente ao PATH do Windows
```

### Erro: "pnpm não é reconhecido"
```cmd
npm install -g pnpm
```

### Erro: "Acesso negado"
```cmd
# Execute o cmd como Administrador
# Clique com botão direito no cmd e escolha "Executar como administrador"
```

### Porta 5000 já está em uso
```cmd
# Pare outros serviços na porta 5000
# Ou edite o arquivo src/main.py no backend para usar outra porta
```

## 📱 Funcionalidades Disponíveis

- 🏠 **Página Inicial**: Apresentação da ONG e estatísticas
- ❤️ **Apoie**: Sistema de doações únicas e recorrentes
- 🎟️ **Rifas**: Criação e participação em rifas
- 📞 **Contato**: Formulário de contato
- 👨‍💼 **Admin**: Painel administrativo (acesso restrito)

## 🔐 Configuração de Pagamentos (Opcional)

Para ativar pagamentos reais com Mercado Pago:

1. Crie uma conta em: https://www.mercadopago.com.br/developers
2. Obtenha suas credenciais
3. Crie um arquivo `.env` na pasta `patas-do-bem-backend/`:

```env
MP_ACCESS_TOKEN=seu_access_token_aqui
MP_PUBLIC_KEY=sua_public_key_aqui
PIX_KEY=32999999999
PIX_RECIPIENT_NAME=Associação Patas do Bem
```

## 📞 Suporte

Se encontrar problemas:
1. Verifique se todos os pré-requisitos estão instalados
2. Execute o cmd como Administrador
3. Verifique se não há antivírus bloqueando a execução
4. Consulte os logs no terminal para identificar erros específicos

---

**🎉 Projeto otimizado para Windows com execução simplificada!**

