/**
 * Funções de fallback para geração de PDFs quando não há dados suficientes
 */

// Função para gerar relatório de produtos com dados de exemplo
function generateProductReportFallback(pdfGenerator) {
    const doc = new pdfGenerator.jsPDF();
    const startY = pdfGenerator.addHeader(doc, 'RELATÓRIO DE MOVIMENTAÇÃO DE PRODUTOS');
    
    // Obter dados da tabela
    const tableData = pdfGenerator.getTableData();
    
    if (tableData.length === 0) {
        doc.setFontSize(12);
        doc.text('Nenhuma movimentação encontrada na tabela atual.', 20, startY + 20);
        doc.text('Carregue dados na tabela para gerar este relatório.', 20, startY + 40);
    } else {
        // Agrupar por produto
        const productGroups = {};
        
        tableData.forEach(row => {
            const produto = row[1] || 'Produto não informado';
            if (!productGroups[produto]) {
                productGroups[produto] = [];
            }
            productGroups[produto].push({
                cliente: row[0] || '',
                data: row[2] || '',
                entrada: row[3] || '0',
                saida: row[4] || '0',
                saldo: row[5] || '0'
            });
        });
        
        let currentY = startY;
        
        Object.keys(productGroups).forEach(produto => {
            // Verificar se precisa de nova página
            if (currentY > 250) {
                doc.addPage();
                currentY = pdfGenerator.addHeader(doc, 'RELATÓRIO DE MOVIMENTAÇÃO DE PRODUTOS (cont.)');
            }
            
            // Título do produto
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text(`Produto: ${produto}`, 20, currentY);
            currentY += 10;
            
            // Preparar dados da tabela
            const tableBody = productGroups[produto].map(mov => [
                mov.cliente,
                mov.data,
                mov.entrada,
                mov.saida,
                mov.saldo
            ]);
            
            // Gerar tabela
            doc.autoTable({
                head: [['Cliente', 'Data', 'Entrada', 'Saída', 'Saldo']],
                body: tableBody,
                startY: currentY,
                styles: {
                    fontSize: 8,
                    cellPadding: 2,
                },
                headStyles: {
                    fillColor: [76, 175, 80],
                    textColor: 255,
                    fontStyle: 'bold'
                },
                columnStyles: {
                    2: { halign: 'right' },
                    3: { halign: 'right' },
                    4: { halign: 'right' }
                }
            });
            
            currentY = doc.lastAutoTable.finalY + 15;
        });
    }
    
    pdfGenerator.addFooter(doc);
    return doc;
}

