// app.js

// 1. BANCO DE DADOS LOCAL
let vendas = JSON.parse(localStorage.getItem('vendas_simulador_v4')) || [];
let nextSeq = parseInt(localStorage.getItem('seq_simulador_v4')) || 1001;

const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
const formatDate = (dateString) => {
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
};

// 2. CONTROLES E NAVEGAÇÃO
const storeView = document.getElementById('store-view');
const adminView = document.getElementById('admin-view');

function navigateStore(pageId) {
    document.querySelectorAll('.store-section').forEach(sec => sec.classList.add('hidden'));
    document.getElementById(`store-${pageId}`).classList.remove('hidden');
    window.scrollTo(0, 0);
}

function requestAdminAccess() {
    storeView.classList.add('hidden');
    adminView.classList.remove('hidden');
    navigateAdmin('dashboard');
}

function exitAdmin() {
    adminView.classList.add('hidden');
    storeView.classList.remove('hidden');
    navigateStore('home');
}

// 3. PRODUTOS DA LOJA
const productsDB = {
    1: { name: "PS5 - Edição God of War", price: 4500, img: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=800&q=80" },
    2: { name: "Switch OLED - Zelda", price: 2800, img: "https://images.unsplash.com/photo-1612282130134-4b6782488a0e?auto=format&fit=crop&w=800&q=80" },
    3: { name: "Controle Xbox - Halo", price: 650, img: "https://images.unsplash.com/photo-1628527304948-0615f6176313?auto=format&fit=crop&w=800&q=80" },
    4: { name: "Console Retro PRO", price: 500, img: "https://images.unsplash.com/photo-1605901309584-818e25960b8f?auto=format&fit=crop&w=800&q=80" }
};

let BASE_PRICE = 500;
let currentStorePrice = BASE_PRICE;
let storeProductDescription = "";

function loadProduct(id) {
    const p = productsDB[id];
    BASE_PRICE = p.price;
    storeProductDescription = p.name;
    document.getElementById('product-title-detail').innerText = p.name;
    document.getElementById('product-image-detail').src = p.img;
    document.getElementById('store-form').reset();
    updateStorePrice();
    navigateStore('product');
}

function updateStorePrice() {
    currentStorePrice = BASE_PRICE;
    storeProductDescription = document.getElementById('product-title-detail').innerText;
    
    document.querySelectorAll('input[type="radio"]').forEach(radio => {
        if (radio.checked) {
            currentStorePrice += parseFloat(radio.value);
            if(radio.value > 0) storeProductDescription += " + " + radio.nextElementSibling.textContent.split('(+')[0].trim();
        }
    });
    document.getElementById('store-price').textContent = formatCurrency(currentStorePrice);
}

document.querySelectorAll('input[type="radio"]').forEach(r => r.addEventListener('change', updateStorePrice));

// Checkout
function openCheckoutModal() { document.getElementById('checkout-modal').classList.remove('hidden'); }
function closeCheckoutModal() { document.getElementById('checkout-modal').classList.add('hidden'); }

document.getElementById('checkout-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const pedidoNum = `PED-${nextSeq++}`;
    localStorage.setItem('seq_simulador_v4', nextSeq);

    const cliente = {
        nome: document.getElementById('chk-nome').value,
        cnpj: document.getElementById('chk-cnpj').value,
        contato: document.getElementById('chk-zap').value.replace(/\D/g, '')
    };
    
    const parcelas = parseInt(document.getElementById('chk-parcelas').value);
    const parcelasArr = [];
    let dataAtual = new Date();
    
    for (let i = 1; i <= parcelas; i++) {
        parcelasArr.push({
            id: Date.now() + i,
            numero: i,
            valor: currentStorePrice / parcelas,
            vencimento: dataAtual.toISOString().split('T')[0],
            status: 'Pendente'
        });
        dataAtual.setMonth(dataAtual.getMonth() + 1);
    }

    vendas.push({ id: Date.now(), pedido: pedidoNum, dataCadastro: new Date().toISOString().split('T')[0], cliente, produto: { desc: storeProductDescription, qtd: 1, valorTotal: currentStorePrice }, pagamento: { parcelas }, parcelas: parcelasArr });
    localStorage.setItem('vendas_simulador_v4', JSON.stringify(vendas));
    
    alert(`Compra Realizada (Pedido ${pedidoNum}). 
Acesse o Simulador ERP no menu superior para gerenciar os boletos e o calendário.`);
    closeCheckoutModal();
    this.reset();
    navigateStore('home');
});

