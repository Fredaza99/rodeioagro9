/**
 * Sistema de Geração de PDFs para Rodeio Agronegócio
 * Versão limpa e funcional
 */

class PDFGenerator {
    constructor() {
        this.jsPDF = null;
        this.initializeLibraries();
    }

    async initializeLibraries() {
        // Aguardar o carregamento das bibliotecas
        let attempts = 0;
        const maxAttempts = 50;
        
        while (attempts < maxAttempts) {
            if (typeof window.jspdf !== 'undefined' && window.jspdf.jsPDF) {
                this.jsPDF = window.jspdf.jsPDF;
                
                // Verificar se autoTable está disponível
                const testDoc = new this.jsPDF();
                if (typeof testDoc.autoTable === 'function') {
                    console.log('Bibliotecas PDF carregadas com sucesso!');
                    return;
                }
            }
            
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        throw new Error('Erro ao carregar bibliotecas PDF. Recarregue a página.');
    }

    // Função para formatar data
    formatDate(date) {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleDateString('pt-BR');
    }

    // Função para formatar número
    formatNumber(num) {
        if (!num && num !== 0) return '';
        return Number(num).toLocaleString('pt-BR');
    }

    // Função auxiliar para converter string em número
    parseNumber(value) {
        if (!value || value === '') return 0;
        // Remove pontos de milhares e substitui vírgula por ponto
        const cleanValue = value.toString().replace(/\./g, '').replace(',', '.');
        const num = parseFloat(cleanValue);
        return isNaN(num) ? 0 : num;
    }

    // Cabeçalho padrão para todos os PDFs
    addHeader(doc, title) {
        const pageWidth = doc.internal.pageSize.width;
        
        // Logo/Título da empresa
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text('RODEIO AGRONEGÓCIO', pageWidth / 2, 20, { align: 'center' });
        
        // Título do relatório
        doc.setFontSize(16);
        doc.setFont('helvetica', 'normal');
        doc.text(title, pageWidth / 2, 35, { align: 'center' });
        
        // Data de geração
        doc.setFontSize(10);
        doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, pageWidth / 2, 45, { align: 'center' });
        
        // Linha separadora
        doc.setLineWidth(0.5);
        doc.line(20, 50, pageWidth - 20, 50);
        
        return 60; // Retorna a posição Y após o cabeçalho
    }

    // Rodapé padrão
    addFooter(doc) {
        const pageHeight = doc.internal.pageSize.height;
        const pageWidth = doc.internal.pageSize.width;
        
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text('© 2024 Rodeio Agronegócio - Todos os direitos reservados', pageWidth / 2, pageHeight - 10, { align: 'center' });
    }

    // Obter dados da tabela
    getTableData() {
        const table = document.getElementById('clientHistoryTable');
        if (!table) {
            console.error('Tabela clientHistoryTable não encontrada');
            return [];
        }
        
        const rows = table.querySelectorAll('tbody tr');
        const data = [];
        
        console.log(`Encontradas ${rows.length} linhas na tabela`);
        
        rows.forEach((row, index) => {
            const cells = row.querySelectorAll('td');
            console.log(`Linha ${index}: ${cells.length} células`);
            
            if (cells.length >= 7) {
                const rowData = [
                    cells[1].textContent.trim(), // Cliente
                    cells[2].textContent.trim(), // Produto
                    cells[3].textContent.trim(), // Data
                    cells[4].textContent.trim(), // Entrada
                    cells[5].textContent.trim(), // Saída
                    cells[6].textContent.trim()  // Saldo
                ];
                
                console.log(`Dados da linha ${index}:`, rowData);
                data.push(rowData);
            }
        });
        
        console.log(`Total de dados extraídos: ${data.length}`);
        return data;
    }

