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
        const productOptions = new Set();

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

            // Adicionar produto ao conjunto para o dropdown
            productOptions.add(client.productName);
        });

        renderConsolidatedTable(aggregatedData);
        updateTotals(aggregatedData);
        populateProductFilter(productOptions);

    } catch (error) {
        console.error('Erro ao carregar dados consolidados:', error);
    }
}

function renderConsolidatedTable(aggregatedData) {
    const consolidatedTableBody = document.querySelector('#consolidatedTable tbody');
    consolidatedTableBody.innerHTML = '';

    Object.values(aggregatedData).forEach(data => {
        const newRow = document.createElement('tr');
        const saldoClass = data.saldo >= 0 ? 'positive-balance' : 'negative-balance';

        newRow.innerHTML = `
            <td>${data.clientName}</td>
            <td>${data.productName}</td>
            <td>${data.entryQuantity}</td>
            <td>${data.exitQuantity}</td>
            <td class="${saldoClass}">${data.saldo}</td>
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

// Função para preencher o dropdown de produtos
function populateProductFilter(productOptions) {
    const productFilter = document.getElementById('productFilter');
    productFilter.innerHTML = '<option value="">Todos os Produtos</option>';

    productOptions.forEach(product => {
        const option = document.createElement('option');
        option.value = product;
        option.textContent = product;
        productFilter.appendChild(option);
    });
}

// Função de Filtragem
function filterTable() {
    const clientFilter = document.getElementById('clientFilter').value.trim().toUpperCase();
    const productFilter = document.getElementById('productFilter').value.trim().toUpperCase();
    const tableRows = document.querySelectorAll('#consolidatedTable tbody tr');

    let totalEntradas = 0;
    let totalSaldo = 0;

    tableRows.forEach(row => {
        const clientName = row.cells[0].textContent.trim().toUpperCase();
        const productName = row.cells[1].textContent.trim().toUpperCase();

        const matchesClient = clientFilter === "" || clientName.includes(clientFilter);
        const matchesProduct = productFilter === "" || productName.includes(productFilter);

        if (matchesClient && matchesProduct) {
            row.style.display = '';
            totalEntradas += parseFloat(row.cells[2].textContent) || 0;
            totalSaldo += parseFloat(row.cells[4].textContent) || 0;
        } else {
            row.style.display = 'none';
        }
    });

    document.getElementById('totalEntradas').textContent = totalEntradas;
    document.getElementById('totalSaldo').textContent = totalSaldo;
}

// Carrega os clientes ao carregar o DOM
document.addEventListener('DOMContentLoaded', loadConsolidatedClients);

// Eventos para filtrar enquanto digita
document.getElementById('clientFilter').addEventListener('input', filterTable);
document.getElementById('productFilter').addEventListener('change', filterTable);






