// Import Firestore functions
import { getFirestore, collection, addDoc, getDocs, doc, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

// Inicializa Firestore
const db = getFirestore();

// Função para adicionar um cliente ao Firestore
async function addClientToFirestore(client) {
    try {
        await addDoc(collection(db, 'clients'), client);
        console.log('Cliente salvo no Firestore');

        // Atualiza o localStorage
        let clients = JSON.parse(localStorage.getItem('clientsData')) || [];
        clients.push(client);
        localStorage.setItem('clientsData', JSON.stringify(clients));

        renderClients(clients); // Atualiza a tabela com o novo cliente
    } catch (error) {
        console.error('Erro ao salvar cliente:', error);
    }
}

// Função para carregar e exibir clientes
async function loadClientsFromFirestore() {
    // Verifica se há dados armazenados no localStorage
    let clients = JSON.parse(localStorage.getItem('clientsData'));

    if (clients && clients.length > 0) {
        console.log('Carregando dados do localStorage');
        renderClients(clients); // Função para renderizar a tabela
    } else {
        try {
            console.log('Carregando dados do Firestore');
            const clientsCollection = collection(db, 'clients');
            const querySnapshot = await getDocs(clientsCollection);

            clients = [];

            querySnapshot.forEach(docSnapshot => {
                const client = docSnapshot.data();
                client.id = docSnapshot.id;  // Preserva o ID para ações de edição/exclusão
                clients.push(client);
            });

            // Armazena os dados no localStorage
            localStorage.setItem('clientsData', JSON.stringify(clients));

            renderClients(clients);
        } catch (error) {
            console.error('Erro ao carregar clientes do Firestore:', error);
        }
    }
}

// Função que renderiza os clientes na tabela
function renderClients(clients) {
    const clientHistoryTableBody = document.querySelector('#clientHistoryTable tbody');
    clientHistoryTableBody.innerHTML = ''; 

    const productFilterDropdown = document.getElementById('productFilter');
    productFilterDropdown.innerHTML = '<option value="">Todos os Produtos</option>';

    let totalEntradas = 0;
    let totalSaldo = 0;

    clients.forEach(client => {
        const row = document.createElement('tr');
        const action = client.entryQuantity > 0 ? 'Entrada' : 'Saída';

        totalEntradas += client.entryQuantity || 0;
        totalSaldo += client.saldo || 0;

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

        // Adiciona o produto ao dropdown se não estiver presente
        if (![...productFilterDropdown.options].some(option => option.value === client.productName)) {
            const option = document.createElement('option');
            option.value = client.productName;
            option.textContent = client.productName;
            productFilterDropdown.appendChild(option);
        }
    });

    // Atualiza os cartões de resumo
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
    window.location.href = 'cliente.html'; // Redireciona após salvar
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
            
            // Atualiza o localStorage
            let clients = JSON.parse(localStorage.getItem('clientsData')) || [];
            clients = clients.map(client => client.id === clientId ? updatedClient : client);
            localStorage.setItem('clientsData', JSON.stringify(clients));

            renderClients(clients);
        } catch (error) {
            console.error('Erro ao atualizar cliente:', error);
        }
    });
}

// Função de Filtragem
function filterTable() {
    const searchInput = document.getElementById('clientSearchInput').value.toLowerCase();
    const productFilter = document.getElementById('productFilter').value.toLowerCase();
    const tableRows = document.querySelectorAll('#clientHistoryTable tbody tr');

    let totalEntradas = 0;
    let totalSaldo = 0;

    tableRows.forEach(row => {
        const clientName = row.cells[1].textContent.toLowerCase();
        const productName = row.cells[2].textContent.toLowerCase();
        const entryQuantity = parseFloat(row.cells[4].textContent) || 0;
        const saldo = parseFloat(row.cells[6].textContent) || 0;

        const matchesClient = clientName.includes(searchInput);
        const matchesProduct = !productFilter || productName === productFilter;

        if (matchesClient && matchesProduct) {
            row.style.display = '';
            totalEntradas += entryQuantity;
            totalSaldo += saldo;
        } else {
            row.style.display = 'none';
        }
    });

    document.getElementById('totalEntradas').textContent = totalEntradas;
    document.getElementById('totalSaldo').textContent = totalSaldo;
}

// Carrega os clientes ao carregar o DOM
document.addEventListener('DOMContentLoaded', loadClientsFromFirestore);

































































