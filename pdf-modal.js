/**
 * Modal para Geração de PDFs - Rodeio Agronegócio
 * Sistema compacto com modal para seleção de relatórios
 */

// Função para criar o modal HTML
function createPDFModal() {
    // Verificar se o modal já existe
    if (document.getElementById('pdfModal')) {
        return;
    }
    
    // Criar o modal HTML
    const modalHTML = `
        <div id="pdfModal" class="pdf-modal">
            <div class="pdf-modal-content">
                <div class="pdf-modal-header">
                    <h3><i class="fas fa-file-pdf"></i> Gerar Relatório PDF</h3>
                    <button class="pdf-modal-close" onclick="closePDFModal()">&times;</button>
                </div>
                <div class="pdf-modal-body">
                    <div class="pdf-options">
                        <button class="pdf-option-btn" onclick="generatePDF('table')">
                            <i class="fas fa-table"></i>
                            <span>Tabela Atual</span>
                            <small>PDF da tabela exibida</small>
                        </button>
                        <button class="pdf-option-btn" onclick="generatePDF('products')">
                            <i class="fas fa-boxes"></i>
                            <span>Movimentação de Produtos</span>
                            <small>Relatório por produto</small>
                        </button>
                        <button class="pdf-option-btn" onclick="generatePDF('clients')">
                            <i class="fas fa-users"></i>
                            <span>Relatório por Cliente</span>
                            <small>Relatório detalhado por cliente</small>
                        </button>
                        <button class="pdf-option-btn" onclick="generatePDF('matrix')">
                            <i class="fas fa-chart-bar"></i>
                            <span>Matriz Produto × Cliente</span>
                            <small>Relatório cruzado</small>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Adicionar o modal ao body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Funções globais para controle do modal
function openPDFModal() {
    // Criar o modal se não existir
    createPDFModal();
    
    const modal = document.getElementById('pdfModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // Prevenir scroll
    }
}

function closePDFModal() {
    const modal = document.getElementById('pdfModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto'; // Restaurar scroll
    }
}

// Função para gerar PDF baseado no tipo
async function generatePDF(type) {
    const loadingBtn = event.target.closest('.pdf-option-btn');
    const originalContent = loadingBtn.innerHTML;
    
    // Mostrar loading
    loadingBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Gerando...';
    loadingBtn.disabled = true;
    
    try {
        // Criar instância do gerador se não existir
        if (!window.globalPDFGenerator) {
            window.globalPDFGenerator = new PDFGenerator();
        }
        
        const pdfGen = window.globalPDFGenerator;
        
        switch(type) {
            case 'table':
                await pdfGen.generateTablePDF();
                break;
            case 'products':
                await pdfGen.generateProductMovementReport();
                break;
            case 'clients':
                await pdfGen.generateClientReport();
                break;
            case 'matrix':
                await pdfGen.generateProductClientMatrix();
                break;
            default:
                throw new Error('Tipo de relatório não reconhecido');
        }
        
        // Fechar modal após sucesso
        closePDFModal();
        
        // Mostrar notificação de sucesso
        showNotification('PDF gerado com sucesso!', 'success');
        
    } catch (error) {
        console.error('Erro ao gerar PDF:', error);
        showNotification('Erro ao gerar PDF: ' + error.message, 'error');
    } finally {
        // Restaurar botão
        loadingBtn.innerHTML = originalContent;
        loadingBtn.disabled = false;
    }
}

// Função para mostrar notificações
function showNotification(message, type = 'info') {
    // Remover notificação anterior se existir
    const existingNotification = document.querySelector('.pdf-notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `pdf-notification pdf-notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
        <button onclick="this.parentElement.remove()" class="pdf-notification-close">&times;</button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remover após 5 segundos
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Fechar modal ao clicar fora
document.addEventListener('click', function(event) {
    const modal = document.getElementById('pdfModal');
    if (event.target === modal) {
        closePDFModal();
    }
});

// Fechar modal com ESC
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closePDFModal();
    }
});

// Modal será criado automaticamente quando openPDFModal() for chamado
// Não é necessária inicialização prévia
