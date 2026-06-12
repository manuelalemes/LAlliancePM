const API = '';

// ====== ABAS ======
function mostrarAba(nome) {
  document.querySelectorAll('.aba').forEach(a => a.classList.remove('ativa'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`aba-${nome}`).classList.add('ativa');
  document.querySelectorAll('.nav-btn')[['mapa', 'reservas', 'nova'].indexOf(nome)].classList.add('active');

  if (nome === 'mapa') carregarMapa();
  if (nome === 'reservas') carregarReservas();
}

// ====== MAPA ======
async function carregarMapa() {
  const container = document.getElementById('mapa-container');
  container.innerHTML = '<p class="carregando">Carregando mesas...</p>';

  try {
    const res = await fetch(`${API}/api/mesas`);
    const data = await res.json();

    if (!data.sucesso || !data.dados.length) {
      container.innerHTML = '<p class="sem-dados">Nenhuma mesa cadastrada.</p>';
      return;
    }

    container.innerHTML = data.dados.map(mesa => `
    <div class="mesa-card ${mesa.statusAtual === 'disponível' ? 'disponivel' : mesa.statusAtual}" onclick="abrirModalMesa(${JSON.stringify(JSON.stringify(mesa))})">        <div class="mesa-numero">${mesa.numero}</div>
        <div class="mesa-cap">👥 até ${mesa.capacidade} pessoas</div>
        <div class="mesa-loc">${mesa.localizacao}</div>
        <span class="mesa-status-badge">${mesa.statusAtual}</span>
      </div>
    `).join('');
  } catch (e) {
    container.innerHTML = '<p class="sem-dados">Erro ao carregar mesas. Verifique o servidor.</p>';
  }
}

function abrirModalMesa(mesaJson) {
  const mesa = JSON.parse(mesaJson);
  const modal = document.getElementById('modal');
  const conteudo = document.getElementById('modal-conteudo');

  let html = `
    <div class="modal-mesa-num">Mesa ${mesa.numero}</div>
    <div class="modal-info">${mesa.localizacao} · até ${mesa.capacidade} pessoas</div>
    <span class="badge ${mesa.statusAtual}">${mesa.statusAtual.charAt(0).toUpperCase() + mesa.statusAtual.slice(1)}</span>
  `;

  if (mesa.proximaReserva) {
    const inicio = new Date(mesa.proximaReserva.dataHoraReserva);
    const fim = new Date(mesa.proximaReserva.dataHoraFim);
    html += `
      <div class="modal-reserva-detalhe">
        <p><strong>Próxima reserva</strong></p>
        <p>👤 ${mesa.proximaReserva.nomeCliente}</p>
        <p>🕐 ${formatarData(inicio)} – ${formatarHora(fim)}</p>
        <p>👥 ${mesa.proximaReserva.quantidadePessoas} pessoa(s)</p>
        ${mesa.proximaReserva.observacoes ? `<p>📝 ${mesa.proximaReserva.observacoes}</p>` : ''}
      </div>
    `;
  }

  if (mesa.statusAtual === 'disponível') {
    html += `<button class="modal-btn-reservar" onclick="prepararReservaMesa(${mesa.numero})">Reservar esta mesa</button>`;
  }

  conteudo.innerHTML = html;
  modal.classList.add('aberto');
}

function fecharModal() {
  document.getElementById('modal').classList.remove('aberto');
}

function prepararReservaMesa(numero) {
  fecharModal();
  document.getElementById('numeroMesa').value = numero;
  const minimo = new Date(Date.now() + 61 * 60000);
  const local = new Date(minimo.getTime() - minimo.getTimezoneOffset() * 60000)
    .toISOString().slice(0, 16);
  document.getElementById('dataHoraReserva').value = local;
  document.getElementById('dataHoraReserva').min = local;
  mostrarAba('nova');
}

// ====== RESERVAS ======
async function carregarReservas() {
  const lista = document.getElementById('lista-reservas');
  lista.innerHTML = '<p class="carregando">Carregando reservas...</p>';

  const filtroCliente = document.getElementById('f-cliente').value.trim();
  const filtroMesa = document.getElementById('f-mesa').value.trim();
  const filtroData = document.getElementById('f-data').value;
  const filtroStatus = document.getElementById('f-status').value;

  const params = new URLSearchParams();
  if (filtroCliente) params.set('cliente', filtroCliente);
  if (filtroMesa) params.set('mesa', filtroMesa);
  if (filtroData) params.set('data', filtroData);
  if (filtroStatus) params.set('status', filtroStatus);

  try {
    const res = await fetch(`${API}/api/reservas?${params}`);
    const data2 = await res.json();

    if (!data2.dados.length) {
      lista.innerHTML = '<p class="sem-dados">Nenhuma reserva encontrada.</p>';
      return;
    }

    lista.innerHTML = data2.dados.map(r => {
      const inicio = new Date(r.dataHoraReserva);
      const fim = new Date(r.dataHoraFim);
      const podeEditar = r.status === 'reservado';
      const podeCancelar = r.status === 'reservado' || r.status === 'ocupado';

      return `
        <div class="reserva-item">
          <div class="reserva-status s-${r.status}"></div>
          <div class="reserva-info">
            <div class="reserva-nome">${r.nomeCliente}</div>
            <div class="reserva-detalhe">Mesa ${r.numeroMesa} · ${r.quantidadePessoas} pessoa(s) · ${r.contatoCliente}</div>
            ${r.observacoes ? `<div class="reserva-detalhe">📝 ${r.observacoes}</div>` : ''}
          </div>
          <div class="reserva-horario">
            <strong>${formatarData(inicio)}</strong>
            ${formatarHora(inicio)} – ${formatarHora(fim)}
          </div>
          <span class="badge ${r.status === 'finalizado' || r.status === 'cancelado' ? 'disponivel' : r.status}"
                style="${r.status === 'finalizado' ? 'background:rgba(107,114,128,.15);color:#9ca3af' : r.status === 'cancelado' ? 'background:rgba(55,65,81,.3);color:#6b7280' : ''}">
            ${r.status}
          </span>
          <div class="reserva-acoes">
            ${podeEditar ? `<button class="btn-edit" onclick="editarReserva('${r._id}')">Editar</button>` : ''}
            ${podeCancelar ? `<button class="btn-danger" onclick="cancelarReserva('${r._id}', '${r.nomeCliente}')">Cancelar</button>` : ''}
          </div>
        </div>
      `;
    }).join('');
  } catch (e) {
    lista.innerHTML = '<p class="sem-dados">Erro ao carregar reservas.</p>';
  }
}

async function cancelarReserva(id, nome) {
  if (!confirm(`Cancelar a reserva de ${nome}?`)) return;

  try {
    const res = await fetch(`${API}/api/reservas/${id}`, { method: 'DELETE' });
    const data = await res.json();
    alert(data.mensagem);
    carregarReservas();
  } catch {
    alert('Erro ao cancelar reserva.');
  }
}

async function editarReserva(id) {
  try {
    const res = await fetch(`${API}/api/reservas/${id}`);
    const data = await res.json();
    const r = data.dados;

    document.getElementById('reserva-id').value = r._id;
    document.getElementById('nomeCliente').value = r.nomeCliente;
    document.getElementById('contatoCliente').value = r.contatoCliente;
    document.getElementById('numeroMesa').value = r.numeroMesa;
    document.getElementById('quantidadePessoas').value = r.quantidadePessoas;
    document.getElementById('duracaoMinutos').value = r.duracaoMinutos;
    document.getElementById('observacoes').value = r.observacoes || '';

    const dt = new Date(r.dataHoraReserva);
    const local = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000)
      .toISOString().slice(0, 16);
    document.getElementById('dataHoraReserva').value = local;

    document.getElementById('form-titulo').textContent = 'Editar Reserva';
    document.getElementById('campo-status').style.display = 'block';
    document.getElementById('status').value = r.status;
    mostrarAba('nova');
  } catch {
    alert('Erro ao carregar dados da reserva.');
  }
}

