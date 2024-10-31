// Import Firestore functions
import { getFirestore, collection, addDoc, getDocs, doc, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

// Inicializa Firestore
const db = getFirestore();

// Variável para armazenar os clientes
let clients = [];

// Função para adicionar um cliente ao Firestore
async function addClientToFirestore(client) {
    try {
        const docRef = await addDoc(collection(db, 'clients'), client);
        console.log('Cliente salvo no Firestore com ID:', docRef.id);
        
        // Recarrega clientes e atualiza a interface após a adição
        await loadClientsFromFirestore();
    } catch (error) {
        console.error('Erro ao salvar cliente:', error);
    }
}

// Função para carregar clientes do Firestore
async function loadClientsFromFirestore() {
    try {
        console.log('Carregando clientes do Firestore...');
        const clientsCollection = collection(db, 'clients');
        const querySnapshot = await getDocs(clientsCollection);

        // Mapeia os dados dos documentos para o array de clientes
        clients = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Ordena os clientes por nome e data
        clients.sort((a, b) => {
            const nameComparison = a.clientName.localeCompare(b.clientName);
            if (nameComparison === 0) {
                return new Date(b.date).getTime() - new Date(a.date).getTime();
            }
            return nameComparison;
        });

        // Atualiza a tabela com os clientes
        renderClients(clients);
    } catch (error) {
        console.error('Erro ao carregar clientes do Firestore:', error);
    }
}

// Função para renderizar clientes na tabela
function renderClients(clients) {
    const clientHistoryTableBody = document.querySelector('#clientHistoryTable tbody');
    if (!clientHistoryTableBody) {
        console.error('Elemento da tabela não encontrado.');
        return;
    }

    clientHistoryTableBody.innerHTML = ''; // Limpa o conteúdo da tabela

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

    // Atualiza os valores totais de entradas e saldo após renderizar
    updateTotals(clients);
}

// Função para atualizar os totais de entradas e saldo
function updateTotals(clients) {
    let totalEntradas = 0;
    let totalSaldo = 0;

    clients.forEach(client => {
        totalEntradas += client.entryQuantity || 0;
        totalSaldo += client.saldo || 0;
    });

    document.getElementById('totalEntradas').textContent = totalEntradas;
    document.getElementById('totalSaldo').textContent = totalSaldo;
}

// Função para definir o tipo de transação e destacar o botão ativo
let transactionType = "Entrada";
function setTransactionType(type) {
    transactionType = type;
    document.getElementById("entryButton").classList.toggle("active", type === "Entrada");
    document.getElementById("exitButton").classList.toggle("active", type === "Saída");
}

// Configura eventos de clique para os botões de transação
document.getElementById("entryButton").addEventListener("click", () => setTransactionType("Entrada"));
document.getElementById("exitButton").addEventListener("click", () => setTransactionType("Saída"));

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
});

// Função para editar uma linha de cliente
function editClientRow(row, clientId) {
    const cells = row.querySelectorAll('td');
    const originalValues = [...cells].map(cell => cell.textContent);

    // Torna as células editáveis
    cells.forEach((cell, index) => {
        if (index > 0 && index < cells.length - 1) {
            cell.innerHTML = `<input type="text" value="${originalValues[index].trim()}" />`;
        }
    });

    const editButton = row.querySelector('.edit-client');
    editButton.textContent = 'Salvar';
    editButton.classList.remove('edit-client');
    editButton.classList.add('save-client');

    editButton.replaceWith(editButton.cloneNode(true)); // Remove eventos antigos

    const saveButton = row.querySelector('.save-client');
    saveButton.addEventListener('click', async () => {
        const updatedClient = {
            clientName: cells[1].querySelector('input').value,
            productName: cells[2].querySelector('input').value,
            date: cells[3].querySelector('input').value,
            entryQuantity: parseInt(cells[4].querySelector('input').value) || 0,
            exitQuantity: parseInt(cells[5].querySelector('input').value) || 0,
            saldo: parseInt(cells[4].querySelector('input').value) - parseInt(cells[5].querySelector('input').value)
        };

        try {
            await updateDoc(doc(db, 'clients', clientId), updatedClient);
            await loadClientsFromFirestore();
        } catch (error) {
            console.error('Erro ao atualizar cliente:', error);
        }
    });
}

// Função de Filtragem
function filterTable() {
    const clientFilter = document.getElementById('clientSearchInput').value.trim().toUpperCase();
    const productFilter = document.getElementById('productFilter').value.trim().toUpperCase();
    const filteredClients = clients.filter(client => {
        const clientNameMatches = client.clientName.toUpperCase().includes(clientFilter);
        const productNameMatches = productFilter === "" || client.productName.toUpperCase().includes(productFilter);
        return clientNameMatches && productNameMatches;
    });

    renderClients(filteredClients);
}

// Carrega os clientes ao carregar o DOM
document.addEventListener('DOMContentLoaded', async () => {
    await loadClientsFromFirestore();
});

// Eventos para filtrar enquanto digita
document.getElementById('clientSearchInput').addEventListener('input', filterTable);
document.getElementById('productFilter').addEventListener('change', filterTable);












































































