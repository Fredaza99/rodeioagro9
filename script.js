// Import Firestore functions
import { getFirestore, collection, addDoc, getDocs, doc, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

// Inicializa Firestore
const db = getFirestore();

// Certificar que o DOM está pronto antes de manipular elementos
document.addEventListener('DOMContentLoaded', () => {
    // Aguardar até que a tabela esteja disponível no DOM
    const waitForTable = setInterval(() => {
        const clientHistoryTableBody = document.querySelector('#clientHistoryTable tbody');
        if (clientHistoryTableBody) {
            clearInterval(waitForTable);
            // Carrega os clientes após confirmar que a tabela está no DOM
            loadClientsFromFirestore();
        }
    }, 100);

    // Configura eventos de clique para os botões de transação
    const entryButton = document.getElementById("entryButton");
    const exitButton = document.getElementById("exitButton");

    if (entryButton && exitButton) {
        entryButton.addEventListener("click", () => setTransactionType("Entrada"));
        exitButton.addEventListener("click", () => setTransactionType("Saída"));
    }

    // Evento de filtro
    const clientSearchInput = document.getElementById('clientSearchInput');
    if (clientSearchInput) {
        clientSearchInput.addEventListener('input', filterTable);
    }

    // Evento de submissão do formulário de cliente
    const clientForm = document.getElementById('clientForm');
    if (clientForm) {
        clientForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const clientNameElement = document.getElementById('clientName');
            const productNameElement = document.getElementById('productName');
            const dateElement = document.getElementById('date');
            const quantityElement = document.getElementById('quantity');

            if (clientNameElement && productNameElement && dateElement && quantityElement) {
                const clientName = clientNameElement.value;
                const productName = productNameElement.value;
                const date = dateElement.value;
                const quantity = parseInt(quantityElement.value);

                // Define os dados do cliente com base no tipo de transação
                const client = {
                    clientName,
                    productName,
                    date,
                    entryQuantity: transactionType === "Entrada" ? quantity : 0,
                    exitQuantity: transactionType === "Saída" ? quantity : 0,
                    saldo: transactionType === "Entrada" ? quantity : -quantity
                };

                await addClientToFirestore(client);
                window.location.href = 'cliente.html'; // Redireciona após salvar
            } else {
                console.error("Erro: Elementos do formulário não encontrados.");
            }
        });
    }
});

// Função para adicionar um cliente ao Firestore
async function addClientToFirestore(client) {
    try {
        await addDoc(collection(db, 'clients'), client);
        console.log('Cliente salvo no Firestore');
    } catch (error) {
        console.error('Erro ao salvar cliente:', error);
    }
}

// Função para carregar e exibir clientes de forma detalhada
async function loadClientsFromFirestore() {
    try {
        console.log("Carregando clientes do Firestore...");
        const clientsCollection = collection(db, 'clients');
        const querySnapshot = await getDocs(clientsCollection);

        if (querySnapshot.empty) {
            console.warn("Nenhum cliente encontrado no Firestore.");
            return;
        }

        // Extrair e ordenar dados dos clientes
        const clients = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        console.log("Clientes carregados:", clients);

        clients.sort((a, b) => {
            const nameComparison = a.clientName.localeCompare(b.clientName);
            if (nameComparison === 0) {
                return new Date(b.date).getTime() - new Date(a.date).getTime(); // Ordena por data decrescente
            }
            return nameComparison;
        });

        // Preencher Tabela Detalhada
        const clientHistoryTableBody = document.querySelector('#clientHistoryTable tbody');
        if (clientHistoryTableBody) {
            clientHistoryTableBody.innerHTML = ''; // Limpa o conteúdo da tabela detalhada

            clients.forEach(client => {
                const row = document.createElement('tr');
                const action = client.entryQuantity > 0 ? 'Entrada' : 'Saída';

                row.innerHTML = `
                    <td>${action}</td>
                    <td>${client.clientName || ''}</td>
                    <td>${client.productName || ''}</td>
                    <td>${client.date || ''}</td>
                    <td>${client.entryQuantity || 0}</td>
                    <td>${client.exitQuantity || 0}</td>
                    <td>${client.saldo || 0}</td>
                    <td>
                        <button class="edit-client" data-id="${client.id}">Editar</button>
                        <button class="delete-btn" data-id="${client.id}">Excluir</button>
                    </td>
                `;
                clientHistoryTableBody.appendChild(row);
            });

            // Consolidar a Tabela Após Carregar a Tabela Detalhada
            consolidateTable();
        } else {
            console.error("Erro: Tabela detalhada não encontrada no DOM.");
        }

    } catch (error) {
        console.error('Erro ao carregar clientes:', error);
    }
}

// Função para consolidar dados da primeira tabela e preencher a segunda tabela
function consolidateTable() {
    console.log("Consolidando tabela...");

    const clientHistoryTableBody = document.querySelector('#clientHistoryTable tbody');
    if (!clientHistoryTableBody) {
        console.error("Erro: Tabela detalhada não encontrada no DOM.");
        return;
    }

    const tableRows = clientHistoryTableBody.querySelectorAll('tr');
    if (tableRows.length === 0) {
        console.warn("Nenhuma linha encontrada para consolidar.");
        return;
    }

    const aggregatedData = {};

    tableRows.forEach(row => {
        const clientName = row.cells[1].textContent.trim().toUpperCase();
        const productName = row.cells[2].textContent.trim().toUpperCase();
        const entryQuantity = parseFloat(row.cells[4].textContent) || 0;
        const exitQuantity = parseFloat(row.cells[5].textContent) || 0;

        const key = `${clientName} | ${productName}`;

        if (!aggregatedData[key]) {
            aggregatedData[key] = {
                clientName: row.cells[1].textContent.trim(),
                productName: row.cells[2].textContent.trim(),
                entryQuantity: 0,
                exitQuantity: 0,
                saldo: 0
            };
        }

        aggregatedData[key].entryQuantity += entryQuantity;
        aggregatedData[key].exitQuantity += exitQuantity;
        aggregatedData[key].saldo += (entryQuantity - exitQuantity);
    });

    const consolidatedTableBody = document.querySelector('#consolidatedTable tbody');
    if (consolidatedTableBody) {
        consolidatedTableBody.innerHTML = ''; // Limpa o conteúdo da tabela consolidada

        Object.values(aggregatedData).forEach(data => {
            const newRow = document.createElement('tr');
            newRow.innerHTML = `
                <td>${data.clientName}</td>
                <td>${data.productName}</td>
                <td>${data.entryQuantity}</td>
                <td>${data.exitQuantity}</td>
                <td>${data.saldo}</td>
            `;
            consolidatedTableBody.appendChild(newRow);
        });
    } else {
        console.error("Erro: Tabela consolidada não encontrada no DOM.");
    }
}






























































