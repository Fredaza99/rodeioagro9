// Import Firestore and Firebase functions
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-analytics.js";
import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

// Your web app's Firebase configuration
    const firebaseConfig = {
      apiKey: "AIzaSyCAM6g3AXwsKoQOsBRYlNs5f6E7dv3H0As",
      authDomain: "rodeioagro-fee43.firebaseapp.com",
      projectId: "rodeioagro-fee43",
      storageBucket: "rodeioagro-fee43.appspot.com",
      messagingSenderId: "981787707311",
      appId: "1:981787707311:web:e5a8749b6928969ff1d15a",
      measurementId: "G-FM9TP3QF6N"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

// Configure Google Analytics with the correct domain
gtag('config', 'SUA_MEASUREMENT_ID', {
  'cookie_domain': 'rodeioagro-gilt.vercel.app' // Ajuste para o domínio correto
});

// ------------------------------
// Funções de Clientes
// ------------------------------

// Função para carregar os clientes do Firestore
async function loadClientsFromFirestore() {
  const clientsCollection = collection(db, 'clients');
  const querySnapshot = await getDocs(clientsCollection);

  const clientHistoryTableBody = document.getElementById('clientHistoryTable').querySelector('tbody');
  clientHistoryTableBody.innerHTML = '';

  querySnapshot.forEach((docSnapshot) => {
    const client = docSnapshot.data();
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${client.clientName}</td>
      <td>${client.productName}</td>
      <td>${client.entryDate}</td>
      <td>${client.exitDate || 'N/A'}</td>
      <td>${client.entryQuantity || 0}</td>
      <td>${client.exitQuantity || 0}</td>
      <td>${(client.entryQuantity || 0) - (client.exitQuantity || 0)}</td>
      <td><button class="delete-client" data-id="${docSnapshot.id}">Excluir</button></td>
    `;
    clientHistoryTableBody.appendChild(row);
  });

  // Adicionar funcionalidade de exclusão de clientes
  document.querySelectorAll('.delete-client').forEach(button => {
    button.addEventListener('click', async () => {
      const clientId = button.getAttribute('data-id');
      try {
        await deleteDoc(doc(db, 'clients', clientId));
        alert('Cliente excluído com sucesso!');
        loadClientsFromFirestore(); // Recarregar a tabela após a exclusão
      } catch (error) {
        console.error('Erro ao excluir cliente: ', error);
        alert('Erro ao excluir cliente.');
      }
    });
  });
}

// Função para adicionar clientes ao Firestore
async function addClientToFirestore(client) {
  try {
    await addDoc(collection(db, 'clients'), client);
    alert('Cliente adicionado com sucesso!');
    loadClientsFromFirestore(); // Recarrega a lista de clientes
  } catch (error) {
    console.error('Erro ao adicionar cliente: ', error);
    alert('Erro ao adicionar cliente.');
  }
}

// ------------------------------
// Funções de Estoque
// ------------------------------

// Função para carregar o estoque do Firestore
async function loadStockFromFirestore() {
  const stockCollection = collection(db, 'stock');
  const querySnapshot = await getDocs(stockCollection);

  const stockTableBody = document.getElementById('stockTable').querySelector('tbody');
  stockTableBody.innerHTML = '';

  querySnapshot.forEach((docSnapshot) => {
    const product = docSnapshot.data();
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${product.productName}</td>
      <td>${product.entryDate}</td>
      <td>${product.productQuantity}</td>
      <td><button class="delete-product" data-id="${docSnapshot.id}">Excluir</button></td>
    `;
    stockTableBody.appendChild(row);
  });

  // Adicionar funcionalidade de exclusão de produtos
  document.querySelectorAll('.delete-product').forEach(button => {
    button.addEventListener('click', async () => {
      const productId = button.getAttribute('data-id');
      try {
        await deleteDoc(doc(db, 'stock', productId));
        alert('Produto excluído com sucesso!');
        loadStockFromFirestore(); // Recarregar a tabela de estoque após a exclusão
      } catch (error) {
        console.error('Erro ao excluir produto: ', error);
        alert('Erro ao excluir produto.');
      }
    });
  });
}

// Função para adicionar produtos ao Firestore
async function addStockToFirestore(product) {
  try {
    await addDoc(collection(db, 'stock'), product);
    alert('Produto adicionado ao estoque com sucesso!');
    loadStockFromFirestore(); // Recarrega a lista de estoque
  } catch (error) {
    console.error('Erro ao adicionar produto: ', error);
    alert('Erro ao adicionar produto.');
  }
}

// ------------------------------
// Eventos ao carregar a página
// ------------------------------
document.addEventListener('DOMContentLoaded', () => {
  // Carregar clientes e estoque ao carregar a página
  if (window.location.pathname.includes('cliente.html')) {
    loadClientsFromFirestore(); // Carregar lista de clientes
  } else if (window.location.pathname.includes('estoque.html')) {
    loadStockFromFirestore(); // Carregar lista de estoque
  }
});
















