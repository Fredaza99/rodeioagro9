// Importar o Firestore do Firebase
import { getFirestore, collection, addDoc, getDocs, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js";

// Inicializar Firestore
const db = getFirestore();

// Declarar 'clients' e 'stock' como arrays vazios (carregaremos do Firestore)
let clients = [];
let stock = [];

// Função para salvar clientes no Firestore
async function addClientToFirestore(client) {
  try {
    await addDoc(collection(db, 'clients'), client);
    console.log('Cliente salvo no Firestore');
  } catch (error) {
    console.error('Erro ao salvar cliente: ', error);
  }
}

// Função para salvar estoque no Firestore
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

    // Criar objeto do cliente com todas as informações
    const client = { clientName, productName, entryDate, entryQuantity, exitQuantity, saldo, exitDate };
    
    // Salvar o cliente no Firestore
    await addClientToFirestore(client);

    // Redirecionar para a página de pedidos após o cadastro
    window.location.href = 'pedidos.html';
  });
}

// ------------------------------
// Lista de Pedidos (pedidos.html)
// ------------------------------
if (window.location.pathname.includes('pedidos.html')) {
  const table = document.getElementById('ordersTable').getElementsByTagName('tbody')[0];
  table.innerHTML = ''; // Limpar a tabela antes de preenchê-la

  // Função para carregar os clientes do Firestore
  async function loadClientsFromFirestore() {
    const querySnapshot = await getDocs(collection(db, 'clients'));
    querySnapshot.forEach((doc) => {
      const client = doc.data();
      const newRow = table.insertRow();
      newRow.insertCell(0).textContent = client.clientName;
      newRow.insertCell(1).textContent = client.productName;
      newRow.insertCell(2).textContent = client.entryDate;
      newRow.insertCell(3).textContent = client.exitDate;
      newRow.insertCell(4).textContent = client.entryQuantity;
      newRow.insertCell(5).textContent = client.exitQuantity;
      newRow.insertCell(6).textContent = client.saldo;

      // Adicionar botão de exclusão
      const deleteCell = newRow.insertCell(7);
      const deleteButton = document.createElement('button');
      deleteButton.textContent = 'Excluir';
      deleteButton.classList.add('delete-btn');
      deleteButton.addEventListener('click', async () => {
        try {
          await deleteDoc(doc(db, 'clients', doc.id));
          console.log('Cliente removido com sucesso');
          window.location.reload(); // Recarregar a página para atualizar a tabela
        } catch (error) {
          console.error('Erro ao remover cliente: ', error);
        }
      });
      deleteCell.appendChild(deleteButton);
    });
  }

  // Carregar os clientes quando a página de pedidos for acessada
  loadClientsFromFirestore();
}

// ------------------------------
// Controle de Estoque (estoque.html) - Nova Ordem da Tabela
// ------------------------------
if (window.location.pathname.includes('estoque.html')) {
  document.getElementById('stockForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const productName = document.getElementById('productName').value;
    const productQuantity = parseInt(document.getElementById('productQuantity').value);
    const entryDate = document.getElementById('entryDate').value;

    // Criar objeto do produto para o Firestore
    const product = { productName, productQuantity, entryDate };
    await addStockToFirestore(product); // Salvar no Firestore
    window.location.reload(); // Recarregar a página para atualizar a tabela
  });

  // Função para carregar o estoque do Firestore
  async function loadStockFromFirestore() {
    const stockTable = document.getElementById('stockTable').getElementsByTagName('tbody')[0];
    stockTable.innerHTML = ''; // Limpar a tabela antes de preenchê-la

    const querySnapshot = await getDocs(collection(db, 'stock'));
    querySnapshot.forEach((doc) => {
      const product = doc.data();
      const newRow = stockTable.insertRow();
      
      newRow.insertCell(0).textContent = product.productName; // Nome do Produto
      newRow.insertCell(1).textContent = product.entryDate; // Data da Entrada
      newRow.insertCell(2).textContent = product.productQuantity; // Quantidade de Entrada
      newRow.insertCell(3).textContent = product.productQuantity; // Quantidade Total (exibindo como quantidade de entrada no momento)

      // Adicionar botão de exclusão
      const deleteCell = newRow.insertCell(4); // Ações
      const deleteButton = document.createElement('button');
      deleteButton.textContent = 'Excluir';
      deleteButton.classList.add('delete-btn');
      deleteButton.addEventListener('click', async () => {
        try {
          await deleteDoc(doc(db, 'stock', doc.id));
          console.log('Produto removido com sucesso');
          window.location.reload(); // Recarregar a página para atualizar a tabela
        } catch (error) {
          console.error('Erro ao remover produto: ', error);
        }
      });
      deleteCell.appendChild(deleteButton);
    });
  }

  // Carregar o estoque ao acessar a página
  loadStockFromFirestore();
}

