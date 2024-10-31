// Import Firestore functions
import { getFirestore, collection, addDoc, getDocs, doc, deleteDoc, updateDoc, query, limit, startAfter } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

// Inicializa Firestore
const db = getFirestore();

const pageSize = 10; // Defina o tamanho da página
let lastVisible = null;

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

// Função para carregar e exibir clientes de uma página
async function loadClientsPage() {
    // Carrega clientes do Firestore em partes (página)
    try {
        console.log('Carregando página de dados do Firestore');
        const clientsCollection = collection(db, 'clients');
        let clientsQuery;

        if (lastVisible) {
            clientsQuery = query(clientsCollection, startAfter(lastVisible), limit(pageSize));
        } else {
            clientsQuery = query(clientsCollection, limit(pageSize));
        }

        const querySnapshot = await getDocs(clientsQuery);

        if (querySnapshot.empty) {
            console.log('Nenhum cliente encontrado');
            return;
        }

        lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];

        const clients = querySnapshot.docs.map(docSnapshot => {
            const client = docSnapshot.data();
            client.id = docSnapshot.id; // Preserva o ID para ações de edição/exclusão
            return client;
        });

        renderClients(clients);
    } catch (error) {
        console.error('Erro ao carregar clientes do Firestore:', error);
    }
}

// Função para calcular o total de entradas e saldo de todos os clientes (carrega todos os registros)
async function calculateTotalEntriesAndSaldo() {
    try {
        const clientsCollection = collection(db, 'clients');
        const querySnapshot = await getDocs(clientsCollection);

        let totalEntradas = 0;
        let totalSaldo = 0;

        querySnapshot.forEach(docSnapshot => {
            const client = docSnapshot.data();
            totalEntradas += client.entryQuantity || 0;
            totalSaldo += client.saldo || 0;
        });

        // Garantir que os elementos existem antes de atribuir valores
        const totalEntradasElem = document.getElementById('totalEntradas');
        const totalSaldoElem = document.getElementById('totalSaldo');

        if (totalEntradasElem && totalSaldoElem) {
            totalEntradasElem.textContent = totalEntradas;
            totalSaldoElem.textContent = totalSaldo;
        } else {
            console.error('Elementos para entradas e saldo não encontrados.');
        }
    } catch (error) {
        console.error('Erro ao calcular entradas e saldo total:', error);
    }
}

// Função que renderiza os clientes na tabela
function renderClients(clients) {
    const clientHistoryTableBody = document.querySelector('#clientHistoryTable tbody');
    if (!clientHistoryTableBody) {
        console.error('Elemento da tabela não encontrado.');
        return;
    }
    clientHistoryTableBody.innerHTML = '';

    const productFilterDropdown = document.getElementById('productFilter');
    if (productFilterDropdown) {
        productFilterDropdown.innerHTML = '<option value="">Todos os Produtos</option>';
    }

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

        // Adiciona o produto ao dropdown se não estiver presente
        if (productFilterDropdown && ![...productFilterDropdown.options].some(option => option.value === client.productName)) {
            const option = document.createElement('option');
            option.value = client.productName;
            option.textContent = client.productName;
            productFilterDropdown.appendChild(option);
        }
    });
}

// Função para definir o tipo de transação e destacar o botão ativo
let transactionType = "Entrada";
function setTransactionType(type) {
    transactionType = type;
    const entryButton = document.getElementById("entryButton");
    const exitButton = document.getElementById("exitButton");

    if (entryButton && exitButton) {
        entryButton.classList.toggle("active", type === "Entrada");
        exitButton.classList.toggle("active", type === "Saída");
    } else {
        console.error('Botões de transação não encontrados.');
    }
}

// Configura eventos de clique para os botões de transação
document.addEventListener('DOMContentLoaded', () => {
    const entryButton = document.getElementById("entryButton");
    const exitButton = document.getElementById("exitButton");
    const clientForm = document.getElementById('clientForm');
    const nextPageButton = document.getElementById('nextPageButton');

    if (entryButton) {
        entryButton.addEventListener("click", () => setTransactionType("Entrada"));
    }
    if (exitButton) {
        exitButton.addEventListener("click", () => setTransactionType("Saída"));
    }
    if (clientForm) {
        clientForm.addEventListener('submit', async function (e) {
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
    }
    if (nextPageButton) {
        nextPageButton.addEventListener('click', loadClientsPage);
    }

    // Espera que o DOM esteja pronto antes de chamar essas funções
    calculateTotalEntriesAndSaldo(); // Calcula totais ao carregar a página
    loadClientsPage(); // Carrega a primeira página dos clientes
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




































































