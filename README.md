# 🍽 L'Alliance P&M — Sistema de Reservas de Mesa

> Sistema desenvolvido para a disciplina de **Desenvolvimento Web III**  
> Fatec — Faculdade de Tecnologia

---

## 👥 Equipe

| Nome | Papel |
|------|-------|
| Manuela Castro | Desenvolvedora |
| Pedro Claudino | Desenvolvedor |

**Professor:** Neymar Siqueira  
**Disciplina:** Desenvolvimento Web III  

---

## 📋 Sobre o projeto

O **L'Alliance P&M** é um sistema completo de gerenciamento de reservas de mesas para restaurantes. Permite registrar, visualizar, atualizar e cancelar reservas, verificar disponibilidade em tempo real e visualizar o status de cada mesa através de um mapa gráfico interativo.

---

## 🚀 Tecnologias

- **Runtime:** Node.js 18+
- **Linguagem:** TypeScript
- **Framework:** Express
- **Banco de dados:** MongoDB (Mongoose) — banco: `reserva`
- **Frontend:** HTML, CSS e JavaScript puro

---

## 🗂 Arquitetura e Estrutura

```
lalliance-pm/
├── src/
│   ├── models/
│   │   ├── Mesa.ts           # Schema da mesa (número, capacidade, localização)
│   │   ├── Reserva.ts        # Schema da reserva (cliente, horário, status)
│   │   └── Log.ts            # Schema de logs de operações
│   ├── controllers/
│   │   ├── mesaController.ts     # Listagem, busca e disponibilidade de mesas
│   │   └── reservaController.ts  # CRUD completo de reservas + regras de negócio
│   ├── routes/
│   │   ├── mesaRoutes.ts     # GET /api/mesas, POST /api/mesas, etc.
│   │   └── reservaRoutes.ts  # GET /api/reservas, POST, PUT, DELETE
│   ├── middleware/
│   │   └── logger.ts         # Registro de logs no MongoDB
│   ├── database.ts           # Conexão com o MongoDB via Mongoose
│   ├── seed.ts               # Script para popular as mesas iniciais
│   └── server.ts             # Entry point da aplicação
├── public/
│   ├── index.html            # Página principal (SPA)
│   ├── css/
│   │   └── style.css         # Estilos globais
│   └── js/
│       └── app.js            # Lógica do frontend (fetch, DOM, mapa)
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

---

## ⚙️ Instalação e Execução

### Pré-requisitos

- [Node.js 18+](https://nodejs.org/)
- [MongoDB](https://www.mongodb.com/try/download/community) rodando localmente na porta `27017`

---

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/lalliance-pm.git
cd lalliance-pm
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

```bash
cp .env.example .env
```

O arquivo `.env` padrão já funciona para ambiente local:

```env
MONGODB_URI=mongodb://localhost:27017/reserva
PORT=3000
```

### 4. Popule o banco com as mesas iniciais

```bash
npm run seed
```

Isso cadastra 12 mesas distribuídas entre salão, varanda e área interna.

### 5. Inicie o servidor

```bash
npm run dev
```

Acesse: **http://localhost:3000**

---

## 📡 Endpoints da API

### Mesas

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/mesas` | Lista todas as mesas com status atual |
| `GET` | `/api/mesas/:numero` | Busca mesa por número |
| `GET` | `/api/mesas/:numero/disponibilidade?dataHoraReserva=&duracaoMinutos=` | Verifica disponibilidade |
| `POST` | `/api/mesas` | Cria uma nova mesa |

### Reservas

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/reservas` | Lista reservas (filtros: `cliente`, `mesa`, `data`, `status`) |
| `GET` | `/api/reservas/:id` | Busca reserva por ID |
| `POST` | `/api/reservas` | Cria nova reserva |
| `PUT` | `/api/reservas/:id` | Atualiza reserva existente |
| `DELETE` | `/api/reservas/:id` | Cancela reserva |

---

## 📐 Modelo de Dados

### Reserva
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `nomeCliente` | String | Nome completo do cliente |
| `contatoCliente` | String | Telefone ou e-mail |
| `numeroMesa` | Number | Número da mesa reservada |
| `quantidadePessoas` | Number | Quantidade de pessoas |
| `dataHoraReserva` | Date | Data e hora de início |
| `duracaoMinutos` | Number | Duração (padrão: 90 min) |
| `dataHoraFim` | Date | Calculado automaticamente |
| `observacoes` | String | Opcional |
| `status` | Enum | `reservado`, `ocupado`, `finalizado`, `cancelado` |

### Mesa
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `numero` | Number | Identificador único da mesa |
| `capacidade` | Number | Máximo de pessoas |
| `localizacao` | Enum | `salão`, `varanda`, `área interna` |

---

## ✅ Regras de Negócio

- Não são permitidas duas reservas para a mesma mesa no mesmo horário
- Reservas devem ser feitas com no mínimo **1 hora de antecedência**
- Duração padrão de **1h30** por reserva (configurável)
- Status atualizado automaticamente conforme o horário:
  - `reservado` → agendada para o futuro
  - `ocupado` → dentro do horário atual
  - `finalizado` → horário encerrado
  - `cancelado` → removida pelo usuário
- A mesa deve comportar a quantidade de pessoas informada
- Todas as operações são registradas em log no MongoDB

---

## 🗺 Mapa Visual das Mesas

O frontend exibe um mapa interativo com os cards das mesas coloridos por status:

| Cor | Status |
|-----|--------|
| 🟢 Verde | Disponível |
| 🟡 Amarelo | Reservado |
| 🔴 Vermelho | Ocupado |

Ao clicar em uma mesa é possível ver os detalhes da reserva ativa ou iniciar uma nova reserva diretamente.

---

## 📜 Licença

Projeto acadêmico — Fatec, 2025.
