// Import Firestore functions
import { getFirestore, collection, addDoc, getDocs, doc, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

// Inicializa Firestore
const db = getFirestore();

// Variável para controlar o tipo de transação (Entrada ou Saída)
let transactionType = "Entrada";

// Função para definir o tipo de transação e destacar o botão ativo
function setTransactionType(type) {
    transactionType = type;
    document.getElementById("entryButton").classList.toggle("active", type === "Entrada");
    document.getElementById("exitButton").classList.toggle("active", type === "Saída");
}

// Configura os botões de Entrada e Saída
document.getElementById("entryButton").addEventListener("click", () => setTransactionType("Entrada"));
document.getElementById("exitButton").addEventListener("click", () => setTransactionType("Saída"));

// Função para adicionar um cliente ao Firestore
async function addClientToFirestore(client) {
    try {
        await addDoc(collection(db, 'clients'), client);
        console.log('Cliente salvo no Firestore');
        loadClientsFromFirestore();  // Recarrega a tabela após adicionar
    } catch (error) {
        console.error('Erro ao salvar cliente:', error);
    }
}

// Função de envio do formulário para adicionar cliente ao Firestore
document.getElementById('clientForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const clientName = document.getElementById('clientName').value;
    const productName = document.getElementById('productName').value;
    const date = document.getElementById('date').value;
    const quantity = parseInt(document.getElementById('quantity').value);

    const client = {
        clientName,
        productName,
        date,
        entryQuantity: transactionType === "Entrada" ? quantity : 0,
        exitQuantity: transactionType === "Saída" ? quantity : 0,
        saldo: transactionType === "Entrada" ? quantity : -quantity
    };

    await addClientToFirestore(client); // Adiciona o cliente e recarrega a tabela
});

// Função de carregamento e exibição de dados
async function loadClientsFromFirestore() {
    const clientHistoryTableBody = document.querySelector('#clientHistoryTable tbody');
    const aggregatedTableBody = document.querySelector('#aggregatedTable tbody');
    clientHistoryTableBody.innerHTML = '';
    aggregatedTableBody.innerHTML = '';

    const searchInput = document.getElementById('clientSearchInput').value.toLowerCase();
    const productFilter = document.getElementById('productFilter').value.toLowerCase();
    const isClientFilterActive = searchInput.length > 0;

    let totalEntradas = 0;
    let totalSaldo = 0;
    const aggregatedData = {};

    try {
        const clientsCollection = collection(db, 'clients');
        const querySnapshot = await getDocs(clientsCollection);
        const clients = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        clients.forEach(client => {
            const clientName = client.clientName.toLowerCase();
            const productName = client.productName.toLowerCase();
            const entryQuantity = client.entryQuantity || 0;
            const exitQuantity = client.exitQuantity || 0;
            const saldo = entryQuantity - exitQuantity;

            const matchesClient = clientName.includes(searchInput);
            const matchesProduct = !productFilter || productName === productFilter;

            if (isClientFilterActive) {
                if (matchesClient) {
                    addRowToTable(clientHistoryTableBody, client, entryQuantity, exitQuantity, saldo, client.id);
                }
            } else {
                const key = `${client.clientName}-${client.productName}`;
                if (!aggregatedData[key]) {
                    aggregatedData[key] = { clientName: client.clientName, productName: client.productName, entryQuantity: 0, exitQuantity: 0, saldo: 0 };
                }
                aggregatedData[key].entryQuantity += entryQuantity;
                aggregatedData[key].exitQuantity += exitQuantity;
                aggregatedData[key].saldo += saldo;
                totalEntradas += entryQuantity;
                totalSaldo += saldo;
            }
        });

        // Exibe a tabela agregada se não houver filtro de cliente ativo
        if (!isClientFilterActive) {
            Object.values(aggregatedData).forEach(data => {
                const newRow = aggregatedTableBody.insertRow();
                newRow.innerHTML = `
                    <td>${data.clientName}</td>
                    <td>${data.productName}</td>
                    <td>${data.entryQuantity}</td>
                    <td>${data.exitQuantity}</td>
                    <td>${data.saldo}</td>
                `;
            });
        }

        // Atualiza os totais
        document.getElementById('totalEntradas').textContent = totalEntradas;
        document.getElementById('totalSaldo').textContent = totalSaldo;

        // Controla a visibilidade das tabelas
        document.getElementById('clientHistoryTable').style.display = isClientFilterActive ? '' : 'none';
        document.getElementById('aggregatedTable').style.display = isClientFilterActive ? 'none' : '';

    } catch (error) {
        console.error('Erro ao carregar clientes:', error);
    }
}

// Função para adicionar uma linha na tabela detalhada
function addRowToTable(tableBody, client, entryQuantity, exitQuantity, saldo, clientId) {
    const row = tableBody.insertRow();
    const action = entryQuantity > 0 ? 'Entrada' : 'Saída';
    row.innerHTML = `
        <td>${action}</td>
        <td>${client.clientName}</td>
        <td>${client.productName}</td>
        <td>${client.date}</td>
        <td>${entryQuantity}</td>
        <td>${exitQuantity}</td>
        <td>${saldo}</td>
        <td>
            <button class="edit-client" data-id="${clientId}">Editar</button>
            <button class="delete-btn" data-id="${clientId}">Excluir</button>
        </td>
    `;
}

// Função para aplicar filtro de produto na tabela agregada
function filterTable() {
    const productFilter = document.getElementById('productFilter').value.toLowerCase();
    const clientHistoryTableBody = document.querySelector('#clientHistoryTable tbody');
    const aggregatedTableBody = document.querySelector('#aggregatedTable tbody');
    aggregatedTableBody.innerHTML = ''; // Limpa o conteúdo para filtro atualizado

    const aggregatedData = {};

    // Itera sobre as linhas para agrupar por produto e cliente
    Array.from(clientHistoryTableBody.rows).forEach(row => {
        const clientName = row.cells[1].textContent;
        const productName = row.cells[2].textContent.toLowerCase();
        const entryQuantity = parseFloat(row.cells[4].textContent) || 0;
        const exitQuantity = parseFloat(row.cells[5].textContent) || 0;
        const saldo = entryQuantity - exitQuantity;

        if (!productFilter || productName === productFilter) {
            const key = `${clientName}-${productName}`;
            if (!aggregatedData[key]) {
                aggregatedData[key] = { clientName, productName, entryQuantity: 0, exitQuantity: 0, saldo: 0 };
            }
            aggregatedData[key].entryQuantity += entryQuantity;
            aggregatedData[key].exitQuantity += exitQuantity;
            aggregatedData[key].saldo += saldo;
        }
    });

    // Adiciona linhas agregadas à tabela
    Object.values(aggregatedData).forEach(data => {
        const row = aggregatedTableBody.insertRow();
        row.innerHTML = `
            <td>${data.clientName}</td>
            <td>${data.productName}</td>
            <td>${data.entryQuantity}</td>
            <td>${data.exitQuantity}</td>
            <td>${data.saldo}</td>
        `;
    });

    document.getElementById('clientHistoryTable').style.display = productFilter ? 'none' : '';
    document.getElementById('aggregatedTable').style.display = productFilter ? '' : 'none';
}

// Eventos para carregar clientes e aplicar filtro
document.addEventListener('DOMContentLoaded', loadClientsFromFirestore);
document.getElementById('productFilter').addEventListener('change', filterTable);
document.getElementById('clientSearchInput').addEventListener('input', loadClientsFromFirestore);























































