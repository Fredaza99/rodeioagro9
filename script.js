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

async function loadClientsFromFirestore() {
    const searchInput = document.getElementById('clientSearchInput').value.toLowerCase();
    const productFilter = document.getElementById('productFilter').value.toLowerCase();
    const isClientFilterActive = searchInput.length > 0;

    // Seleciona o corpo da tabela e limpa antes de preenchê-lo
    const clientHistoryTableBody = document.querySelector('#clientHistoryTable tbody');
    clientHistoryTableBody.innerHTML = '';

    let totalEntradas = 0;
    let totalSaldo = 0;

    try {
        const clientsCollection = collection(db, 'clients');
        const querySnapshot = await getDocs(clientsCollection);

        // Dados agregados para visão de todos os produtos
        const aggregatedData = {};

        querySnapshot.forEach(docSnapshot => {
            const client = docSnapshot.data();
            const clientName = client.clientName.toLowerCase();
            const productName = client.productName.toLowerCase();
            const entryQuantity = client.entryQuantity || 0;
            const exitQuantity = client.exitQuantity || 0;
            const saldo = entryQuantity - exitQuantity;

            // Verifica correspondência com filtros
            const matchesClient = clientName.includes(searchInput);
            const matchesProduct = !productFilter || productName === productFilter;

            if (matchesClient && matchesProduct) {
                if (isClientFilterActive) {
                    // Modo Detalhado: Exibe cada entrada e saída do cliente
                    const detailedRow = clientHistoryTableBody.insertRow();
                    detailedRow.innerHTML = `
                        <td>${entryQuantity > 0 ? 'Entrada' : 'Saída'}</td>
                        <td>${client.clientName}</td>
                        <td>${client.productName}</td>
                        <td>${client.date}</td>
                        <td>${entryQuantity}</td>
                        <td>${exitQuantity}</td>
                        <td>${saldo}</td>
                        <td>
                            <button class="edit-client" data-id="${docSnapshot.id}">Editar</button>
                            <button class="delete-btn" data-id="${docSnapshot.id}">Excluir</button>
                        </td>
                    `;
                    totalEntradas += entryQuantity;
                    totalSaldo += saldo;
                } else {
                    // Modo Agregado: Agrupa dados por cliente-produto
                    const key = `${clientName}-${productName}`;
                    if (!aggregatedData[key]) {
                        aggregatedData[key] = { entryQuantity: 0, exitQuantity: 0, saldo: 0, clientName: client.clientName, productName: client.productName };
                    }
                    aggregatedData[key].entryQuantity += entryQuantity;
                    aggregatedData[key].exitQuantity += exitQuantity;
                    aggregatedData[key].saldo += saldo;
                }
            }
        });

        // Exibe dados agregados se não estiver no modo detalhado
        if (!isClientFilterActive) {
            Object.values(aggregatedData).forEach(data => {
                const aggregatedRow = clientHistoryTableBody.insertRow();
                aggregatedRow.innerHTML = `
                    <td>-</td>
                    <td>${data.clientName}</td>
                    <td>${data.productName}</td>
                    <td>-</td>
                    <td>${data.entryQuantity}</td>
                    <td>${data.exitQuantity}</td>
                    <td>${data.saldo}</td>
                    <td>-</td>
                `;
                totalEntradas += data.entryQuantity;
                totalSaldo += data.saldo;
            });
        }

        // Atualiza os totais de entrada e saldo
        document.getElementById('totalEntradas').textContent = totalEntradas;
        document.getElementById('totalSaldo').textContent = totalSaldo;
        
    } catch (error) {
        console.error("Erro ao carregar clientes:", error);
    }
}

// Configura o evento de filtragem para carregar clientes
document.getElementById('clientSearchInput').addEventListener('input', loadClientsFromFirestore);
document.getElementById('productFilter').addEventListener('change', loadClientsFromFirestore);

// Carrega os clientes na inicialização da página
document.addEventListener('DOMContentLoaded', loadClientsFromFirestore);


// Configura o evento de filtragem para carregar clientes
document.getElementById('clientSearchInput').addEventListener('input', loadClientsFromFirestore);
document.getElementById('productFilter').addEventListener('change', loadClientsFromFirestore);

// Carrega os clientes na inicialização da página
document.addEventListener('DOMContentLoaded', loadClientsFromFirestore);


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

function filterTable() {
    const searchInput = document.getElementById('clientSearchInput').value.toLowerCase();
    const productFilter = document.getElementById('productFilter').value.toLowerCase();
    const tableRows = document.querySelectorAll('#clientHistoryTable tbody tr');
    
    const isClientFilterActive = searchInput.length > 0;
    const aggregatedData = {};
    
    // Limpa as tabelas antes de preenchê-las
    const aggregatedTableBody = document.querySelector('#aggregatedTable tbody');
    const detailedTableBody = document.querySelector('#detailedTable tbody');
    aggregatedTableBody.innerHTML = '';
    detailedTableBody.innerHTML = '';

    // Itera nas linhas para calcular dados agregados e detalhados
    tableRows.forEach(row => {
        const clientName = row.cells[1].textContent.toLowerCase();
        const productName = row.cells[2].textContent.toLowerCase();
        const entryQuantity = parseFloat(row.cells[4].textContent) || 0;
        const exitQuantity = parseFloat(row.cells[5].textContent) || 0;
        const saldo = entryQuantity - exitQuantity;
        
        const matchesClient = clientName.includes(searchInput);
        const matchesProduct = !productFilter || productName === productFilter;

        if (matchesClient && matchesProduct) {
            if (isClientFilterActive) {
                // Adiciona linha detalhada para o cliente filtrado
                const detailedRow = detailedTableBody.insertRow();
                detailedRow.innerHTML = row.innerHTML;
                detailedRow.style.display = '';
            } else {
                // Agrega dados para a tabela agregada
                const key = `${clientName}-${productName}`;
                if (!aggregatedData[key]) {
                    aggregatedData[key] = { entryQuantity: 0, exitQuantity: 0, saldo: 0, clientName, productName };
                }
                aggregatedData[key].entryQuantity += entryQuantity;
                aggregatedData[key].exitQuantity += exitQuantity;
                aggregatedData[key].saldo += saldo;
            }
        }
    });

    // Adiciona dados agregados à tabela agregada
    if (!isClientFilterActive) {
        Object.values(aggregatedData).forEach(data => {
            const aggregatedRow = aggregatedTableBody.insertRow();
            aggregatedRow.innerHTML = `
                <td>-</td>
                <td>${data.clientName}</td>
                <td>${data.productName}</td>
                <td>${data.entryQuantity}</td>
                <td>${data.exitQuantity}</td>
                <td>${data.saldo}</td>
            `;
        });
    }

    // Exibe ou oculta tabelas com base no filtro
    document.getElementById('aggregatedTable').style.display = isClientFilterActive ? 'none' : '';
    document.getElementById('detailedTable').style.display = isClientFilterActive ? '' : 'none';
}




// Carrega os clientes ao carregar o DOM
document.addEventListener('DOMContentLoaded', loadClientsFromFirestore);



















































