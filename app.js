/* ===========================================================
   Configuração de tipos e comportamentos automáticos (final)
   =========================================================== */
const typeInfo = {
  "Água":                     { essencial: true,  juridica: false },
  "Luz":                      { essencial: true,  juridica: false },
  "Gás":                      { essencial: true,  juridica: false },
  "Internet":                 { essencial: true,  juridica: false },
  "Telefone":                 { essencial: true,  juridica: false },
  "Aluguel":                  { essencial: true,  juridica: false },
  "Condomínio":               { essencial: true,  juridica: true },
  "Financiamento Imobiliário":{ essencial: false, juridica: true },
  "Financiamento Veículo":    { essencial: false, juridica: true },
  "Pensão Alimentícia":       { essencial: false, juridica: true },
  "Cartão de Crédito":        { essencial: false, juridica: false },
  "Cheque Especial":          { essencial: false, juridica: false },
  "Empréstimo Pessoal":       { essencial: false, juridica: false },
  "Outro":                    { essencial: false, juridica: false }
};

const debtTypes = Object.keys(typeInfo);

/* ===========================================================
   Estado da aplicação (memória)
   =========================================================== */
let state = {
  renda: 0,
  despesasFixas: 0,
  debts: [] 
};

function nowId(){ return Date.now().toString(36)+Math.random().toString(36).slice(2,6); }
function formatCurrency(v){ return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(v||0); }

/* ===========================================================
   Funções de pontuação
   =========================================================== */
function scoreJuros(juros){
  if(juros <= 0) return 1;
  if(juros < 3) return 1;
  if(juros < 6) return 2;
  if(juros < 10) return 3;
  return 4;
}
function scoreValor(valor){
  if(valor <= 500) return 1;
  if(valor <= 2000) return 2;
  if(valor <= 10000) return 3;
  return 4;
}
function scoreTempo(meses){
  if(meses <= 1) return 1;
  if(meses <= 3) return 2;
  if(meses <= 12) return 3;
  return 4;
}

/* ===========================================================
   Cálculo do Índice de Prioridade (FTP)
   =========================================================== */
function calcFin(d){
  const Pj = scoreJuros(Number(d.juros));
  const Pv = scoreValor(Number(d.valor));
  const Pt = scoreTempo(Number(d.meses));
  const Fin = (Pj + Pv + Pt) / 3;
  return Fin;
}

function calcIP(d){
  // 1. Dimensão Financeira (sempre calculada)
  const Fin = calcFin(d); // 1..4

  // 2. Dimensão Essencial
  const P_Ess = d.essencial ? 4 : 0;

  // 3. Dimensão Jurídica
  let P_Jur = 0;
  if (d.conseqLegal) {
    P_Jur = d.jurImediata ? 2 : 1;
  }

  // Soma final
  const IP = P_Ess + P_Jur + Fin;

  return Math.round(IP * 100) / 100;
}

/* ===========================================================
   Render principal
   =========================================================== */