// 4. ERP ADMIN
function navigateAdmin(sectionId) {
    document.querySelectorAll('.admin-section').forEach(sec => sec.classList.add('hidden'));
    document.getElementById(sectionId).classList.remove('hidden');
    if (sectionId === 'dashboard') renderDashboard();
    if (sectionId === 'clientes') renderClientes();
    if (sectionId === 'relatorios') renderRelatorios();
    if (sectionId === 'nova-venda') document.getElementById('display-sequencial').textContent = `Novo: PED-${nextSeq}`;
    window.scrollTo(0, 0);
}

// Clientes
function renderClientes() {
    const tbody = document.getElementById('clientes-body');
    tbody.innerHTML = '';
    const map = {};
    vendas.forEach(v => {
        const doc = v.cliente.cnpj;
        if (!map[doc]) map[doc] = { nome: v.cliente.nome, cnpj: doc, contato: v.cliente.contato, total: 0 };
        map[doc].total += v.produto.valorTotal;
    });
    Object.values(map).forEach(c => {
        tbody.innerHTML += `<tr><td class="px-6 py-4 font-bold">${c.nome}</td><td class="px-6 py-4">${c.cnpj}</td><td class="px-6 py-4">${c.contato}</td><td class="px-6 py-4 font-bold text-teal-600">${formatCurrency(c.total)}</td><td class="px-6 py-4"><button onclick="window.open('https://wa.me/55${c.contato}')" class="text-green-600 font-bold hover:underline">Chamar no WhatsApp</button></td></tr>`;
    });
}

// Venda Manual
function calcTotalAdmin() {
    const total = (parseInt(document.getElementById('prod-qtd').value)||0) * (parseFloat(document.getElementById('prod-unitario').value)||0);
    document.getElementById('display-total-item').textContent = formatCurrency(total);
}
document.getElementById('venda-form').addEventListener('submit', function(e) {
    e.preventDefault();
    // (A mesma lógica de parcelas já implementada anteriormente...)
    alert('Venda manual registrada (simulação simplificada neste exemplo para focar no calendário).');
});

// Relatórios
function renderRelatorios() {
    const tbody = document.getElementById('relatorio-body');
    tbody.innerHTML = '';
    const hoje = new Date().toISOString().split('T')[0];

    [...vendas].reverse().forEach(venda => {
        venda.parcelas.forEach(parcela => {
            let status = parcela.status;
            if (status === 'Pendente' && parcela.vencimento < hoje) status = 'Atrasado';
            let color = status === 'Pago' ? 'text-emerald-800 bg-emerald-100' : (status === 'Atrasado' ? 'text-rose-800 bg-rose-100' : 'text-amber-800 bg-amber-100');
            
            tbody.innerHTML += `<tr class="hover:bg-slate-50 border-b border-slate-100">
                <td class="px-6 py-4 font-bold text-slate-800">${venda.pedido}</td>
                <td class="px-6 py-4">${venda.cliente.nome}</td>
                <td class="px-6 py-4">${parcela.numero}/${venda.pagamento.parcelas}</td>
                <td class="px-6 py-4">${formatDate(parcela.vencimento)}</td>
                <td class="px-6 py-4 font-bold">${formatCurrency(parcela.valor)}</td>
                <td class="px-6 py-4"><span class="px-2 py-1 text-xs font-bold uppercase rounded ${color}">${status}</span></td>
                <td class="px-6 py-4 space-x-2">
                    ${status !== 'Pago' ? `<button onclick="marcarPago(${venda.id}, ${parcela.id})" class="text-emerald-600 hover:underline text-sm font-bold">Dar Baixa</button>` : ''}
                    <button onclick="gerarFatura(${venda.id}, ${parcela.id})" class="text-blue-600 hover:underline text-sm font-bold">Boleto</button>
                </td>
            </tr>`;
        });
    });
}

