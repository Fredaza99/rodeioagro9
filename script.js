// Import Firestore functions
import { getFirestore, collection, addDoc, getDocs, doc, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

// Inicializa Firestore
const db = getFirestore();

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

  // Function to load clients from Firestore and sort them alphabetically
  async function loadClientsFromFirestore() {
    try {
      const querySnapshot = await getDocs(collection(db, 'clients'));
      const clients = [];

      querySnapshot.forEach((docSnapshot) => {
        const client = docSnapshot.data();
        clients.push({ id: docSnapshot.id, ...client });
      });

      // Ordena os clientes por nome
      clients.sort((a, b) => a.clientName.localeCompare(b.clientName));

      clients.forEach(client => {
        const newRow = table.insertRow();
        newRow.insertCell(0).textContent = client.clientName;
        newRow.insertCell(1).textContent = client.productName;
        newRow.insertCell(2).textContent = client.entryDate;
        newRow.insertCell(3).textContent = client.exitDate;
        newRow.insertCell(4).textContent = client.entryQuantity;
        newRow.insertCell(5).textContent = client.exitQuantity;
        newRow.insertCell(6).textContent = client.saldo;

        // Edit button
        const editCell = newRow.insertCell(7);
        const editButton = document.createElement('button');
        editButton.textContent = 'Editar';
        editButton.classList.add('edit-btn');
        editButton.addEventListener('click', () => editClientRow(newRow, client.id));
        editCell.appendChild(editButton);

        // Delete button
        const deleteCell = newRow.insertCell(8);
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Excluir';
        deleteButton.classList.add('delete-btn');
        deleteButton.addEventListener('click', async () => {
          try {
            await deleteDoc(doc(db, 'clients', client.id));
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

  // Editar linha
  function editClientRow(row, clientId) {
    const cells = row.querySelectorAll('td');

    const clientName = cells[0].textContent;
    const productName = cells[1].textContent;
    const entryDate = cells[2].textContent;
    const exitDate = cells[3].textContent;
    const entryQuantity = cells[4].textContent;
    const exitQuantity = cells[5].textContent;

    // Transformar as células em campos editáveis
    cells[0].innerHTML = `<input type="text" value="${clientName}" />`;
    cells[1].innerHTML = `<input type="text" value="${productName}" />`;
    cells[2].innerHTML = `<input type="date" value="${entryDate}" />`;
    cells[3].innerHTML = `<input type="date" value="${exitDate}" />`;
    cells[4].innerHTML = `<input type="number" value="${entryQuantity}" />`;
    cells[5].innerHTML = `<input type="number" value="${exitQuantity}" />`;

    // Mudar o botão "Editar" para "Salvar"
    const editButton = row.querySelector('.edit-btn');
    editButton.textContent = 'Salvar';
    editButton.classList.remove('edit-btn');
    editButton.classList.add('save-btn');

    // Ao clicar em "Salvar", atualizar o Firestore
    editButton.addEventListener('click', async () => {
      const updatedClient = {
        clientName: cells[0].querySelector('input').value,
        productName: cells[1].querySelector('input').value,
        entryDate: cells[2].querySelector('input').value,
        exitDate: cells[3].querySelector('input').value || 'N/A',
        entryQuantity: parseInt(cells[4].querySelector('input').value),
        exitQuantity: parseInt(cells[5].querySelector('input').value)
      };

      try {
        await updateDoc(doc(db, 'clients', clientId), updatedClient);
        alert('Cliente atualizado com sucesso!');
        window.location.reload(); // Recarrega a tabela após atualização
      } catch (error) {
        console.error('Erro ao atualizar cliente: ', error);
      }
    });
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

    // Cria um objeto de produto para Firestore
    const product = { productName, productQuantity, entryDate };
    await addStockToFirestore(product); // Salva no Firestore
    window.location.reload(); // Recarrega a página para atualizar a tabela
  });

  // Função para carregar o estoque do Firestore e preencher o dropdown
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

  // Adicionar evento de input na barra de pesquisa
  document.getElementById('clientSearchInput').addEventListener('input', function () {
    const searchQuery = this.value.toLowerCase(); // Obtém o valor digitado e converte para minúsculas

    const tableRows = document.getElementById('stockTable').getElementsByTagName('tbody')[0].getElementsByTagName('tr');

    for (let row of tableRows) {
        const productNameCell = row.cells[0].textContent.toLowerCase(); // Nome do produto da linha

        // Verifica se o nome do produto inclui o texto digitado na barra de pesquisa
        if (productNameCell.includes(searchQuery)) {
            row.style.display = ''; // Mostra a linha se corresponder
        } else {
            row.style.display = 'none'; // Oculta a linha se não corresponder
        }
    }
  });

  // Carrega os dados do estoque e preenche o dropdown ao carregar a página
  window.addEventListener('DOMContentLoaded', loadStockFromFirestore);
}





















