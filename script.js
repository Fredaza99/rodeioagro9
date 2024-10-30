// Import Firestore functions
import { getFirestore, collection, addDoc, getDocs, doc, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

// Inicializa Firestore
const db = getFirestore();

// Certificar que o DOM está pronto antes de manipular elementos
document.addEventListener('DOMContentLoaded', () => {
    // Carrega os clientes ao carregar o DOM
    loadClientsFromFirestore();

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

// Função para carregar e exibir clientes de forma consolidada ou detalhada
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
        } else {
            console.error("Erro: Tabela detalhada não encontrada no DOM.");
        }

        // Preencher Tabela Consolidada
        const aggregatedData = {};
        clients.forEach(client => {
            const key = `${client.clientName} | ${client.productName}`;

            if (!aggregatedData[key]) {
                aggregatedData[key] = {
                    clientName: client.clientName,
                    productName: client.productName,
                    entryQuantity: 0,
                    exitQuantity: 0,
                    saldo: 0
                };
            }

            aggregatedData[key].entryQuantity += client.entryQuantity;
            aggregatedData[key].exitQuantity += client.exitQuantity;
            aggregatedData[key].saldo += (client.entryQuantity - client.exitQuantity);
        });

        console.log("Dados agregados para tabela consolidada:", aggregatedData);

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

    } catch (error) {
        console.error('Erro ao carregar clientes:', error);
    }
}

// Função de Filtragem
function filterTable() {
    const searchInput = document.getElementById('clientSearchInput').value.trim().toUpperCase().replace(/\s+/g, ' ');

    if (searchInput !== "") {
        // Mostrar Tabela Detalhada e ocultar Tabela Consolidada
        document.getElementById('consolidatedTable').style.display = 'none';
        document.getElementById('clientHistoryTable').style.display = 'table';

        const tableRows = document.querySelectorAll('#clientHistoryTable tbody tr');
        tableRows.forEach(row => {
            const clientName = row.cells[1].textContent.trim().toUpperCase();
            if (clientName.includes(searchInput)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    } else {
        // Mostrar Tabela Consolidada e ocultar Tabela Detalhada
        document.getElementById('consolidatedTable').style.display = 'table';
        document.getElementById('clientHistoryTable').style.display = 'none';
    }
}

// Função para definir o tipo de transação e destacar o botão ativo
let transactionType = "Entrada";
function setTransactionType(type) {
    transactionType = type;
    document.getElementById("entryButton")?.classList.toggle("active", type === "Entrada");
    document.getElementById("exitButton")?.classList.toggle("active", type === "Saída");
}



























































