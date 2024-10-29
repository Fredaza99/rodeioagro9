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

// Função para carregar e exibir clientes na tabela detalhada
async function loadClientsFromFirestore() {
    const clientHistoryTableBody = document.querySelector('#clientHistoryTable tbody');
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

            // Configura evento de exclusão para cada botão
            row.querySelector('.delete-btn').addEventListener('click', async () => {
                await deleteDoc(doc(db, 'clients', client.id));
                loadClientsFromFirestore(); // Recarrega a tabela após exclusão
            });
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

// Evento de envio do formulário de cliente com confirmação visual
document.getElementById('clientForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const submitButton = document.querySelector('#submitBtn');
    submitButton.disabled = true; // Desativa o botão para evitar envios duplicados

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

    await addClientToFirestore(client);
    loadClientsFromFirestore(); // Recarrega a tabela detalhada

    submitButton.disabled = false; // Reativa o botão após o envio
});

// Função para exibir a tabela agregada com filtro de produto
function loadAggregatedTable() {
    const productFilter = document.getElementById('productFilter').value.toLowerCase();
    const aggregatedTableBody = document.querySelector('#aggregatedTable tbody');
    aggregatedTableBody.innerHTML = ''; // Limpa o conteúdo da tabela agregada

    let aggregatedData = {};

    // Carrega todos os clientes do Firestore e agrupa por cliente e produto
    const clientsCollection = collection(db, 'clients');
    getDocs(clientsCollection).then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
            const client = doc.data();
            const clientName = client.clientName.toLowerCase();
            const productName = client.productName.toLowerCase();

            if (productFilter && productName !== productFilter) return;

            const key = `${clientName}-${productName}`;
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

        // Adiciona os dados agrupados à tabela agregada
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

        // Alterna a exibição entre a tabela detalhada e a agregada
        document.getElementById('clientHistoryTable').style.display = productFilter ? 'none' : '';
        document.getElementById('aggregatedTable').style.display = productFilter ? '' : 'none';
    });
}

// Configura a exibição das tabelas ao carregar a página e ao usar filtros
document.addEventListener('DOMContentLoaded', () => {
    loadClientsFromFirestore(); // Carrega a tabela de clientes detalhada ao carregar a página
    document.getElementById('productFilter').addEventListener('change', loadAggregatedTable);
    document.getElementById('clientSearchInput').addEventListener('input', loadClientsFromFirestore);
});





























































