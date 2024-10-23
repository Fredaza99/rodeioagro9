// Import Firestore functions
import { getFirestore, collection, addDoc, getDocs, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

// Initialize Firestore
const db = getFirestore();

// Arrays to hold clients and stock data
let clients = [];
let stock = [];

// Function to save clients to Firestore
async function addClientToFirestore(client) {
  try {
    await addDoc(collection(db, 'clients'), client);
    console.log('Cliente salvo no Firestore');
  } catch (error) {
    console.error('Erro ao salvar cliente: ', error);
  }
}

// Function to save stock to Firestore
async function addStockToFirestore(product) {
  try {
    await addDoc(collection(db, 'stock'), product);
    console.log('Produto salvo no Firestore');
  } catch (error) {
    console.error('Erro ao salvar produto: ', error);
  }
}

// ------------------------------
// Cadastro de Clientes e Redirecionamento para a Lista de Pedidos (index.html)
// ------------------------------
if (window.location.pathname.includes('index.html')) {
  document.getElementById('clientForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const clientName = document.getElementById('clientName').value;
    const productName = document.getElementById('productName').value;
    const entryDate = document.getElementById('entryDate').value;
    const entryQuantity = parseInt(document.getElementById('entryQuantity').value);
    const exitQuantity = parseInt(document.getElementById('exitQuantity').value || 0);
    const exitDate = document.getElementById('exitDate').value || 'Não definido';
    const saldo = entryQuantity - exitQuantity;

    // Create a client object with all information
    const client = { clientName, productName, entryDate, entryQuantity, exitQuantity, saldo, exitDate };
    
    // Save the client in Firestore
    await addClientToFirestore(client);

    // Redirect to the orders page after registration
    window.location.href = 'cliente.html';
  });
}

// ------------------------------
// Lista de Pedidos (pedidos.html)
// ------------------------------
if (window.location.pathname.includes('pedidos.html')) {
  const table = document.getElementById('ordersTable').getElementsByTagName('tbody')[0];
  table.innerHTML = ''; // Clear the table before filling it

  // Function to load clients from Firestore
  async function loadClientsFromFirestore() {
    try {
      const querySnapshot = await getDocs(collection(db, 'clients'));
      querySnapshot.forEach((docSnapshot) => {
        const client = docSnapshot.data();
        const newRow = table.insertRow();
        newRow.insertCell(0).textContent = client.clientName;
        newRow.insertCell(1).textContent = client.productName;
        newRow.insertCell(2).textContent = client.entryDate;
        newRow.insertCell(3).textContent = client.exitDate;
        newRow.insertCell(4).textContent = client.entryQuantity;
        newRow.insertCell(5).textContent = client.exitQuantity;
        newRow.insertCell(6).textContent = client.saldo;

        // Add delete button
        const deleteCell = newRow.insertCell(7);
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Excluir';
        deleteButton.classList.add('delete-btn');
        deleteButton.addEventListener('click', async () => {
          try {
            await deleteDoc(doc(db, 'clients', docSnapshot.id));
            console.log('Cliente removido com sucesso');
            window.location.reload(); // Reload the page to update the table
          } catch (error) {
            console.error('Erro ao remover cliente: ', error);
          }
        });
        deleteCell.appendChild(deleteButton);
      });
    } catch (error) {
      console.error('Erro ao carregar clientes: ', error);
    }
  }

  // Load clients when the orders page is accessed
  loadClientsFromFirestore();
}

// ------------------------------
// Controle de Estoque (estoque.html)
// ------------------------------
if (window.location.pathname.includes('estoque.html')) {
  document.getElementById('stockForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const productName = document.getElementById('productName').value;
    const productQuantity = parseInt(document.getElementById('productQuantity').value);
    const entryDate = document.getElementById('entryDate').value;

    // Create a product object for Firestore
    const product = { productName, productQuantity, entryDate };
    await addStockToFirestore(product); // Save to Firestore
    window.location.reload(); // Reload the page to update the table
  });

 // Function to load stock from Firestore and fill the dropdown
async function loadStockFromFirestore() {
    const stockTable = document.getElementById('stockTable').getElementsByTagName('tbody')[0];
    const productFilter = document.getElementById('productFilter'); // Dropdown para o filtro de produtos
    stockTable.innerHTML = ''; // Limpa a tabela
    productFilter.innerHTML = '<option value="">Todos os Produtos</option>'; // Adiciona a opção padrão "Todos os Produtos"

    try {
        const querySnapshot = await getDocs(collection(db, 'stock'));
        const products = [];

        querySnapshot.forEach((docSnapshot) => {
            const product = docSnapshot.data();
            products.push(product); // Armazena os produtos em um array

            // Preenche a tabela com os dados do estoque
            const newRow = stockTable.insertRow();
            newRow.insertCell(0).textContent = product.productName;
            newRow.insertCell(1).textContent = product.entryDate;
            newRow.insertCell(2).textContent = product.productQuantity;
            newRow.insertCell(3).textContent = product.productQuantity;

            // Botão de exclusão
            const deleteCell = newRow.insertCell(4);
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Excluir';
            deleteButton.classList.add('delete-btn');
            deleteButton.addEventListener('click', async () => {
                try {
                    await deleteDoc(doc(db, 'stock', docSnapshot.id));
                    console.log('Produto removido com sucesso');
                    window.location.reload(); // Recarrega a página
                } catch (error) {
                    console.error('Erro ao remover produto: ', error);
                }
            });
            deleteCell.appendChild(deleteButton);
        });

        // Preencher o dropdown de filtro com os nomes dos produtos
        const uniqueProducts = [...new Set(products.map(product => product.productName))]; // Garante que não haja produtos duplicados
        uniqueProducts.forEach(productName => {
            const option = document.createElement('option');
            option.value = productName;
            option.textContent = productName;
            productFilter.appendChild(option); // Adiciona as opções ao dropdown
        });

    } catch (error) {
        console.error('Erro ao carregar estoque: ', error);
    }
}

// Evento de mudança no dropdown para filtrar a tabela
document.getElementById('productFilter').addEventListener('change', function () {
    const selectedProduct = this.value.toLowerCase(); // Obtém o valor selecionado e converte para minúsculas

    const tableRows = document.getElementById('stockTable').getElementsByTagName('tbody')[0].getElementsByTagName('tr');

    for (let row of tableRows) {
        const productNameCell = row.cells[0].textContent.toLowerCase(); // Nome do produto da linha

        // Verifica se o produto da linha corresponde ao selecionado
        if (selectedProduct === '' || productNameCell === selectedProduct) {
            row.style.display = ''; // Mostra a linha se corresponder ou se a opção for "Todos os Produtos"
        } else {
            row.style.display = 'none'; // Oculta a linha se não corresponder
        }
    }
});

// Carrega os dados do estoque e preenche o dropdown ao carregar a página
window.addEventListener('DOMContentLoaded', loadStockFromFirestore);
















