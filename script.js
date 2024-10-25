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

// Inicializa o tipo de transação como "Entrada" por padrão
let transactionType = "Entrada";

// Função para definir o tipo de transação com base no botão clicado
function setTransactionType(type) {
    transactionType = type;
    document.getElementById("entryButton").style.backgroundColor = type === 'Entrada' ? '#00ADB5' : '#ccc';
    document.getElementById("exitButton").style.backgroundColor = type === 'Saída' ? '#00ADB5' : '#ccc';
}

// Evento de envio de formulário para salvar cliente no Firestore
document.getElementById('clientForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const clientName = document.getElementById('clientName').value;
    const productName = document.getElementById('productName').value;
    const date = document.getElementById('date').value;
    const quantity = parseInt(document.getElementById('quantity').value);

    // Define os dados com base no tipo de transação
    const client = {
        clientName,
        productName,
        date,
        entryQuantity: transactionType === 'Entrada' ? quantity : 0,
        exitQuantity: transactionType === 'Saída' ? quantity : 0,
        saldo: transactionType === 'Entrada' ? quantity : -quantity
    };

    // Salva o cliente no Firestore
    await addClientToFirestore(client);

    window.location.href = 'cliente.html';
});


// Atualização para exibir a tabela em cliente.html
clients.forEach(client => {
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>
          <button class="edit-client" data-id="${client.id}">Editar</button>
          <button class="delete-btn" data-id="${client.id}">Excluir</button>
        </td>
        <td>${client.clientName}</td>
        <td>${client.productName}</td>
        <td>${client.date}</td>  <!-- Data única -->
        <td>${client.entryQuantity || 0}</td>
        <td>${client.exitQuantity || 0}</td>
        <td>${(client.entryQuantity || 0) - (client.exitQuantity || 0)}</td>
    `;
    clientHistoryTableBody.appendChild(row);
});



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

function editClientRow(row, clientId) {
  const cells = row.querySelectorAll('td');

  // Salvar os valores originais
  const originalClientName = cells[0].textContent;
  const originalProductName = cells[1].textContent;
  const originalEntryDate = cells[2].textContent;
  const originalExitDate = cells[3].textContent === 'N/A' ? '' : cells[3].textContent;
  const originalEntryQuantity = cells[4].textContent;
  const originalExitQuantity = cells[5].textContent;

  // Tornar as células editáveis
  cells[0].innerHTML = `<input type="text" value="${originalClientName}" />`;
  cells[1].innerHTML = `<input type="text" value="${originalProductName}" />`;
  cells[2].innerHTML = `<input type="date" value="${originalEntryDate}" />`;
  cells[3].innerHTML = `<input type="date" value="${originalExitDate}" />`;
  cells[4].innerHTML = `<input type="number" value="${originalEntryQuantity}" />`;
  cells[5].innerHTML = `<input type="number" value="${originalExitQuantity}" />`;

  // Alterar o botão de editar para salvar
  const editButton = row.querySelector('.edit-client');
  editButton.textContent = 'Salvar';
  editButton.classList.remove('edit-client');
  editButton.classList.add('save-client');

  // Remover event listeners antigos (evitar múltiplos eventos)
  editButton.replaceWith(editButton.cloneNode(true));

  // Selecionar o botão de salvar recém-adicionado
  const saveButton = row.querySelector('.save-client');

  // Adicionar um único listener ao botão de salvar
  saveButton.addEventListener('click', async () => {
    // Coletar os valores atualizados dos inputs
    const updatedClientName = cells[0].querySelector('input').value.trim() || originalClientName;
    const updatedProductName = cells[1].querySelector('input').value.trim() || originalProductName;
    const updatedEntryDate = cells[2].querySelector('input').value || originalEntryDate;
    const updatedExitDate = cells[3].querySelector('input').value || originalExitDate;
    const updatedEntryQuantity = parseInt(cells[4].querySelector('input').value) || parseInt(originalEntryQuantity);
    const updatedExitQuantity = parseInt(cells[5].querySelector('input').value) || parseInt(originalExitQuantity);

    // Atualizar o saldo
    const updatedSaldo = updatedEntryQuantity - updatedExitQuantity;

    // Novo objeto cliente com os valores atualizados
    const updatedClient = {
      clientName: updatedClientName,
      productName: updatedProductName,
      entryDate: updatedEntryDate,
      exitDate: updatedExitDate || 'N/A',
      entryQuantity: updatedEntryQuantity,
      exitQuantity: updatedExitQuantity,
      saldo: updatedSaldo
    };

    try {
      // Atualizar o documento no Firestore
      await updateDoc(doc(db, 'clients', clientId), updatedClient);

      // Exibir uma mensagem de sucesso
      alert('Cliente atualizado com sucesso!');

      // Voltar ao modo de visualização (não editável)
      cells[0].textContent = updatedClientName;
      cells[1].textContent = updatedProductName;
      cells[2].textContent = updatedEntryDate;
      cells[3].textContent = updatedExitDate || 'N/A';
      cells[4].textContent = updatedEntryQuantity;
      cells[5].textContent = updatedExitQuantity;
      cells[6].textContent = updatedSaldo;

      // Voltar o botão para "Editar"
      saveButton.textContent = 'Editar';
      saveButton.classList.remove('save-client');
      saveButton.classList.add('edit-client');

      // Remover o listener "Salvar" e voltar para o comportamento de "Editar"
      saveButton.removeEventListener('click', null);
      saveButton.addEventListener('click', () => editClientRow(row, clientId));
    } catch (error) {
      console.error('Erro ao atualizar cliente: ', error);
      alert('Erro ao atualizar cliente.');
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





















