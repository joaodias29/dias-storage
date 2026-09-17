// app.js

// 1. BANCO DE DADOS LOCAL
let vendas = JSON.parse(localStorage.getItem('vendas_simulador_v6')) || [];
let nextSeq = parseInt(localStorage.getItem('seq_simulador_v6')) || 1001;

// Seed inicial
if (vendas.length === 0) {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    const lastMonthStr = d.toISOString().split('T')[0];
    vendas = [
        { id: 1, pedido: "PED-0999", dataCadastro: lastMonthStr, cliente: { nome: "Cliente Teste Antigo", cnpj: "00.000.000/0001-00", contato: "11999999999" }, produto: { desc: "Controle Xbox - Halo", qtd: 1, valorTotal: 650 }, pagamento: { parcelas: 1 }, parcelas: [{ id: 11, numero: 1, valor: 650, vencimento: lastMonthStr, status: 'Pago' }] },
        { id: 2, pedido: "PED-1000", dataCadastro: lastMonthStr, cliente: { nome: "Gamer Store S/A", cnpj: "11.111.111/0001-11", contato: "11988888888" }, produto: { desc: "PS5 - Edição God of War", qtd: 1, valorTotal: 4500 }, pagamento: { parcelas: 1 }, parcelas: [{ id: 22, numero: 1, valor: 4500, vencimento: lastMonthStr, status: 'Pago' }] }
    ];
    localStorage.setItem('vendas_simulador_v6', JSON.stringify(vendas));
}

const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
const formatDate = (dateString) => { const [year, month, day] = dateString.split('-'); return `${day}/${month}/${year}`; };

// 2. NAVEGAÇÃO
const storeView = document.getElementById('store-view');
const adminView = document.getElementById('admin-view');

function navigateStore(pageId) {
    document.querySelectorAll('.store-section').forEach(sec => sec.classList.add('hidden'));
    document.getElementById(`store-${pageId}`).classList.remove('hidden');
    window.scrollTo(0, 0);
}
function requestAdminAccess() { storeView.classList.add('hidden'); adminView.classList.remove('hidden'); navigateAdmin('dashboard'); }
function exitAdmin() { adminView.classList.add('hidden'); storeView.classList.remove('hidden'); navigateStore('home'); }

