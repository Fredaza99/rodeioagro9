import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCAM6g3AXwsKoQOsBRYlNs5f6E7dv3H0As",
  authDomain: "rodeioagro-fee43.firebaseapp.com",
  projectId: "rodeioagro-fee43",
  storageBucket: "rodeioagro-fee43.appspot.com",
  messagingSenderId: "981787707311",
  appId: "1:981787707311:web:e5a8749b6928969ff1d15a",
  measurementId: "G-FM9TP3QF6N"
};

// Initialize Firebase and Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Function to add client to Firestore
async function addClientToFirestore(client) {
  try {
    await addDoc(collection(db, 'clients'), client);
    console.log('Cliente salvo no Firestore');
  } catch (error) {
    console.error('Erro ao salvar cliente: ', error);
  }
}

// Function to add product to Firestore
async function addStockToFirestore(product) {
  try {
    await addDoc(collection(db, 'stock'), product);
    console.log('Produto salvo no Firestore');
  } catch (error) {
    console.error('Erro ao salvar produto: ', error);
  }
}

// Load clients from Firestore and populate the orders table and dropdown
async function loadClientsFromFirestore() {
  const querySnapshot = await getDocs(collection(db, 'clients'));
  const clientNames = [];
  const ordersTableBody = document.getElementById('ordersTable').getElementsByTagName('tbody')[0];
  ordersTableBody.innerHTML = ''; // Clear existing rows

  querySnapshot.forEach((doc) => {
    const client = doc.data();
    clientNames.push(client.clientName);

    // Add row to the orders table
    const newRow = ordersTableBody.insertRow();
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
    deleteButton.addEventListener('click', async () => {
      await deleteDoc(doc.ref);
      console.log('Cliente removido com sucesso');
      loadClientsFromFirestore(); // Reload the clients
    });
    deleteCell.appendChild(deleteButton);
  });

  // Populate product filter dropdown
  const productFilter = document.getElementById('productFilter');
  const uniqueProducts = [...new Set(querySnapshot.docs.map(doc => doc.data().productName))];
  uniqueProducts.forEach(product => {
    const option = document.createElement('option');
    option.value = product;
    option.textContent = product;
    productFilter.appendChild(option);
  });
}

// Event listener for the client form (index.html)
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

    // Create client object
    const client = { clientName, productName, entryDate, entryQuantity, exitQuantity, saldo, exitDate };
    
    // Save client to Firestore
    addClientToFirestore(client);

    // Redirect to orders page after saving
    window.location.href = 'pedidos.html';
  });
}

// Load clients when accessing the orders page
if (window.location.pathname.includes('pedidos.html')) {
  loadClientsFromFirestore();
}

// Event listener for stock form (estoque.html)
if (window.location.pathname.includes('estoque.html')) {
  document.getElementById('stockForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const productName = document.getElementById('productName').value;
    const productQuantity = parseInt(document.getElementById('productQuantity').value);
    const entryDate = document.getElementById('entryDate').value;

    // Create product object for Firestore
    const product = { productName, productQuantity, entryDate };
    addStockToFirestore(product); // Save to Firestore
    window.location.reload(); // Refresh the page
  });
}










