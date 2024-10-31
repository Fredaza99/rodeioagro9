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

        // Atualiza o localStorage após adicionar cliente
        await refreshClientsCache();

        renderClientsFromCache(); // Renderiza a tabela com os dados atualizados do localStorage
    } catch (error) {
        console.error('Erro ao salvar cliente:', error);
    }
}

// Função para recarregar todos os clientes do Firestore e atualizar o cache
async function refreshClientsCache() {
    try {
        const clientsCollection = collection(db, 'clients');
        const querySnapshot = await getDocs(clientsCollection);

        const clients = querySnapshot.docs.map(docSnapshot => ({
            id: docSnapshot.id,
            ...docSnapshot.data()
        }));

        // Armazena os dados atualizados no localStorage
        localStorage.setItem('clientsData', JSON.stringify(clients));
    } catch (error) {
        console.error('Erro ao atualizar cache de clientes:', error);
    }
}

// Função para carregar e exibir clientes de uma página
async function loadClientsPage() {
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

        // Verifica repetidamente até que os elementos estejam disponíveis
        const interval = setInterval(() => {
            const totalEntradasElem = document.getElementById('totalEntradas');
            const totalSaldoElem = document.getElementById('totalSaldo');

            if (totalEntradasElem && totalSaldoElem) {
                totalEntradasElem.textContent = totalEntradas;
                totalSaldoElem.textContent = totalSaldo;
                clearInterval(interval);
            } else {
                console.error('Elementos para entradas e saldo não encontrados, tentando novamente...');
            }
        }, 100); // Tenta a cada 100ms
    } catch (error) {
        console.error('Erro ao calcular entradas e saldo total:', error);
    }
}

// Função que renderiza os clientes na tabela
function renderClients(clients) {
    // Espera até o elemento da tabela estar disponível
    const interval = setInterval(() => {
        const clientHistoryTableBody = document.querySelector('#clientHistoryTable tbody');
        if (clientHistoryTableBody) {
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

                if (productFilterDropdown && ![...productFilterDropdown.options].some(option => option.value === client.productName)) {
                    const option = document.createElement('option');
                    option.value = client.productName;
                    option.textContent = client.productName;
                    productFilterDropdown.appendChild(option);
                }
            });
            clearInterval(interval);
        } else {
            console.error('Elemento da tabela não encontrado, tentando novamente...');
        }
    }, 100); // Tenta a cada 100ms
}

// Evento de carregamento do DOM
document.addEventListener('DOMContentLoaded', async () => {
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

            const client = {
                clientName,
                productName,
                date,
                entryQuantity: transactionType === "Entrada" ? quantity : 0,
                exitQuantity: transactionType === "Saída" ? quantity : 0,
                saldo: transactionType === "Entrada" ? quantity : -quantity
            };

            await addClientToFirestore(client);
        });
    }
    if (nextPageButton) {
        nextPageButton.addEventListener('click', loadClientsPage);
    }

    await refreshClientsCache(); // Carrega clientes do Firestore e armazena no localStorage
    renderClientsFromCache(); // Renderiza clientes do cache
    calculateTotalEntriesAndSaldo(); // Calcula totais
});

// Função para renderizar clientes do cache
function renderClientsFromCache() {
    const clients = JSON.parse(localStorage.getItem('clientsData')) || [];
    renderClients(clients);
}








































