// 3. LOJA
const productsDB = {
    1: { name: "PS5 - Edição God of War", price: 4500, img: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=800&q=80" },
    2: { name: "Switch OLED - Zelda", price: 2800, img: "https://images.unsplash.com/photo-1612282130134-4b6782488a0e?auto=format&fit=crop&w=800&q=80" },
    3: { name: "Controle Xbox - Halo", price: 650, img: "https://images.unsplash.com/photo-1628527304948-0615f6176313?auto=format&fit=crop&w=800&q=80" },
    4: { name: "Console Retro PRO", price: 500, img: "https://images.unsplash.com/photo-1605901309584-818e25960b8f?auto=format&fit=crop&w=800&q=80" }
};
let BASE_PRICE = 500; let currentStorePrice = BASE_PRICE; let storeProductDescription = "";

function loadProduct(id) {
    const p = productsDB[id];
    BASE_PRICE = p.price; storeProductDescription = p.name;
    document.getElementById('product-title-detail').innerText = p.name;
    document.getElementById('product-image-detail').src = p.img;
    document.getElementById('store-form').reset();
    updateStorePrice(); navigateStore('product');
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
    localStorage.setItem('seq_simulador_v6', nextSeq);
    const cliente = { nome: document.getElementById('chk-nome').value, cnpj: document.getElementById('chk-cnpj').value, contato: document.getElementById('chk-zap').value.replace(/\D/g, '') };
    const parcelas = parseInt(document.getElementById('chk-parcelas').value);
    const parcelasArr = []; let dataAtual = new Date();
    for (let i = 1; i <= parcelas; i++) {
        parcelasArr.push({ id: Date.now() + i, numero: i, valor: currentStorePrice / parcelas, vencimento: dataAtual.toISOString().split('T')[0], status: 'Pendente' });
        dataAtual.setMonth(dataAtual.getMonth() + 1);
    }
    vendas.push({ id: Date.now(), pedido: pedidoNum, dataCadastro: new Date().toISOString().split('T')[0], cliente, produto: { desc: storeProductDescription, qtd: 1, valorTotal: currentStorePrice }, pagamento: { parcelas }, parcelas: parcelasArr });
    localStorage.setItem('vendas_simulador_v6', JSON.stringify(vendas));
    
    alert(`Compra Realizada (Pedido ${pedidoNum}).\nAcesse o Simulador ERP no menu superior para visualizar os relatórios dinâmicos.`);
    closeCheckoutModal(); this.reset(); navigateStore('home');
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
                    ${status !== 'Pago' ? `<button onclick="marcarPago(${venda.id}, ${parcela.id})" class="text-emerald-600 hover:underline text-sm font-bold">Baixar Pago</button>` : ''}
                    <button onclick="gerarFatura(${venda.id}, ${parcela.id})" class="text-blue-600 hover:underline text-sm font-bold">Boleto</button>
                </td>
            </tr>`;
        });
    });
}
function marcarPago(vId, pId) { vendas.find(v => v.id === vId).parcelas.find(p => p.id === pId).status = 'Pago'; localStorage.setItem('vendas_simulador_v6', JSON.stringify(vendas)); renderRelatorios(); renderDashboard(); }
function gerarFatura(vId, pId) {
    const venda = vendas.find(v => v.id === vId); const parcela = venda.parcelas.find(p => p.id === pId);
    document.getElementById('bol-pedido').textContent = venda.pedido; document.getElementById('bol-vencimento').textContent = formatDate(parcela.vencimento);
    document.getElementById('bol-cliente').textContent = venda.cliente.nome; document.getElementById('bol-cnpj').textContent = `CNPJ/CPF: ${venda.cliente.cnpj}`; document.getElementById('bol-valor').textContent = formatCurrency(parcela.valor); navigateAdmin('boleto-view');
}

// Clientes
function renderClientes() { 
    const tbody = document.getElementById('clientes-body'); tbody.innerHTML = '';
    const map = {}; vendas.forEach(v => { const doc = v.cliente.cnpj; if (!map[doc]) map[doc] = { nome: v.cliente.nome, cnpj: doc, contato: v.cliente.contato, total: 0 }; map[doc].total += v.produto.valorTotal; });
    Object.values(map).forEach(c => { tbody.innerHTML += `<tr><td class="px-6 py-4 font-bold">${c.nome}</td><td class="px-6 py-4">${c.cnpj}</td><td class="px-6 py-4">${c.contato}</td><td class="px-6 py-4 font-bold text-teal-600">${formatCurrency(c.total)}</td><td class="px-6 py-4"><button onclick="window.open('https://wa.me/55${c.contato}')" class="text-green-600 font-bold hover:underline">WhatsApp</button></td></tr>`; });
}

// --- NOVO: Venda Manual Inteligente ---
document.getElementById('prod-select').addEventListener('change', function(e) {
    const val = e.target.value;
    const customInput = document.getElementById('prod-desc-custom');
    const unitInput = document.getElementById('prod-unitario');
    
    if (val === 'custom') {
        customInput.classList.remove('hidden'); customInput.required = true;
        unitInput.value = ''; unitInput.readOnly = false;
    } else if (val !== '') {
        customInput.classList.add('hidden'); customInput.required = false;
        unitInput.value = productsDB[val].price; 
    } else {
        customInput.classList.add('hidden'); customInput.required = false; unitInput.value = '';
    }
    calcTotalAdmin();
});

function calcTotalAdmin() { document.getElementById('display-total-item').textContent = formatCurrency((parseInt(document.getElementById('prod-qtd').value)||0) * (parseFloat(document.getElementById('prod-unitario').value)||0)); }

document.getElementById('venda-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const pedidoNum = `PED-${nextSeq++}`;
    localStorage.setItem('seq_simulador_v6', nextSeq);
    
    const cliente = { nome: document.getElementById('cli-nome').value, cnpj: document.getElementById('cli-cnpj').value, contato: document.getElementById('cli-contato').value.replace(/\D/g, '') };
    const qtd = parseInt(document.getElementById('prod-qtd').value);
    const unit = parseFloat(document.getElementById('prod-unitario').value);
    const totalCalc = qtd * unit;
    
    const selectVal = document.getElementById('prod-select').value;
    let desc = selectVal === 'custom' ? document.getElementById('prod-desc-custom').value : productsDB[selectVal].name;

    const produto = { desc: desc, qtd: qtd, valorUnitario: unit, valorTotal: totalCalc };
    const parcelas = parseInt(document.getElementById('pag-parcelas').value);
    const primeiroVenc = document.getElementById('pag-vencimento').value;
    
    const parcelasArr = []; let dataAtual = new Date(primeiroVenc + 'T12:00:00Z');
    for (let i = 1; i <= parcelas; i++) {
        parcelasArr.push({ id: Date.now() + i, numero: i, valor: totalCalc / parcelas, vencimento: dataAtual.toISOString().split('T')[0], status: 'Pendente' });
        dataAtual.setMonth(dataAtual.getMonth() + 1);
    }

    vendas.push({ id: Date.now(), pedido: pedidoNum, dataCadastro: new Date().toISOString().split('T')[0], cliente, produto, pagamento: { parcelas }, parcelas: parcelasArr });
    localStorage.setItem('vendas_simulador_v6', JSON.stringify(vendas));
    
    alert(`Venda manual registrada! (Pedido ${pedidoNum})`);
    this.reset();
    document.getElementById('display-total-item').textContent = 'R$ 0,00';
    document.getElementById('prod-desc-custom').classList.add('hidden');
    navigateAdmin('relatorios');
});

// Dashboard, Métricas e CALENDÁRIO INTERATIVO
function renderDashboard() {
    const hoje = new Date(); const currMonth = hoje.getMonth(); const currYear = hoje.getFullYear(); const todayStr = hoje.toISOString().split('T')[0];
    const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    document.getElementById('dash-month-label').textContent = `${monthNames[currMonth]} ${currYear}`;

    let prevMonth = currMonth - 1; let prevYear = currYear; if (prevMonth < 0) { prevMonth = 11; prevYear--; }
    let currTotal = 0, prevTotal = 0; let currPend = 0, prevPend = 0; let currOver = 0, prevOver = 0;
    const proximas = [];

    vendas.forEach(v => {
        const vDate = new Date(v.dataCadastro);
        if (vDate.getMonth() === currMonth && vDate.getFullYear() === currYear) currTotal += v.produto.valorTotal;
        if (vDate.getMonth() === prevMonth && vDate.getFullYear() === prevYear) prevTotal += v.produto.valorTotal;

        v.parcelas.forEach(p => {
            const pDate = new Date(p.vencimento);
            let isAtrasado = p.status === 'Pendente' && p.vencimento < todayStr;
            
            if (pDate.getMonth() === currMonth && pDate.getFullYear() === currYear) {
                if (p.status === 'Pendente' && !isAtrasado) currPend += p.valor;
                if (isAtrasado) currOver += p.valor;
            }
            if (pDate.getMonth() === prevMonth && pDate.getFullYear() === prevYear) {
                if (p.status === 'Pendente') prevPend += p.valor;
                if (p.status === 'Pendente' && p.vencimento < todayStr) prevOver += p.valor;
            }
            if (p.status !== 'Pago') proximas.push({ ...p, cliente: v.cliente.nome, contato: v.cliente.contato, pedido: v.pedido, isAtrasado, vendaId: v.id });
        });
    });

    document.getElementById('dash-total').textContent = formatCurrency(currTotal);
    document.getElementById('dash-pending').textContent = formatCurrency(currPend);
    document.getElementById('dash-overdue').textContent = formatCurrency(currOver);

    const getTrendHtml = (current, previous, inverseLogic = false) => {
        if (previous === 0) return `<span class="text-slate-400 font-normal">Sem dados</span>`;
        const diff = ((current - previous) / previous) * 100;
        if (diff === 0) return `<span class="text-slate-400 font-normal">Igual</span>`;
        let isGood = inverseLogic ? diff < 0 : diff > 0;
        const colorClass = isGood ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700';
        return `<span class="px-2 py-0.5 rounded ${colorClass}">${diff > 0 ? '↑' : '↓'} ${Math.abs(diff).toFixed(1)}%</span> <span class="text-slate-400 font-normal ml-1">vs Mês Anterior</span>`;
    };
    document.getElementById('trend-total').innerHTML = getTrendHtml(currTotal, prevTotal);
    document.getElementById('trend-pending').innerHTML = getTrendHtml(currPend, prevPend);
    document.getElementById('trend-overdue').innerHTML = getTrendHtml(currOver, prevOver, true);

    // Timeline
    const list = document.getElementById('agenda-list'); list.innerHTML = '';
    proximas.sort((a, b) => a.vencimento.localeCompare(b.vencimento));
    proximas.slice(0, 10).forEach(i => {
        list.innerHTML += `<li class="p-3 flex items-center justify-between border-b border-slate-100 text-sm">
            <div><span class="${i.isAtrasado?'text-rose-600':'text-teal-600'} font-bold">${formatDate(i.vencimento)}</span> - ${i.cliente}</div>
            <div class="font-bold">${formatCurrency(i.valor)}</div>
        </li>`;
    });

    // Calendário Interativo
    const calGrid = document.getElementById('calendar-grid'); calGrid.innerHTML = '';
    document.getElementById('calendar-header').textContent = `${monthNames[currMonth]} ${currYear}`;
    const firstDayIndex = new Date(currYear, currMonth, 1).getDay();
    const lastDay = new Date(currYear, currMonth + 1, 0).getDate();

    for (let i = 0; i < firstDayIndex; i++) calGrid.innerHTML += `<div class="cal-day empty"></div>`;
    
    for (let i = 1; i <= lastDay; i++) {
        const dayStr = `${currYear}-${String(currMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        let isToday = (dayStr === todayStr) ? 'today' : '';
        let cobrancasDia = proximas.filter(c => c.vencimento === dayStr);
        let hasPending = false, hasOverdue = false;
        
        if (cobrancasDia.length > 0) {
            cobrancasDia.forEach(c => { if (c.isAtrasado) hasOverdue = true; else hasPending = true; });
        }
        let extraClass = hasOverdue ? 'has-overdue' : (hasPending ? 'has-pending' : '');
        let dot = hasOverdue ? '<div class="cal-dot overdue"></div>' : (hasPending ? '<div class="cal-dot pending"></div>' : '');
        
        // NOVO: Adiciona clique se tiver cobrança
        let clickEvent = (hasPending || hasOverdue) ? `onclick="openCalendarModal('${dayStr}')"` : '';

        calGrid.innerHTML += `<div class="cal-day ${isToday} ${extraClass}" ${clickEvent}>${i}${dot}</div>`;
    }
}

// 5. MODAL DO CALENDÁRIO
function openCalendarModal(dateStr) {
    const list = document.getElementById('cal-modal-list');
    list.innerHTML = '';
    document.getElementById('cal-modal-title').textContent = `Cobranças do dia ${formatDate(dateStr)}`;
    
    const hoje = new Date().toISOString().split('T')[0];
    const cobrancas = [];
    vendas.forEach(v => {
        v.parcelas.forEach(p => {
            if (p.vencimento === dateStr && p.status !== 'Pago') {
                cobrancas.push({...p, cliente: v.cliente, pedido: v.pedido, vendaId: v.id});
            }
        });
    });

    if(cobrancas.length === 0) {
        list.innerHTML = '<p class="text-center text-slate-500 py-4">Nenhuma cobrança pendente para este dia.</p>';
    } else {
        cobrancas.forEach(c => {
            let isAtrasado = c.vencimento < hoje;
            list.innerHTML += `
                <li class="bg-slate-50 border border-slate-200 p-4 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <p class="font-bold text-slate-800 text-lg">${c.cliente.nome}</p>
                        <p class="text-sm text-slate-500">Ref: ${c.pedido} (Parcela ${c.numero})</p>
                        <span class="inline-block mt-1 px-2 py-0.5 text-xs font-bold rounded ${isAtrasado ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'} uppercase">${isAtrasado ? 'Atrasado' : 'Pendente'}</span>
                    </div>
                    <div class="text-left md:text-right w-full md:w-auto">
                        <p class="text-xl font-black text-slate-900 mb-2">${formatCurrency(c.valor)}</p>
                        <div class="flex gap-2">
                            <button onclick="marcarPagoModal(${c.vendaId}, ${c.id}, '${dateStr}')" class="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 px-3 py-1 rounded text-sm font-bold transition">Dar Baixa</button>
                            <button onclick="cobrarWhatsAppModal('${c.cliente.contato}', '${c.pedido}', ${c.numero}, ${c.valor}, '${c.vencimento}')" class="bg-green-500 text-white hover:bg-green-600 px-3 py-1 rounded text-sm font-bold transition flex items-center gap-1">Cobrar via Zap</button>
                        </div>
                    </div>
                </li>
            `;
        });
    }
    document.getElementById('calendar-modal').classList.remove('hidden');
}

function closeCalendarModal() {
    document.getElementById('calendar-modal').classList.add('hidden');
}

function marcarPagoModal(vId, pId, dateStr) {
    if(confirm('Confirmar recebimento desta parcela?')) {
        vendas.find(v => v.id === vId).parcelas.find(p => p.id === pId).status = 'Pago';
        localStorage.setItem('vendas_simulador_v6', JSON.stringify(vendas));
        renderDashboard(); renderRelatorios();
        openCalendarModal(dateStr); // Atualiza o modal na hora
    }
}

function cobrarWhatsAppModal(contato, pedido, parcela, valor, vencimento) {
    const msg = `Olá! Somos da *Dias Store*. 
Informamos que o seu boleto referente ao pedido *${pedido}* (Parcela ${parcela}) no valor de *${formatCurrency(valor)}* vence dia *${formatDate(vencimento)}*.`;
    window.open(`https://wa.me/55${contato}?text=${encodeURIComponent(msg)}`, '_blank');
}

navigateStore('home');
