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

        // Preencher tabela consolidada
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
    } catch (error) {
        console.error('Erro ao carregar dados consolidados:', error);
    }
}

// Carrega os clientes ao carregar o DOM
document.addEventListener('DOMContentLoaded', loadConsolidatedClients);