// Função para gerar relatório de clientes com dados de exemplo
function generateClientReportFallback(pdfGenerator) {
    const doc = new pdfGenerator.jsPDF();
    const startY = pdfGenerator.addHeader(doc, 'RELATÓRIO POR CLIENTE');
    
    // Obter dados da tabela
    const tableData = pdfGenerator.getTableData();
    
    if (tableData.length === 0) {
        doc.setFontSize(12);
        doc.text('Nenhum cliente encontrado na tabela atual.', 20, startY + 20);
        doc.text('Carregue dados na tabela para gerar este relatório.', 20, startY + 40);
    } else {
        // Agrupar por cliente
        const clientGroups = {};
        
        tableData.forEach(row => {
            const cliente = row[0] || 'Cliente não informado';
            if (!clientGroups[cliente]) {
                clientGroups[cliente] = [];
            }
            clientGroups[cliente].push({
                produto: row[1] || '',
                data: row[2] || '',
                entrada: pdfGenerator.parseNumber(row[3]) || 0,
                saida: pdfGenerator.parseNumber(row[4]) || 0,
                saldo: pdfGenerator.parseNumber(row[5]) || 0
            });
        });
        
        let currentY = startY;
        
        Object.keys(clientGroups).forEach(cliente => {
            // Verificar se precisa de nova página
            if (currentY > 250) {
                doc.addPage();
                currentY = pdfGenerator.addHeader(doc, 'RELATÓRIO POR CLIENTE (cont.)');
            }
            
            // Título do cliente
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text(`Cliente: ${cliente}`, 20, currentY);
            currentY += 10;
            
            // Calcular totais
            const movements = clientGroups[cliente];
            const totals = movements.reduce((acc, mov) => {
                acc.totalEntradas += mov.entrada;
                acc.totalSaidas += mov.saida;
                acc.saldoFinal += mov.saldo;
                return acc;
            }, { totalEntradas: 0, totalSaidas: 0, saldoFinal: 0 });
            
            // Mostrar resumo
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`Total de Entradas: ${pdfGenerator.formatNumber(totals.totalEntradas)}`, 20, currentY);
            doc.text(`Total de Saídas: ${pdfGenerator.formatNumber(totals.totalSaidas)}`, 120, currentY);
            doc.text(`Saldo Final: ${pdfGenerator.formatNumber(totals.saldoFinal)}`, 20, currentY + 10);
            currentY += 20;
            
            // Preparar dados da tabela
            const tableBody = movements.map(mov => [
                mov.produto,
                mov.data,
                pdfGenerator.formatNumber(mov.entrada),
                pdfGenerator.formatNumber(mov.saida),
                pdfGenerator.formatNumber(mov.saldo)
            ]);
            
            // Gerar tabela
            doc.autoTable({
                head: [['Produto', 'Data', 'Entrada', 'Saída', 'Saldo']],
                body: tableBody,
                startY: currentY,
                styles: {
                    fontSize: 8,
                    cellPadding: 2,
                },
                headStyles: {
                    fillColor: [255, 152, 0],
                    textColor: 255,
                    fontStyle: 'bold'
                },
                columnStyles: {
                    2: { halign: 'right' },
                    3: { halign: 'right' },
                    4: { halign: 'right' }
                }
            });
            
            currentY = doc.lastAutoTable.finalY + 15;
        });
    }
    
    pdfGenerator.addFooter(doc);
    return doc;
}

// Função para gerar matriz produto x cliente
function generateMatrixReportFallback(pdfGenerator) {
    const doc = new pdfGenerator.jsPDF('l'); // Paisagem
    const startY = pdfGenerator.addHeader(doc, 'MATRIZ PRODUTO × CLIENTE');
    
    // Obter dados da tabela
    const tableData = pdfGenerator.getTableData();
    
    if (tableData.length === 0) {
        doc.setFontSize(12);
        doc.text('Nenhum dado encontrado na tabela atual.', 20, startY + 20);
        doc.text('Carregue dados na tabela para gerar este relatório.', 20, startY + 40);
    } else {
        // Criar matriz
        const produtos = [...new Set(tableData.map(row => row[1] || 'Produto não informado'))];
        const clientes = [...new Set(tableData.map(row => row[0] || 'Cliente não informado'))];
        
        // Inicializar matriz
        const matrix = {};
        produtos.forEach(produto => {
            matrix[produto] = {};
            clientes.forEach(cliente => {
                matrix[produto][cliente] = 0;
            });
        });
        
        // Preencher matriz
        tableData.forEach(row => {
            const produto = row[1] || 'Produto não informado';
            const cliente = row[0] || 'Cliente não informado';
            const saldo = pdfGenerator.parseNumber(row[5]) || 0;
            
            if (matrix[produto] && matrix[produto][cliente] !== undefined) {
                matrix[produto][cliente] += saldo;
            }
        });
        
        // Preparar dados para tabela
        const headers = ['Produto', ...clientes];
        const body = produtos.map(produto => {
            const row = [produto];
            clientes.forEach(cliente => {
                const value = matrix[produto][cliente];
                row.push(pdfGenerator.formatNumber(value));
            });
            return row;
        });
        
        // Gerar tabela
        doc.autoTable({
            head: [headers],
            body: body,
            startY: startY,
            styles: {
                fontSize: 7,
                cellPadding: 2,
            },
            headStyles: {
                fillColor: [156, 39, 176],
                textColor: 255,
                fontStyle: 'bold'
            },
            columnStyles: {
                0: { fontStyle: 'bold' }
            }
        });
    }
    
    pdfGenerator.addFooter(doc);
    return doc;
}

// Exportar funções
window.pdfFallback = {
    generateProductReportFallback,
    generateClientReportFallback,
    generateMatrixReportFallback
};
