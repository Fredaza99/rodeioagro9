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
            cell.innerHTML = <input type="text" value="${originalValues[index]}" />;
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

async function filterTable() {
    const searchInput = document.getElementById('clientSearchInput').value.toLowerCase();
    const productFilter = document.getElementById('productFilter').value.toLowerCase();
    const clientHistoryTableBody = document.querySelector('#clientHistoryTable tbody');
    
    clientHistoryTableBody.innerHTML = ''; // Limpa a tabela
    
    // Coleta todos os documentos da coleção 'clients'
    const clientsCollection = collection(db, 'clients');
    const querySnapshot = await getDocs(clientsCollection);

    const groupedClients = {}; // Objeto para armazenar clientes agrupados

    querySnapshot.forEach(docSnapshot => {
        const client = docSnapshot.data();
        const clientName = client.clientName.toLowerCase();
        const productName = client.productName.toLowerCase();

        // Verifica se o cliente e o produto correspondem ao filtro
        if (clientName.includes(searchInput) && (!productFilter || productName === productFilter)) {
            if (!groupedClients[clientName]) {
                // Inicializa o objeto do cliente com valores somados
                groupedClients[clientName] = { 
                    clientName: client.clientName, 
                    productName: client.productName,
                    totalEntry: 0, 
                    totalExit: 0, 
                    totalSaldo: 0 
                };
            }

            // Soma as entradas, saídas e saldo para o cliente
            groupedClients[clientName].totalEntry += client.entryQuantity || 0;
            groupedClients[clientName].totalExit += client.exitQuantity || 0;
            groupedClients[clientName].totalSaldo += client.saldo || 0;
        }
    });

    let totalEntradas = 0;
    let totalSaldo = 0;

    // Adiciona uma linha consolidada para cada cliente
    Object.values(groupedClients).forEach(client => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>Consolidado</td>
            <td>${client.clientName}</td>
            <td>${client.productName}</td>
            <td>-</td>
            <td>${client.totalEntry}</td>
            <td>${client.totalExit}</td>
            <td class="${client.totalSaldo >= 0 ? 'positive' : 'negative'}">${client.totalSaldo}</td>
            <td></td>
        `;
        clientHistoryTableBody.appendChild(row);

        // Soma os totais para exibição final
        totalEntradas += client.totalEntry;
        totalSaldo += client.totalSaldo;
    });

    // Atualiza os totais exibidos
    document.getElementById('totalEntradas').textContent = totalEntradas;
    document.getElementById('totalSaldo').textContent = totalSaldo;
}



// Carrega os clientes ao carregar o DOM e configura os filtros
document.addEventListener('DOMContentLoaded', loadClientsFromFirestore);
document.getElementById('productFilter').addEventListener('change', filterTable);
document.getElementById('clientSearchInput').addEventListener('input', filterTable);


























