import { getFirestore } from "firebase/firestore";

// Initialize Firestore
const db = getFirestore();

// Declare 'clients' and 'stock' as empty arrays (to be loaded from Firestore)
let clients = [];
let stock = [];

// Function to save clients to Firestore
function addClientToFirestore(client) {
  db.collection('clients').add(client)
    .then(() => {
      console.log('Cliente salvo no Firestore');
    })
    .catch((error) => {
      console.error('Erro ao salvar cliente: ', error);
    });
}

// Function to save stock to Firestore
function addStockToFirestore(product) {
  db.collection('stock').add(product)
    .then(() => {
      console.log('Produto salvo no Firestore');
    })
    .catch((error) => {
      console.error('Erro ao salvar produto: ', error);
    });
}

// Load products into the dropdown
function loadProductsToDropdown() {
  const productFilter = document.getElementById('productFilter');
  productFilter.innerHTML = '<option value="">Todos os Produtos</option>'; // Clear existing options

  db.collection('stock').get().then((querySnapshot) => {
    querySnapshot.forEach((doc) => {
      const product = doc.data().productName; // Assuming 'productName' is a field in your stock collection
      const option = document.createElement('option');
      option.value = product;
      option.textContent = product;
      productFilter.appendChild(option);
    });
  }).catch((error) => {
    console.error('Erro ao carregar produtos: ', error);
  });
}

// Load clients from Firestore and populate the orders table
function loadClientsFromFirestore() {
  const table = document.getElementById('ordersTable').getElementsByTagName('tbody')[0];
  table.innerHTML = ''; // Clear the table before populating it

  db.collection('clients').get().then((querySnapshot) => {
    querySnapshot.forEach((doc) => {
      const client = doc.data();
      const newRow = table.insertRow();
      newRow.insertCell(0).textContent = client.clientName; // Name of the Client
      newRow.insertCell(1).textContent = client.productName; // Product Name
      newRow.insertCell(2).textContent = client.entryDate; // Entry Date
      newRow.insertCell(3).textContent = client.exitDate; // Exit Date
      newRow.insertCell(4).textContent = client.entryQuantity; // Entry Quantity
      newRow.insertCell(5).textContent = client.exitQuantity; // Exit Quantity
      newRow.insertCell(6).textContent = client.saldo; // Balance

      // Add delete button
      const deleteCell = newRow.insertCell(7);
      const deleteButton = document.createElement('button');
      deleteButton.textContent = 'Excluir';
      deleteButton.classList.add('delete-btn');
      deleteButton.addEventListener('click', () => {
        db.collection('clients').doc(doc.id).delete()
          .then(() => {
            console.log('Cliente removido com sucesso');
            window.location.reload(); // Reload the page to refresh the table
          })
          .catch((error) => {
            console.error('Erro ao remover cliente: ', error);
          });
      });
      deleteCell.appendChild(deleteButton);
    });
  }).catch((error) => {
    console.error('Erro ao carregar clientes: ', error);
  });
}

// Handle client form submission and redirect to orders page
if (window.location.pathname.includes('index.html')) {
  document.getElementById('clientForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const clientName = document.getElementById('clientName').value;
    const productName = document.getElementById('productName').value;
    const entryDate = document.getElementById('entryDate').value;
    const entryQuantity = parseInt(document.getElementById('entryQuantity').value);
    const exitQuantity = parseInt(document.getElementById('exitQuantity').value || 0);
    const exitDate = document.getElementById('exitDate').value || 'Não definido';
    const saldo = entryQuantity - exitQuantity;

    // Create client object with all information
    const client = { clientName, productName, entryDate, entryQuantity, exitQuantity, saldo, exitDate };

    // Save the client to Firestore
    addClientToFirestore(client);

    // Redirect to the orders page after registration
    window.location.href = 'pedidos.html';
  });
}

// Handle orders page functionality
if (window.location.pathname.includes('pedidos.html')) {
  loadClientsFromFirestore(); // Load clients when accessing the orders page
}

// Handle stock form submission and reload the page
if (window.location.pathname.includes('estoque.html')) {
  document.getElementById('stockForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const productName = document.getElementById('productName').value;
    const productQuantity = parseInt(document.getElementById('productQuantity').value);
    const entryDate = document.getElementById('entryDate').value;

    // Create product object for Firestore
    const product = { productName, productQuantity, entryDate };
    addStockToFirestore(product); // Save to Firestore
    window.location.reload(); // Reload the page to refresh the table
  });

  // Load stock from Firestore and populate the stock table
  function loadStockFromFirestore() {
    const stockTable = document.getElementById('stockTable').getElementsByTagName('tbody')[0];
    stockTable.innerHTML = ''; // Clear the table before populating it

    db.collection('stock').get().then((querySnapshot) => {
      querySnapshot.forEach((doc) => {
        const product = doc.data();
        const newRow = stockTable.insertRow();
        
        newRow.insertCell(0).textContent = product.productName; // Product Name
        newRow.insertCell(1).textContent = product.entryDate; // Entry Date
        newRow.insertCell(2).textContent = product.productQuantity; // Entry Quantity
        newRow.insertCell(3).textContent = product.productQuantity; // Total Quantity (displaying as entry quantity for now)

        // Add delete button
        const deleteCell = newRow.insertCell(4); // Actions
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Excluir';
        deleteButton.classList.add('delete-btn');
        deleteButton.addEventListener('click', () => {
          db.collection('stock').doc(doc.id).delete()
            .then(() => {
              console.log('Produto removido com sucesso');
              window.location.reload(); // Reload the page to refresh the table
            })
            .catch((error) => {
              console.error('Erro ao remover produto: ', error);
            });
        });
        deleteCell.appendChild(deleteButton);
      });
    }).catch((error) => {
      console.error('Erro ao carregar estoque: ', error);
    });
  }

  // Load stock when accessing the page
  loadStockFromFirestore();
}

// Load products for the dropdown in clientes.html
if (window.location.pathname.includes('clientes.html')) {
  loadProductsToDropdown(); // Load products into the dropdown
  loadClientsFromFirestore(); // Load clients into the table
}