function marcarPago(vId, pId) {
    vendas.find(v => v.id === vId).parcelas.find(p => p.id === pId).status = 'Pago';
    localStorage.setItem('vendas_simulador_v4', JSON.stringify(vendas));
    renderRelatorios(); renderDashboard();
}

function gerarFatura(vId, pId) {
    const venda = vendas.find(v => v.id === vId);
    const parcela = venda.parcelas.find(p => p.id === pId);
    document.getElementById('bol-pedido').textContent = venda.pedido;
    document.getElementById('bol-vencimento').textContent = formatDate(parcela.vencimento);
    document.getElementById('bol-cliente').textContent = venda.cliente.nome;
    document.getElementById('bol-cnpj').textContent = `CNPJ/CPF: ${venda.cliente.cnpj}`;
    document.getElementById('bol-valor').textContent = formatCurrency(parcela.valor);
    navigateAdmin('boleto-view');
}

// Dashboard & Calendário
function renderDashboard() {
    let total = 0, pendente = 0, atrasado = 0;
    const hoje = new Date().toISOString().split('T')[0];
    const proximas = [];

    // Processa valores
    vendas.forEach(v => {
        total += v.produto.valorTotal;
        v.parcelas.forEach(p => {
            let isAtrasado = p.status === 'Pendente' && p.vencimento < hoje;
            if (p.status === 'Pendente' && !isAtrasado) pendente += p.valor;
            if (isAtrasado) atrasado += p.valor;
            if (p.status !== 'Pago') proximas.push({ ...p, cliente: v.cliente.nome, pedido: v.pedido, isAtrasado });
        });
    });

    document.getElementById('dash-total').textContent = formatCurrency(total);
    document.getElementById('dash-pending').textContent = formatCurrency(pendente);
    document.getElementById('dash-overdue').textContent = formatCurrency(atrasado);

    // Timeline
    const list = document.getElementById('agenda-list');
    list.innerHTML = '';
    proximas.sort((a, b) => a.vencimento.localeCompare(b.vencimento));
    proximas.slice(0, 10).forEach(i => {
        list.innerHTML += `<li class="p-3 flex items-center justify-between border-b border-slate-100 text-sm">
            <div><span class="${i.isAtrasado?'text-rose-600':'text-teal-600'} font-bold">${formatDate(i.vencimento)}</span> - ${i.cliente}</div>
            <div class="font-bold">${formatCurrency(i.valor)}</div>
        </li>`;
    });

    // Construção do Calendário Visual (Mês Atual)
    const calGrid = document.getElementById('calendar-grid');
    calGrid.innerHTML = '';
    
    const date = new Date(); // Data atual
    const year = date.getFullYear();
    const month = date.getMonth();
    const todayStr = date.toISOString().split('T')[0];
    
    const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    document.getElementById('calendar-header').textContent = `${monthNames[month]} ${year}`;

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Dom, 1 = Seg...
    const lastDay = new Date(year, month + 1, 0).getDate(); // Total de dias do mês

    // Espaços vazios antes do dia 1
    for (let i = 0; i < firstDayIndex; i++) {
        calGrid.innerHTML += `<div class="cal-day empty"></div>`;
    }

    // Dias do mês
    for (let i = 1; i <= lastDay; i++) {
        // Formata YYYY-MM-DD
        const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        
        let isToday = (dayStr === todayStr) ? 'today' : '';
        
        // Verifica se há cobranças neste dia específico
        let cobrancasDia = proximas.filter(c => c.vencimento === dayStr);
        let hasPending = false;
        let hasOverdue = false;
        let tooltip = "";

        if (cobrancasDia.length > 0) {
            cobrancasDia.forEach(c => {
                if (c.isAtrasado) hasOverdue = true;
                else hasPending = true;
                tooltip += `${c.cliente} (${formatCurrency(c.valor)})\n`;
            });
        }

        let extraClass = hasOverdue ? 'has-overdue' : (hasPending ? 'has-pending' : '');
        let dot = hasOverdue ? '<div class="cal-dot overdue"></div>' : (hasPending ? '<div class="cal-dot pending"></div>' : '');

        calGrid.innerHTML += `
            <div class="cal-day ${isToday} ${extraClass}" title="${tooltip}">
                ${i}
                ${dot}
            </div>
        `;
    }
}

navigateStore('home');
