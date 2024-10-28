// Import Firestore functions
import { getFirestore, collection, addDoc, getDocs, doc, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

// Inicializa Firestore
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

// Função para carregar e exibir clientes
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

        const clientHistoryTableBody = document.querySelector('#clientHistoryTable tbody');
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
    } catch (error) {
        console.error('Erro ao carregar clientes:', error);
    }
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
    window.location.href = 'cliente.html'; // Redireciona após salvar
});

// Função para editar uma linha de cliente
function editClientRow(row, clientId) {
    const cells = row.querySelectorAll('td');
    const originalValues = [...cells].map(cell => cell.textContent);

    // Torna as células editáveis
    cells.forEach((cell, index) => {
        if (index > 0 && index < cells.length - 1) {
            cell.innerHTML = `<input type="text" value="${originalValues[index]}" />`;
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
            loadClientsFromFirestore();
        } catch (error) {
            console.error('Erro ao atualizar cliente:', error);
        }
    });
}

// Função para filtrar e agrupar a tabela
function filterTable() {
    const searchInput = document.getElementById('clientSearchInput').value.toLowerCase();
    const productFilter = document.getElementById('productFilter').value.toLowerCase();
    const tableRows = document.querySelectorAll('#clientHistoryTable tbody tr');

    const aggregatedData = {}; // Armazenará as somas por cliente/produto

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
            // Agrupamento por cliente e produto
            const key = `${clientName}-${productName}`;
            if (!aggregatedData[key]) {
                aggregatedData[key] = { clientName, productName, entryQuantity: 0, exitQuantity: 0, saldo: 0 };
            }
            aggregatedData[key].entryQuantity += entryQuantity;
            aggregatedData[key].exitQuantity += exitQuantity;
            aggregatedData[key].saldo += saldo;

            row.style.display = 'none'; // Esconde a linha original temporariamente
        } else {
            row.style.display = 'none';
        }
    });

    // Exibir linhas agrupadas
    const clientHistoryTableBody = document.querySelector('#clientHistoryTable tbody');
    clientHistoryTableBody.innerHTML = '';

    Object.values(aggregatedData).forEach(({ clientName, productName, entryQuantity, exitQuantity, saldo }) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${entryQuantity > 0 ? 'Entrada' : 'Saída'}</td>
            <td>${clientName}</td>
            <td>${productName}</td>
            <td>-</td>
            <td>${entryQuantity}</td>
            <td>${exitQuantity}</td>
            <td>${saldo}</td>
            <td></td>
        `;
        clientHistoryTableBody.appendChild(row);

        totalEntradas += entryQuantity;
        totalSaldo += saldo;
    });

    document.getElementById('totalEntradas').textContent = totalEntradas;
    document.getElementById('totalSaldo').textContent = totalSaldo;
}

async function showAggregatedView() {
    const productFilter = document.getElementById('productFilter').value.toLowerCase();
    const aggregatedTableBody = document.querySelector('#aggregatedTable tbody');
    const modal = document.getElementById('aggregatedModal');
    const closeModal = document.getElementsByClassName('close')[0];

    // Clear previous results
    aggregatedTableBody.innerHTML = '';

    const aggregatedData = {}; // To store totals by client and product

    // Fetch clients from Firestore
    const querySnapshot = await getDocs(collection(db, 'clients'));
    querySnapshot.forEach(doc => {
        const client = doc.data();
        const clientName = client.clientName.toLowerCase();
        const productName = client.productName.toLowerCase();

        // Aggregate only if product filter is applied
        if (productFilter && productName === productFilter) {
            const key = `${clientName}-${productName}`;
            if (!aggregatedData[key]) {
                aggregatedData[key] = { clientName: client.clientName, productName: client.productName, entryQuantity: 0, exitQuantity: 0, saldo: 0 };
            }
            aggregatedData[key].entryQuantity += client.entryQuantity || 0;
            aggregatedData[key].exitQuantity += client.exitQuantity || 0;
            aggregatedData[key].saldo += client.saldo || 0;
        }
    });

    // Display aggregated data in modal
    Object.values(aggregatedData).forEach(({ clientName, productName, entryQuantity, exitQuantity, saldo }) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${entryQuantity > 0 ? 'Entrada' : 'Saída'}</td>
            <td>${clientName}</td>
            <td>${productName}</td>
            <td>${entryQuantity}</td>
            <td>${exitQuantity}</td>
            <td>${saldo}</td>
        `;
        aggregatedTableBody.appendChild(row);
    });

    // Open modal
    modal.style.display = 'block';

    // Close modal functionality
    closeModal.onclick = function() {
        modal.style.display = 'none';
    };
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    };
}

// Attach showAggregatedView to button click
document.getElementById('showAggregatedButton').addEventListener('click', showAggregatedView);


// Carrega os clientes ao carregar o DOM
document.addEventListener('DOMContentLoaded', loadClientsFromFirestore);



















































