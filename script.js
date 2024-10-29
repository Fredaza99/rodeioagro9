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
    const clientHistoryTableBody = document.querySelector('#clientHistoryTable tbody');
    if (!clientHistoryTableBody) {
        console.error("Erro: Elemento clientHistoryTable não encontrado.");
        return;
    }
    
    clientHistoryTableBody.innerHTML = ''; // Limpa o conteúdo da tabela

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

// Variável para definir o tipo de transação (Entrada ou Saída)
let transactionType = "Entrada";

// Função para configurar o tipo de transação e destacar o botão ativo
function setTransactionType(type) {
    transactionType = type;
    document.getElementById("entryButton")?.classList.toggle("active", type === "Entrada");
    document.getElementById("exitButton")?.classList.toggle("active", type === "Saída");
}

// Configura eventos de clique para os botões de transação
document.getElementById("entryButton")?.addEventListener("click", () => setTransactionType("Entrada"));
document.getElementById("exitButton")?.addEventListener("click", () => setTransactionType("Saída"));

// Função de envio do formulário para adicionar cliente ao Firestore
document.getElementById('clientForm')?.addEventListener('submit', async function (e) {
    e.preventDefault();

    const clientName = document.getElementById('clientName')?.value;
    const productName = document.getElementById('productName')?.value;
    const date = document.getElementById('date')?.value;
    const quantity = parseInt(document.getElementById('quantity')?.value);

    if (!clientName || !productName || !date || isNaN(quantity)) {
        console.error("Erro: Dados do formulário incompletos.");
        return;
    }

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

// Função para exibir a tabela agregada com filtro de produto
function filterTable() {
    const productFilter = document.getElementById('productFilter')?.value.toLowerCase();
    const clientHistoryTableBody = document.querySelector('#clientHistoryTable tbody');
    const aggregatedTableBody = document.querySelector('#aggregatedTable tbody');

    if (!clientHistoryTableBody || !aggregatedTableBody) {
        console.error("Erro: Tabelas não encontradas no DOM.");
        return;
    }

    aggregatedTableBody.innerHTML = ''; // Limpa a tabela agregada
    const aggregatedData = {};

    Array.from(clientHistoryTableBody.rows).forEach(row => {
        const clientName = row.cells[1].textContent;
        const productName = row.cells[2].textContent.toLowerCase();
        const entryQuantity = parseFloat(row.cells[4].textContent) || 0;
        const exitQuantity = parseFloat(row.cells[5].textContent) || 0;
        const saldo = entryQuantity - exitQuantity;

        // Agrupa por cliente e produto
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

    // Adiciona linhas à tabela agregada
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

// Eventos para carregar clientes e aplicar filtros
document.addEventListener('DOMContentLoaded', loadClientsFromFirestore);
document.getElementById('productFilter')?.addEventListener('change', filterTable);
document.getElementById('clientSearchInput')?.addEventListener('input', loadClientsFromFirestore);

























































