
import { getFirestore, collection, addDoc, getDocs, doc, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

// Verificação de sessão
if (!sessionStorage.getItem('loggedIn')) {
    window.location.href = 'login.html';
}

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

        renderTable(clients);
    } catch (error) {
        console.error('Erro ao carregar clientes:', error);
    }
}

// Função para renderizar a tabela detalhada
function renderTable(clients) {
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
    loadClientsFromFirestore(); // Recarrega a tabela após salvar
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

// Função para excluir um cliente
async function deleteClient(clientId) {
    try {
        await deleteDoc(doc(db, 'clients', clientId));
        console.log('Cliente excluído com sucesso!');
        loadClientsFromFirestore(); // Atualiza a tabela após exclusão
    } catch (error) {
        console.error('Erro ao excluir cliente:', error);
    }
}

// Função para filtrar e agregar os clientes
function filterTable() {
    const productFilter = document.getElementById('productFilter').value.toLowerCase();

    if (productFilter === "") {
        // Se não há filtro, mostrar todos os registros detalhados
        document.getElementById('clientHistoryTable').style.display = '';
        document.getElementById('aggregatedTable').style.display = 'none';
        loadClientsFromFirestore();
        return;
    }

    // Caso contrário, mostrar a tabela agregada
    document.getElementById('clientHistoryTable').style.display = 'none';
    document.getElementById('aggregatedTable').style.display = '';

    const tableRows = document.querySelectorAll('#clientHistoryTable tbody tr');
    let aggregatedData = {};

    tableRows.forEach(row => {
        const clientName = row.cells[1].textContent.trim();
        const productName = row.cells[2].textContent.toLowerCase().trim();
        const entryQuantity = parseFloat(row.cells[4].textContent) || 0;
        const exitQuantity = parseFloat(row.cells[5].textContent) || 0;

        if (productName === productFilter) {
            if (!aggregatedData[clientName]) {
                aggregatedData[clientName] = { entryQuantity: 0, exitQuantity: 0, saldo: 0 };
            }

            aggregatedData[clientName].entryQuantity += entryQuantity;
            aggregatedData[clientName].exitQuantity += exitQuantity;
            aggregatedData[clientName].saldo += (entryQuantity - exitQuantity);
        }
    });

    const aggregatedTableBody = document.querySelector('#aggregatedTable tbody');
    aggregatedTableBody.innerHTML = ''; // Limpa a tabela agregada antes de preencher

    for (const [clientName, data] of Object.entries(aggregatedData)) {
        const newRow = aggregatedTableBody.insertRow();
        newRow.innerHTML = `
            <td>${clientName}</td>
            <td>${productFilter}</td>
            <td>${data.entryQuantity}</td>
            <td>${data.exitQuantity}</td>
            <td>${data.saldo}</td>
        `;
    }
}

// Evento para filtrar clientes quando o filtro de produto mudar
document.getElementById('productFilter').addEventListener('change', filterTable);

// Evento para lidar com cliques na tabela de clientes
document.querySelector('#clientHistoryTable tbody').addEventListener('click', async (event) => {
    const button = event.target;
    const row = button.closest('tr');
    const clientId = button.getAttribute('data-id');

    if (button.classList.contains('delete-btn')) {
        await deleteClient(clientId);
    } else if (button.classList.contains('edit-client')) {
        editClientRow(row, clientId);
    }
});

// Carrega os clientes ao carregar o DOM
document.addEventListener('DOMContentLoaded', loadClientsFromFirestore);

































































