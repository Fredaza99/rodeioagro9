// Import Firestore functions
import { getFirestore, collection, addDoc, getDocs, doc, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

// Inicializa Firestore
const db = getFirestore();

// Função para carregar e exibir clientes de forma consolidada ou detalhada
async function loadClientsFromFirestore() {
    try {
        const clientsCollection = collection(db, 'clients');
        const querySnapshot = await getDocs(clientsCollection);

        // Extrair e ordenar dados dos clientes
        const clients = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        clients.sort((a, b) => {
            const nameComparison = a.clientName.localeCompare(b.clientName);
            if (nameComparison === 0) {
                return new Date(b.date).getTime() - new Date(a.date).getTime(); // Ordena por data decrescente
            }
            return nameComparison;
        });

        // Preencher Tabela Detalhada
        const clientHistoryTableBody = document.querySelector('#clientHistoryTable tbody');
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

        const consolidatedTableBody = document.querySelector('#consolidatedTable tbody');
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

// Carrega os clientes ao carregar o DOM
document.addEventListener('DOMContentLoaded', loadClientsFromFirestore);

// Configura eventos de clique para os botões de transação
document.getElementById("entryButton").addEventListener("click", () => setTransactionType("Entrada"));
document.getElementById("exitButton").addEventListener("click", () => setTransactionType("Saída"));

// Função para definir o tipo de transação e destacar o botão ativo
let transactionType = "Entrada";
function setTransactionType(type) {
    transactionType = type;
    document.getElementById("entryButton").classList.toggle("active", type === "Entrada");
    document.getElementById("exitButton").classList.toggle("active", type === "Saída");
}

// Evento de envio do formulário de cliente
document.getElementById('clientForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const clientName = document.getElementById('clientName').value;
    const productName = document.getElementById('productName').value;
    const date = document.getElementById('date').value;
    const quantity = parseInt(document.getElementById('quantity').value);

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
});

























































