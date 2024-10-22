// Import Firestore functions
import { getFirestore, collection, addDoc, getDocs, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

// Initialize Firestore
const db = getFirestore();

// ------------------------------
// Funções para Clientes e Estoque
// ------------------------------

// Function to save clients to Firestore
async function addClientToFirestore(client) {
  try {
    await addDoc(collection(db, 'clients'), client);
    console.log('Cliente salvo no Firestore');
    alert('Cliente salvo com sucesso!');
  } catch (error) {
    console.error('Erro ao salvar cliente: ', error);
    alert('Erro ao salvar cliente!');
  }
}

// Function to save stock to Firestore
async function addStockToFirestore(product) {
  try {
    await addDoc(collection(db, 'stock'), product);
    console.log('Produto salvo no Firestore');
    alert('Produto salvo com sucesso!');
  } catch (error) {
    console.error('Erro ao salvar produto: ', error);
    alert('Erro ao salvar produto!');
  }
}

// ------------------------------
// Cadastro de Clientes e Redirecionamento para a Lista de Clientes (index.html)
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

    // Redirect to the client list page after registration
    window.location.href = 'cliente.html';
  });
}

// ------------------------------
// Lista de Pedidos (cliente.html)
// ------------------------------
if (window.location.pathname.includes('cliente.html')) {
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
        newRow.insertCell(3).textContent = client.exitDate || 'N/A';
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
            alert('Cliente removido com sucesso!');
            window.location.reload(); // Reload the page to update the table
          } catch (error) {
            console.error('Erro ao remover cliente: ', error);
            alert('Erro ao remover cliente!');
          }
        });
        deleteCell.appendChild(deleteButton);
      });
    } catch (error) {
      console.error('Erro ao carregar clientes: ', error);
    }
  }

  // Load clients when the client page is accessed
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

  // Function to load stock from Firestore
  async function loadStockFromFirestore() {
    const stockTable = document.getElementById('stockTable').getElementsByTagName('tbody')[0];
    stockTable.innerHTML = ''; // Clear the table before filling it

    try {
      const querySnapshot = await getDocs(collection(db, 'stock'));
      querySnapshot.forEach((docSnapshot) => {
        const product = docSnapshot.data();
        const newRow = stockTable.insertRow();
        
        newRow.insertCell(0).textContent = product.productName; // Product Name
        newRow.insertCell(1).textContent = product.entryDate; // Entry Date
        newRow.insertCell(2).textContent = product.productQuantity; // Entry Quantity
        newRow.insertCell(3).textContent = product.productQuantity; // Total Quantity

        // Add delete button
        const deleteCell = newRow.insertCell(4); // Actions
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Excluir';
        deleteButton.classList.add('delete-btn');
        deleteButton.addEventListener('click', async () => {
          try {
            await deleteDoc(doc(db, 'stock', docSnapshot.id));
            console.log('Produto removido com sucesso');
            alert('Produto removido com sucesso!');
            window.location.reload(); // Reload the page to update the table
          } catch (error) {
            console.error('Erro ao remover produto: ', error);
            alert('Erro ao remover produto!');
          }
        });
        deleteCell.appendChild(deleteButton);
      });
    } catch (error) {
      console.error('Erro ao carregar estoque: ', error);
    }
  }

  // Load stock when accessing the page
  loadStockFromFirestore();
}















