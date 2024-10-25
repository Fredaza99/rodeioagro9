// Import Firestore functions
import { getFirestore, collection, addDoc, getDocs, doc, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

// Inicializa Firestore
const db = getFirestore();

// Function to save clients to Firestore
async function addTransactionToFirestore(transaction) {
  try {
    await addDoc(collection(db, 'transactions'), transaction);
    console.log('Transação salva no Firestore');
  } catch (error) {
    console.error('Erro ao salvar transação: ', error);
  }
}

// ------------------------------
// Cadastro de Transações (index.html)
// ------------------------------
if (window.location.pathname.includes('index.html')) {
  document.getElementById('clientForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const clientName = document.getElementById('clientName').value;
    const productName = document.getElementById('productName').value;
    const transactionType = document.getElementById('transactionType').value;
    const transactionDate = document.getElementById('transactionDate').value;
    const quantity = parseInt(document.getElementById('quantity').value);
    
    const transactionQuantity = transactionType === 'entrada' ? quantity : -quantity;
    
    const transaction = {
      clientName,
      productName,
      transactionDate,
      transactionQuantity,
      transactionType
    };

    // Save the transaction in Firestore
    await addTransactionToFirestore(transaction);

    // Redirect to the transactions page after registration
    window.location.href = 'cliente.html';
  });
}

// ------------------------------
// Lista de Transações (cliente.html)
// ------------------------------
if (window.location.pathname.includes('cliente.html')) {
  const table = document.getElementById('clientHistoryTable').getElementsByTagName('tbody')[0];
  table.innerHTML = ''; // Clear the table before filling it

  // Function to load transactions from Firestore and sort them alphabetically
  async function loadTransactionsFromFirestore() {
    try {
      const querySnapshot = await getDocs(collection(db, 'transactions'));
      const transactions = [];

      querySnapshot.forEach((docSnapshot) => {
        const transaction = docSnapshot.data();
        transactions.push({ id: docSnapshot.id, ...transaction });
      });

      // Ordena as transações por nome do cliente
      transactions.sort((a, b) => a.clientName.localeCompare(b.clientName));

      transactions.forEach(transaction => {
        const newRow = table.insertRow();
        newRow.insertCell(0).textContent = transaction.clientName;
        newRow.insertCell(1).textContent = transaction.productName;
        newRow.insertCell(2).textContent = transaction.transactionDate;
        newRow.insertCell(3).textContent = transaction.transactionType;
        newRow.insertCell(4).textContent = transaction.transactionType === 'entrada' ? transaction.transactionQuantity : 'N/A';
        newRow.insertCell(5).textContent = transaction.transactionType === 'saida' ? -transaction.transactionQuantity : 'N/A';
        newRow.insertCell(6).textContent = transaction.transactionQuantity;

        // Edit button
        const editCell = newRow.insertCell(7);
        const editButton = document.createElement('button');
        editButton.textContent = 'Editar';
        editButton.classList.add('edit-btn');
        editButton.addEventListener('click', () => editTransactionRow(newRow, transaction.id));
        editCell.appendChild(editButton);

        // Delete button
        const deleteCell = newRow.insertCell(8);
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Excluir';
        deleteButton.classList.add('delete-btn');
        deleteButton.addEventListener('click', async () => {
          try {
            await deleteDoc(doc(db, 'transactions', transaction.id));
            console.log('Transação removida com sucesso');
            window.location.reload(); // Reload the page to update the table
          } catch (error) {
            console.error('Erro ao remover transação: ', error);
          }
        });
        deleteCell.appendChild(deleteButton);
      });
    } catch (error) {
      console.error('Erro ao carregar transações: ', error);
    }
  }

function editTransactionRow(row, transactionId) {
  const cells = row.querySelectorAll('td');

  // Salvar os valores originais
  const originalClientName = cells[0].textContent;
  const originalProductName = cells[1].textContent;
  const originalTransactionDate = cells[2].textContent;
  const originalTransactionType = cells[3].textContent;
  const originalTransactionQuantity = cells[6].textContent;

  // Tornar as células editáveis
  cells[0].innerHTML = `<input type="text" value="${originalClientName}" />`;
  cells[1].innerHTML = `<input type="text" value="${originalProductName}" />`;
  cells[2].innerHTML = `<input type="date" value="${originalTransactionDate}" />`;
  cells[3].innerHTML = `
    <select>
      <option value="entrada" ${originalTransactionType === 'entrada' ? 'selected' : ''}>Entrada</option>
      <option value="saida" ${originalTransactionType === 'saida' ? 'selected' : ''}>Saída</option>
    </select>
  `;
  cells[6].innerHTML = `<input type="number" value="${originalTransactionQuantity}" />`;

  // Alterar o botão de editar para salvar
  const editButton = row.querySelector('.edit-btn');
  editButton.textContent = 'Salvar';
  editButton.classList.remove('edit-btn');
  editButton.classList.add('save-btn');

  // Remover event listeners antigos (evitar múltiplos eventos)
  editButton.replaceWith(editButton.cloneNode(true));

  // Selecionar o botão de salvar recém-adicionado
  const saveButton = row.querySelector('.save-btn');

  // Adicionar um único listener ao botão de salvar
  saveButton.addEventListener('click', async () => {
    // Coletar os valores atualizados dos inputs
    const updatedClientName = cells[0].querySelector('input').value.trim() || originalClientName;
    const updatedProductName = cells[1].querySelector('input').value.trim() || originalProductName;
    const updatedTransactionDate = cells[2].querySelector('input').value || originalTransactionDate;
    const updatedTransactionType = cells[3].querySelector('select').value;
    const updatedTransactionQuantity = parseInt(cells[6].querySelector('input').value) || parseInt(originalTransactionQuantity);

    const finalTransactionQuantity = updatedTransactionType === 'entrada' ? updatedTransactionQuantity : -updatedTransactionQuantity;

    const updatedTransaction = {
      clientName: updatedClientName,
      productName: updatedProductName,
      transactionDate: updatedTransactionDate,
      transactionType: updatedTransactionType,
      transactionQuantity: finalTransactionQuantity
    };

    try {
      // Atualizar o documento no Firestore
      await updateDoc(doc(db, 'transactions', transactionId), updatedTransaction);

      // Exibir uma mensagem de sucesso
      alert('Transação atualizada com sucesso!');

      // Voltar ao modo de visualização (não editável)
      cells[0].textContent = updatedClientName;
      cells[1].textContent = updatedProductName;
      cells[2].textContent = updatedTransactionDate;
      cells[3].textContent = updatedTransactionType;
      cells[4].textContent = updatedTransactionType === 'entrada' ? finalTransactionQuantity : 'N/A';
      cells[5].textContent = updatedTransactionType === 'saida' ? -finalTransactionQuantity : 'N/A';
      cells[6].textContent = finalTransactionQuantity;

      // Voltar o botão para "Editar"
      saveButton.textContent = 'Editar';
      saveButton.classList.remove('save-btn');
      saveButton.classList.add('edit-btn');

      // Remover o listener "Salvar" e voltar para o comportamento de "Editar"
      saveButton.removeEventListener('click', null);
      saveButton.addEventListener('click', () => editTransactionRow(row, transactionId));
    } catch (error) {
      console.error('Erro ao atualizar transação: ', error);
      alert('Erro ao atualizar transação.');
    }
  });
}

// Load transactions when the client page is accessed
loadTransactionsFromFirestore();
}





