    // 1. PDF da tabela atual
    async generateTablePDF() {
        try {
            await this.initializeLibraries();
            const doc = new this.jsPDF();
            
            const startY = this.addHeader(doc, 'TABELA DE CLIENTES');
            
            // Obter dados da tabela
            const tableData = this.getTableData();
            
            if (tableData.length === 0) {
                doc.setFontSize(12);
                doc.text('Nenhum dado encontrado na tabela.', 20, startY + 20);
            } else {
                // Configurar a tabela
                doc.autoTable({
                    head: [['Cliente', 'Produto', 'Data', 'Entrada', 'Saída', 'Saldo']],
                    body: tableData,
                    startY: startY,
                    styles: {
                        fontSize: 8,
                        cellPadding: 3,
                    },
                    headStyles: {
                        fillColor: [66, 133, 244],
                        textColor: 255,
                        fontStyle: 'bold'
                    },
                    columnStyles: {
                        3: { halign: 'right' }, // Entrada
                        4: { halign: 'right' }, // Saída
                        5: { halign: 'right' }  // Saldo
                    },
                    didParseCell: function(data) {
                        // Colorir saldo positivo/negativo
                        if (data.column.index === 5) {
                            const value = parseFloat(data.cell.raw);
                            if (value > 0) {
                                data.cell.styles.textColor = [0, 128, 0]; // Verde
                            } else if (value < 0) {
                                data.cell.styles.textColor = [255, 0, 0]; // Vermelho
                            }
                        }
                    }
                });
            }
            
            this.addFooter(doc);
            doc.save(`tabela_clientes_${new Date().toISOString().split('T')[0]}.pdf`);
            
        } catch (error) {
            console.error('Erro ao gerar PDF da tabela:', error);
            alert('Erro ao gerar PDF da tabela. Verifique o console para mais detalhes.');
        }
    }

    // 2. Relatório de produtos (usa fallback)
    async generateProductMovementReport() {
        try {
            await this.initializeLibraries();
            
            // Usar função de fallback que funciona com dados da tabela
            const doc = window.pdfFallback.generateProductReportFallback(this);
            
            doc.save(`relatorio_produtos_${new Date().toISOString().split('T')[0]}.pdf`);
            
        } catch (error) {
            console.error('Erro ao gerar relatório de produtos:', error);
            alert('Erro ao gerar relatório de produtos. Verifique o console para mais detalhes.');
        }
    }

    // 3. Relatório por cliente (usa fallback)
    async generateClientReport() {
        try {
            await this.initializeLibraries();
            
            // Usar função de fallback que funciona com dados da tabela
            const doc = window.pdfFallback.generateClientReportFallback(this);
            
            doc.save(`relatorio_clientes_${new Date().toISOString().split('T')[0]}.pdf`);
            
        } catch (error) {
            console.error('Erro ao gerar relatório de clientes:', error);
            alert('Erro ao gerar relatório de clientes. Verifique o console para mais detalhes.');
        }
    }

    // 4. Matriz produto × cliente (usa fallback)
    async generateProductClientMatrix() {
        try {
            await this.initializeLibraries();
            
            // Usar função de fallback que funciona com dados da tabela
            const doc = window.pdfFallback.generateMatrixReportFallback(this);
            
            doc.save(`matriz_produto_cliente_${new Date().toISOString().split('T')[0]}.pdf`);
            
        } catch (error) {
            console.error('Erro ao gerar matriz produto-cliente:', error);
            alert('Erro ao gerar matriz produto-cliente. Verifique o console para mais detalhes.');
        }
    }
}

// Tornar a classe PDFGenerator disponível globalmente
window.PDFGenerator = PDFGenerator;

// Funções globais para serem chamadas pelos botões (legacy)
window.generateTablePDF = async () => {
    if (!window.globalPDFGenerator) {
        window.globalPDFGenerator = new PDFGenerator();
    }
    return await window.globalPDFGenerator.generateTablePDF();
};

window.generateProductMovementReport = async () => {
    if (!window.globalPDFGenerator) {
        window.globalPDFGenerator = new PDFGenerator();
    }
    return await window.globalPDFGenerator.generateProductMovementReport();
};

window.generateClientReport = async () => {
    if (!window.globalPDFGenerator) {
        window.globalPDFGenerator = new PDFGenerator();
    }
    return await window.globalPDFGenerator.generateClientReport();
};

window.generateProductClientMatrix = async () => {
    if (!window.globalPDFGenerator) {
        window.globalPDFGenerator = new PDFGenerator();
    }
    return await window.globalPDFGenerator.generateProductClientMatrix();
};
