// Import Firestore functions
import { getFirestore, collection, addDoc, getDocs, doc, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

const db = getFirestore();

// Função para adicionar um cliente ao Firestore
async function addClientToFirestore(client) {
    try {
        await addDoc(collection(db, 'clients'), client);
        console.log('Cliente salvo no Firestore');
    } catch (error) {
        console.error('Erro ao salvar cliente:', error);
    }
}

// Função para carregar e exibir clientes (transações individuais)
async function loadClientsFromFirestore() {
    try {
        const clientsCollection = collection(db, 'clients');
        const querySnapshot = await getDocs(clientsCollection);

        const clients = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        clients.sort((a, b) => {
            const nameComparison = a.clientName.localeCompare(b.clientName);
            if (nameComparison === 0) {
                return new Date(b.date).getTime() - new Date(a.date).getTime();
            }
            return nameComparison;
        });

        const clientHistoryTableBody = document.querySelector('#clientHistoryTable tbody');
        clientHistoryTableBody.innerHTML = '';

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
    } catch (error) {
        console.error('Erro ao carregar clientes:', error);
    }
}

// Função de filtro, conforme discutido
function filterTable() {
    const searchInput = document.getElementById('clientSearchInput').value.toLowerCase();
    const productFilter = document.getElementById('productFilter').value.toLowerCase();
    const tableRows = document.querySelectorAll('#clientHistoryTable tbody tr');
    const clientData = {};

    let totalEntradas = 0;
    let totalSaldo = 0;

    tableRows.forEach(row => {
        const clientName = row.cells[1].textContent.toLowerCase();
        const productName = row.cells[2].textContent.toLowerCase();
        const entryQuantity = parseFloat(row.cells[4].textContent) || 0;
        const exitQuantity = parseFloat(row.cells[5].textContent) || 0;
        const saldo = parseFloat(row.cells[6].textContent) || 0;

        const matchesClient = clientName.includes(searchInput);
        const matchesProduct = !productFilter || productName === productFilter;

        if (matchesClient && matchesProduct) {
            if (productFilter) {
                const clientId = clientName;

                if (!clientData[clientId]) {
                    clientData[clientId] = { clientName, productName, totalEntryQuantity: 0, totalExitQuantity: 0, saldo: 0 };
                }

                clientData[clientId].totalEntryQuantity += entryQuantity;
                clientData[clientId].totalExitQuantity += exitQuantity;
                clientData[clientId].saldo += saldo;

                row.style.display = 'none';  // Ocultar as linhas originais
            } else {
                row.style.display = '';  // Mostrar todas as transações para o cliente selecionado
                totalEntradas += entryQuantity;
                totalSaldo += saldo;
            }
        } else {
            row.style.display = 'none';
        }
    });

    if (productFilter) {
        const clientHistoryTableBody = document.querySelector('#clientHistoryTable tbody');
        clientHistoryTableBody.innerHTML = '';

        Object.values(clientData).forEach(client => {
            const row = document.createElement('tr');

            row.innerHTML = `
                <td>${client.clientName}</td>
                <td>${client.productName}</td>
                <td>${client.totalEntryQuantity}</td>
                <td>${client.totalExitQuantity}</td>
                <td class="${client.saldo >= 0 ? 'positive' : 'negative'}">${client.saldo}</td>
            `;

            clientHistoryTableBody.appendChild(row);
            totalEntradas += client.totalEntryQuantity;
            totalSaldo += client.saldo;
        });
    }

    document.getElementById('totalEntradas').textContent = totalEntradas;
    document.getElementById('totalSaldo').textContent = totalSaldo;
}

// Configuração de evento para carregar clientes e aplicar filtros
document.addEventListener('DOMContentLoaded', loadClientsFromFirestore);
document.getElementById('productFilter').addEventListener('change', filterTable);
document.getElementById('clientSearchInput').addEventListener('input', filterTable);

























