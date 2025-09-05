# Sistema de Geração de PDFs - Rodeio Agronegócio

## 📋 Funcionalidades Implementadas

### 1. **PDF da Tabela Atual**
- Gera PDF da tabela de clientes exibida na página
- Inclui: Cliente, Produto, Data, Entrada, Saída, Saldo
- Saldos positivos em verde, negativos em vermelho

### 2. **Relatório de Movimentação de Produtos**
- Relatório completo agrupado por produto
- Mostra todas as movimentações de cada produto
- Inclui totais de entradas e saídas

### 3. **Relatório por Cliente**
- Relatório detalhado por cliente
- Resumo com totais de entradas, saídas e saldo final
- Lista todas as movimentações do cliente

### 4. **Matriz Produto × Cliente**
- Relatório em formato matriz
- Mostra saldos cruzados entre produtos e clientes
- Formato paisagem para melhor visualização

## 🎨 Interface

Os botões de PDF foram adicionados na página `cliente.html` com:
- Design moderno com gradientes
- Ícones intuitivos para cada tipo de relatório
- Animações hover e efeitos visuais
- Layout responsivo para dispositivos móveis

## 🔧 Tecnologias Utilizadas

- **jsPDF 2.5.1**: Biblioteca principal para geração de PDFs
- **jsPDF-AutoTable 3.5.31**: Plugin para tabelas formatadas
- **JavaScript ES6+**: Classe PDFGenerator modular
- **CSS3**: Estilos modernos com gradientes e animações

## 📁 Arquivos Criados/Modificados

### Novos Arquivos:
- `pdf-generator.js`: Classe principal com todas as funcionalidades

### Arquivos Modificados:
- `cliente.html`: Adicionados botões e scripts
- `styles.css`: Estilos para os botões de PDF

## 🚀 Como Usar

1. **Acesse a página cliente.html**
2. **Localize a seção "Relatórios em PDF"**
3. **Clique no botão desejado:**
   - 📄 **Tabela Atual**: PDF da tabela visível
   - 📦 **Movimentação de Produtos**: Relatório por produto
   - 👥 **Relatório por Cliente**: Relatório por cliente
   - 📊 **Matriz Produto × Cliente**: Relatório cruzado

## 📊 Recursos dos PDFs

### Cabeçalho Padrão:
- Logo/Nome da empresa: "RODEIO AGRONEGÓCIO"
- Título do relatório
- Data e hora de geração

### Formatação:
- Números formatados em português (1.234,56)
- Datas no formato brasileiro (dd/mm/aaaa)
- Cores diferenciadas para saldos positivos/negativos
- Tabelas com cabeçalhos destacados

### Rodapé:
- Copyright da empresa
- Numeração automática de páginas

## 🔄 Integração com Firebase

O sistema está integrado com o Firebase para:
- Buscar dados em tempo real
- Processar transações atualizadas
- Gerar relatórios com informações mais recentes

## 📱 Responsividade

Os botões de PDF são totalmente responsivos:
- **Desktop**: Grid de 4 colunas
- **Tablet**: Grid de 2 colunas
- **Mobile**: Coluna única

## 🎯 Próximos Passos

Para expandir o sistema, você pode:
1. Adicionar filtros de data nos relatórios
2. Implementar relatórios personalizados
3. Adicionar gráficos aos PDFs
4. Criar templates de relatório personalizáveis
5. Implementar envio de PDFs por email

## 🐛 Solução de Problemas

### PDF não está sendo gerado:
1. Verifique se as bibliotecas jsPDF estão carregadas
2. Abra o console do navegador para ver erros
3. Certifique-se de que há dados na tabela

### Formatação incorreta:
1. Verifique a conexão com o Firebase
2. Confirme se os dados estão no formato esperado
3. Teste com dados de exemplo

## 📞 Suporte

Para dúvidas ou problemas, verifique:
1. Console do navegador para erros JavaScript
2. Conexão com o Firebase
3. Formato dos dados na base de dados

---

**Desenvolvido para Rodeio Agronegócio**
*Sistema completo de geração de relatórios em PDF*
