// Evento para gerar relatório
document.getElementById("gerarRelatorio").addEventListener("click", async () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();



    // ✅ Carregar logo da empresa (Substitua por uma URL válida ou Base64)
    const logoUrl = "img/logo-png.png";
    const img = new Image();
    img.src = logoUrl;

    img.onload = function () {
        // Adiciona a logo no topo
        doc.addImage(img, "PNG", 80, 10, 40, 15);

        // Obtém o nome do cliente
        const clientName = document.getElementById("clientName").textContent.trim();


        // Obtém a data atual
        const dateNow = new Date().toLocaleString("pt-BR");

        // 📌 Título do PDF
        doc.setFontSize(18);
        doc.text("HISTÓRICO DO CLIENTE", 65, 35);

        // 📌 Informações do Cliente
        doc.setFontSize(12);
        doc.text(`Nome: ${clientName}`, 20, 45);

        let lastMovement = "Nenhuma movimentação encontrada";
        const rowsHistory = document.querySelectorAll("#clientHistoryTable tbody tr");
        if (rowsHistory.length > 0) {
            lastMovement = rowsHistory[0].children[0].textContent;
        }
        doc.text(`Última Movimentação: ${lastMovement}`, 20, 53);
        doc.line(20, 55, 190, 55);

        // 📌 Histórico de Movimentações - Entradas
        doc.setFontSize(14);
        doc.text("HISTÓRICO DE ENTRADAS", 20, 63);
        doc.setFontSize(10);
        doc.text("Data       | Produto    | Quantidade", 20, 70);
        doc.line(20, 72, 190, 72);

        let y = 78;
        rowsHistory.forEach(row => {
            const data = row.children[0].textContent;
            const produto = row.children[1].textContent;
            const tipo = row.children[2].textContent;
            const quantidade = row.children[3].textContent;

            if (tipo === "Entrada") {
                doc.text(`${data} | ${produto} | Entrada: ${quantidade}`, 20, y);
                y += 6;
            }
        });

        
        doc.setFontSize(14);
        doc.line(20, y + 3, 190, y + 3); // Linha antes do título
        doc.text("HISTÓRICO DE SAÍDAS", 20, y + 10);
        doc.setFontSize(10);
        doc.text("Data       | Produto    | Quantidade", 20, y + 18);
        doc.line(20, y + 20, 190, y + 20);

        let ySaida = y + 25;
        rowsHistory.forEach(row => {
            const data = row.children[0].textContent;
            const produto = row.children[1].textContent;
            const tipo = row.children[2].textContent;
            const quantidade = row.children[3].textContent;

            if (tipo === "Saída") {
                doc.text(`${data} | ${produto} | Saída: ${quantidade}`, 20, ySaida);
                ySaida += 6;
            }
        });

        // 📌 Saldo de Produtos
        doc.setFontSize(14);
        doc.line(20, ySaida + 3, 190, ySaida + 3); // Linha antes do título
        doc.text("SALDO DE PRODUTOS", 20, ySaida + 10);
        doc.setFontSize(10);
        doc.text("Produto   | Quantidade", 20, ySaida + 18);
        doc.line(20, ySaida + 20, 190, ySaida + 20);

        let ySaldo = ySaida + 25;
        const rowsSaldo = document.querySelectorAll("#listaSaldo li");
        rowsSaldo.forEach(row => {
            doc.text(row.textContent, 20, ySaldo);
            ySaldo += 6;
        });

        // 📌 Rodapé
        doc.setFontSize(10);
        doc.text(`Gerado em: ${dateNow}`, 20, ySaldo + 10);
        doc.text("Rodeio Agronegócio", 20, ySaldo + 16);

        // 📌 Salva o PDF
        doc.save(`relatorio_${clientName}.pdf`);
    };
});