// ====== FORMULÁRIO ======
async function salvarReserva() {
  const id = document.getElementById('reserva-id').value;
  const msg = document.getElementById('form-msg');
  msg.style.display = 'none';

  const payload = {
    nomeCliente: document.getElementById('nomeCliente').value.trim(),
    contatoCliente: document.getElementById('contatoCliente').value.trim(),
    numeroMesa: Number(document.getElementById('numeroMesa').value),
    quantidadePessoas: Number(document.getElementById('quantidadePessoas').value),
    dataHoraReserva: document.getElementById('dataHoraReserva').value,
    duracaoMinutos: Number(document.getElementById('duracaoMinutos').value) || 90,
    observacoes: document.getElementById('observacoes').value.trim(),
    ...(id && { status: document.getElementById('status').value }),
  };

  if (!payload.nomeCliente || !payload.contatoCliente || !payload.numeroMesa ||
    !payload.quantidadePessoas || !payload.dataHoraReserva) {
    exibirMsg(msg, 'erro', 'Preencha todos os campos obrigatórios.');
    return;
  }

  try {
    const url = id ? `${API}/api/reservas/${id}` : `${API}/api/reservas`;
    const method = id ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    if (data.sucesso) {
      exibirMsg(msg, 'sucesso', data.mensagem);
      limparFormulario();
    } else {
      exibirMsg(msg, 'erro', data.mensagem);
    }
  } catch {
    exibirMsg(msg, 'erro', 'Erro de conexão com o servidor.');
  }
}

function limparFormulario() {
  ['reserva-id', 'nomeCliente', 'contatoCliente', 'numeroMesa',
    'quantidadePessoas', 'dataHoraReserva', 'observacoes'].forEach(id => {
      document.getElementById(id).value = '';
    });
  document.getElementById('duracaoMinutos').value = '90';
  document.getElementById('form-titulo').textContent = 'Nova Reserva';
  document.getElementById('form-msg').style.display = 'none';
  document.getElementById('campo-status').style.display = 'none';
  document.getElementById('status').value = 'reservado';
}

function exibirMsg(el, tipo, texto) {
  el.className = tipo;
  el.textContent = texto;
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 5000);
}

// ====== HELPERS ======
function formatarData(d) {
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
function formatarHora(d) {
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

carregarMapa();