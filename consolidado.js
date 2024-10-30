// Import Firestore functions
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

// Inicializa Firestore
const db = getFirestore();

// Função para carregar e consolidar clientes
async function loadConsolidatedClients() {
    try {
        const clientsCollection = collection(db, 'clients');
        const querySnapshot = await getDocs(clientsCollection);

        // Extrair e consolidar dados dos clientes
        const aggregatedData = {};

        querySnapshot.forEach(docSnapshot => {
            const client = docSnapshot.data();
            const key = `${client.clientName.toUpperCase()} | ${client.productName.toUpperCase()}`;

            if (!aggregatedData[key]) {
                aggregatedData[key] = {
                    clientName: client.clientName,
                    productName: client.productName,
                    entryQuantity: 0,
                    exitQuantity: 0,
                    saldo: 0
                };
            }

            aggregatedData[key].entryQuantity += client.entryQuantity || 0;
            aggregatedData[key].exitQuantity += client.exitQuantity || 0;
            aggregatedData[key].saldo += (client.entryQuantity || 0) - (client.exitQuantity || 0);
        });

        renderConsolidatedTable(aggregatedData);
        updateTotals(aggregatedData);

    } catch (error) {
        console.error('Erro ao carregar dados consolidados:', error);
    }
}

// Função para preencher a tabela consolidada
function renderConsolidatedTable(aggregatedData) {
    const consolidatedTableBody = document.querySelector('#consolidatedTable tbody');
    consolidatedTableBody.innerHTML = '';

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
}

// Função para atualizar os totais de entradas e saldo
function updateTotals(aggregatedData) {
    let totalEntradas = 0;
    let totalSaldo = 0;

    Object.values(aggregatedData).forEach(data => {
        totalEntradas += data.entryQuantity;
        totalSaldo += data.saldo;
    });

    document.getElementById('totalEntradas').textContent = totalEntradas;
    document.getElementById('totalSaldo').textContent = totalSaldo;
}

// Função para aplicar filtros
function applyFilters() {
    const clientFilter = document.getElementById('clientFilter').value.trim().toUpperCase();
    const productFilter = document.getElementById('productFilter').value.trim().toUpperCase();

    const tableRows = document.querySelectorAll('#consolidatedTable tbody tr');
    tableRows.forEach(row => {
        const clientName = row.cells[0].textContent.toUpperCase();
        const productName = row.cells[1].textContent.toUpperCase();

        const matchesClient = !clientFilter || clientName.includes(clientFilter);
        const matchesProduct = !productFilter || productName.includes(productFilter);

        if (matchesClient && matchesProduct) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Carrega os clientes ao carregar o DOM
document.addEventListener('DOMContentLoaded', loadConsolidatedClients);

// Configura evento de clique para o botão de filtro
document.getElementById('filterButton').addEventListener('click', applyFilters);