function render(){
  const available = Math.max(0, Number(state.renda) - Number(state.despesasFixas));
  const debtsWithIP = state.debts.map(d => ({...d, ip: calcIP(d)}))
                                 .sort((a,b) => b.ip - a.ip);

  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="grid grid-cols-3 gap-6">

      <div class="col-span-2 space-y-6">

        <div class="card">
          <div class="flex items-center justify-between">
            <h1 class="text-2xl font-bold">Desendividador</h1>
            <div class="text-sm muted">Olá, <span id="user-name"></span></div>
          </div>

          <div class="mt-4 grid grid-cols-3 gap-4">
            <div>
              <label class="small">Renda mensal</label>
              <input id="inp-renda" type="number" class="w-full p-2 border rounded" value="${state.renda || ''}">
            </div>
            <div>
              <label class="small">Despesas fixas</label>
              <input id="inp-despesas" type="number" class="w-full p-2 border rounded" value="${state.despesasFixas || ''}">
            </div>
            <div class="flex items-end">
              <div>
                <div class="small muted">Disponível para dívidas</div>
                <div class="text-lg font-semibold">${formatCurrency(available)}</div>
              </div>
            </div>
          </div>

          <div class="mt-3">
            <button id="btn-save-fin" class="px-3 py-2 bg-blue-600 text-white rounded">Salvar</button>
          </div>
        </div>

        <div class="card">
          <h2 class="font-semibold mb-3">Adicionar / editar dívida</h2>

          <div class="grid grid-cols-1 gap-3">
            <div>
              <label class="small">Tipo</label>
              <select id="sel-tipo" class="w-full p-2 border rounded">
                <option value="">-- selecione --</option>
                ${debtTypes.map(t=>`<option value="${t}">${t}</option>`).join('')}
              </select>
            </div>

            <div class="grid grid-cols-3 gap-3">
              <div>
                <label class="small">Valor (R$)</label>
                <input id="inp-valor" type="number" class="w-full p-2 border rounded">
              </div>
              <div>
                <label class="small">Juros (% a.m.)</label>
                <input id="inp-juros" type="number" class="w-full p-2 border rounded">
              </div>
              <div>
                <label class="small">Prazo (meses)</label>
                <input id="inp-meses" type="number" class="w-full p-2 border rounded">
              </div>
            </div>

            <div class="flex gap-4 items-center">
              <label class="inline"><input id="chk-essencial" type="checkbox"> <span class="small">Essencial</span></label>
              <label class="inline"><input id="chk-conseq-fin" type="checkbox"> <span class="small">Consequência Financeira</span></label>
              <label class="inline"><input id="chk-conseq-legal" type="checkbox"> <span class="small">Consequência Jurídica</span></label>
            </div>

            <div id="juridica-imediata-box" style="display:none;">
              <div class="small muted">A consequência jurídica é imediata?</div>
              <label class="inline"><input name="jur-imed" type="radio" value="sim"> Sim</label>
              <label class="inline"><input name="jur-imed" type="radio" value="nao"> Não</label>
            </div>

            <div class="pt-2">
              <button id="btn-add" class="px-4 py-2 bg-green-600 text-white rounded">Adicionar dívida</button>
              <button id="btn-sample" class="ml-2 px-3 py-2 border rounded">Gerar exemplos</button>
            </div>
          </div>
        </div>

        <div class="card">
          <h2 class="font-semibold mb-3">Suas dívidas (ordem de prioridade)</h2>

          ${
            debtsWithIP.length === 0 
            ? `<p class="muted">Nenhuma dívida cadastrada.</p>`
            : debtsWithIP.map((d,idx)=>{
                let color = "#10b981";
                if (d.ip >= 13) color = "#ef4444";
                else if (d.ip >= 10) color = "#f59e0b";
                else if (d.ip >= 7)  color = "#3b82f6";

                return `
                <div class="border rounded p-3 mb-3">
                  <div class="flex justify-between">
                    <div>
                      <div class="font-semibold">${idx+1}. ${d.tipo} — ${formatCurrency(d.valor)}</div>
                      <div class="small muted">Juros: ${d.juros}% • Prazo: ${d.meses} meses</div>
                      <div class="small mt-2">
                        ${d.essencial ? '<span class="mr-2">Essencial</span>' : ''}
                        ${d.conseqFin ? '<span class="mr-2">Conseq. Financeira</span>' : ''}
                        ${d.conseqLegal 
                          ? (d.jurImediata ? '<span class="mr-2">Conseq. Jurídica (imediata)</span>' 
                                           : '<span class="mr-2">Conseq. Jurídica</span>')
                          : ''
                        }
                      </div>
                    </div>
                    <div class="text-right">
                      <div class="priority-badge" style="background:${color}">${Math.round(d.ip)}</div>
                      <div class="mt-2"><button class="btn-del px-2 py-1 border rounded small" data-id="${d.id}">Excluir</button></div>
                    </div>
                  </div>
                </div>`;
            }).join('')
          }
        </div>

      </div>

      <div>
        <div class="card mb-4">
          <h3 class="font-semibold">Pagamento possível com valor disponível</h3>
          <div class="small muted mt-2">Ordem considera prioridade (IP) e valor das dívidas.</div>
          <div id="pay-report" class="mt-3 small"></div>
        </div>

        <div class="card">
          <h3 class="font-semibold">Resumo</h3>
          <div class="small mt-2">Total de dívidas: <strong>${state.debts.length}</strong></div>
          <div class="small mt-1">
            Total (principal): 
            <strong>${formatCurrency(state.debts.reduce((s,x)=>s+Number(x.valor||0),0))}</strong>
          </div>
        </div>
      </div>

    </div>
  `;

  attachHandlers();
  updatePayReport();
}

/* ===========================================================
   Handlers
   =========================================================== */
function attachHandlers(){
  const btnSave = document.getElementById('btn-save-fin');
  if(btnSave) btnSave.onclick = ()=>{
    state.renda = Number(document.getElementById('inp-renda').value || 0);
    state.despesasFixas = Number(document.getElementById('inp-despesas').value || 0);
    render();
  };

  const selTipo = document.getElementById('sel-tipo');
  if(selTipo) selTipo.onchange = ()=>{
    const tipo = selTipo.value;
    if(!tipo) return;
    const info = typeInfo[tipo] || {essencial:false, juridica:false};

    document.getElementById('chk-essencial').checked = info.essencial;
    document.getElementById('chk-conseq-legal').checked = info.juridica;

    const j = Number(document.getElementById('inp-juros').value || 0);
    document.getElementById('chk-conseq-fin').checked = j > 0;

    const box = document.getElementById('juridica-imediata-box');
    if(info.juridica){
      box.style.display = 'block';
      const radios = document.getElementsByName('jur-imed');
      radios.forEach(r=> r.checked = false);
    } else {
      box.style.display = 'none';
      const radios = document.getElementsByName('jur-imed');
      radios.forEach(r=> r.checked = false);
    }
  };

  const inpJuros = document.getElementById('inp-juros');
  if(inpJuros) inpJuros.oninput = ()=>{
    const j = Number(inpJuros.value || 0);
    document.getElementById('chk-conseq-fin').checked = j > 0;
  };

  const btnAdd = document.getElementById('btn-add');
  if(btnAdd) btnAdd.onclick = ()=>{
    const tipo = document.getElementById('sel-tipo').value;
    const valor = Number(document.getElementById('inp-valor').value || 0);
    const juros = Number(document.getElementById('inp-juros').value || 0);
    const meses = Number(document.getElementById('inp-meses').value || 0);

    if(!tipo || !valor || !meses){
      alert('Preencha tipo, valor e prazo.');
      return;
    }

    const essencial = document.getElementById('chk-essencial').checked;
    const conseqFin = document.getElementById('chk-conseq-fin').checked;
    const conseqLegal = document.getElementById('chk-conseq-legal').checked;

    let jurImediata = false;
    if(conseqLegal){
      const sel = document.querySelector("input[name='jur-imed']:checked");
      jurImediata = sel ? (sel.value === 'sim') : false;
    }

    const debt = {
      id: nowId(),
      tipo, valor, juros, meses,
      essencial, conseqFin, conseqLegal, jurImediata
    };

    state.debts.push(debt);

    document.getElementById('sel-tipo').value = '';
    document.getElementById('inp-valor').value = '';
    document.getElementById('inp-juros').value = '';
    document.getElementById('inp-meses').value = '';
    document.getElementById('chk-essencial').checked = false;
    document.getElementById('chk-conseq-fin').checked = false;
    document.getElementById('chk-conseq-legal').checked = false;
    document.getElementById('juridica-imediata-box').style.display = 'none';

    render();
  };

  const btnSample = document.getElementById('btn-sample');
  if(btnSample) btnSample.onclick = ()=>{
    const examples = [
      { tipo:"Cartão de Crédito", valor:1300, juros:11, meses:12 },
      { tipo:"Água", valor:180, juros:0, meses:1 },
      { tipo:"Financiamento Imobiliário", valor:85000, juros:1, meses:360 },
      { tipo:"Pensão Alimentícia", valor:700, juros:0, meses:1 },
      { tipo:"Financiamento Veículo", valor:22000, juros:2, meses:60 },
      { tipo:"Condomínio", valor:1200, juros:0, meses:12 }
    ];

    examples.forEach(e=>{
      const info = typeInfo[e.tipo] || {essencial:false, juridica:false};
      state.debts.push({
        id: nowId(),
        tipo: e.tipo, valor: e.valor, juros: e.juros, meses: e.meses,
        essencial: info.essencial,
        conseqFin: e.juros>0,
        conseqLegal: info.juridica,
        jurImediata: info.juridica ? false : false
      });
    });

    render();
  };

  document.querySelectorAll('.btn-del').forEach(btn=>{
    btn.onclick = ()=>{
      const id = btn.getAttribute('data-id');
      state.debts = state.debts.filter(d=> d.id !== id);
      render();
    };
  });
}

/* ===========================================================
   Relatório de pagamento possível
   =========================================================== */
function updatePayReport(){
  const available = Math.max(0, Number(state.renda) - Number(state.despesasFixas));
  const ordered = state.debts.map(d => ({...d, ip: calcIP(d)}))
                           .sort((a,b)=> b.ip - a.ip);

  let saldo = available;
  let pagos = [];

  for(const d of ordered){
    if(saldo >= d.valor){
      pagos.push(d);
      saldo -= d.valor;
    }
  }

  const container = document.getElementById('pay-report');
  if(!container) return;

  if(pagos.length === 0){
    container.innerHTML = `<div class="muted">Nenhuma dívida pode ser paga com o valor disponível.</div>`;
  } else {
    container.innerHTML =
      pagos.map((p,i)=> `<div>${i+1}. ${p.tipo} — ${formatCurrency(p.valor)}</div>`).join('') +
      `<div class="mt-2"><strong>Restará:</strong> ${formatCurrency(saldo)}</div>`;
  }
}

/* ===========================================================
   LocalStorage (opcional)
   =========================================================== */
function saveState(){
  try {
    localStorage.setItem('desendividor_state', JSON.stringify(state));
  } catch(e){}
}
function loadState(){
  try {
    const raw = localStorage.getItem('desendividor_state');
    if(raw) state = JSON.parse(raw);
  } catch(e){}
}

/* ===========================================================
   Inicialização
   =========================================================== */
loadState();
render();

window.addEventListener('beforeunload', ()=> saveState());
