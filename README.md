# 🏋️‍♂️ IronTracker — Dashboard Rastreador de Cargas & Powerbuilding

<p align="center">
  <strong>Registre treinos em texto puro com Inteligência Artificial, automatize o cálculo de 1RM e visualize sua sobrecarga progressiva com precisão de elite.</strong>
</p>

<p align="center">
  <a href="#-sobre-o-projeto">Sobre</a> •
  <a href="#-funcionalidades-principais">Funcionalidades</a> •
  <a href="#-stack-tecnol%C3%B3gica">Stack Tecnológica</a> •
  <a href="#-arquitetura-e-estrutura">Arquitetura</a> •
  <a href="#-come%C3%A7ando-getting-started">Começando</a> •
  <a href="#-documenta%C3%A7%C3%A3o-da-api">API</a> •
  <a href="#-testes-e-qualidade">Testes</a> •
  <a href="#-roadmap">Roadmap</a> •
  <a href="#-autor-e-cr%C3%A9ditos">Autor</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.3-black?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Google_Gemini-2.5_Flash-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white" alt="Google Gemini" />
  <img src="https://img.shields.io/badge/Drizzle_ORM-0.45-C5F74F?style=for-the-badge&logo=drizzle&logoColor=black" alt="Drizzle ORM" />
  <img src="https://img.shields.io/badge/SQLite-better--sqlite3-003B57?style=for-the-badge&logo=sqlite&logoColor=white" alt="SQLite" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Vitest-Passing-6E9F18?style=for-the-badge&logo=vitest&logoColor=white" alt="Vitest" />
  <img src="https://img.shields.io/badge/Status-Em_Desenvolvimento_Ativo-brightgreen?style=for-the-badge" alt="Status" />
  <img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" alt="Licença" />
</p>

---

## 📌 Sobre o Projeto

Registrar treinos em aplicativos tradicionais de academia costuma ser um processo lento, burocrático e frustrante: dezenas de menus dropdowns, modais infinitos para cada série e formulários que interrompem o ritmo e o descanso do atleta durante a sessão.

O **IronTracker** resolve esse atrito radicalmente através de **compreensão de linguagem natural (NLP)** impulsionada pelo **Google Gemini**. O atleta simplesmente digita ou cola as anotações do treino em texto corrido exatamente como pensa ou anota no bloco de notas:

> *"Hoje fiz supino reto 1x3 com 140kg top set @9 e 3x6 com 115kg back-off, depois remada curvada 4x8 com 85kg"*

A inteligência artificial analisa a sintaxe, normaliza nomes de exercícios, desmembra repetições múltiplas, identifica tipo de série (*Warmup*, *Top Set*, *Working*, *Back-off*), detecta RPE/RIR e calcula automaticamente métricas fundamentais da ciência do treinamento: **1RM estimado (Fórmula de Epley)** e **Volume Load ($\sum \text{carga} \times \text{reps}$)**.

---

## ✨ Funcionalidades Principais

- 🧠 **Quick Logger com Parser IA (Google Gemini Flash):** Reconhece exercícios, séries, repetições, cargas totais ou "por lado" (com soma automática da barra de 20kg), notação RPE (`@8.5`) e RIR (`2 rir`).
- 🛡️ **Fluxo Seguro *Preview & Confirm*:** Apresenta um modal interativo com tabela editável dos dados extraídos para conferência e ajustes finos antes de persistir no banco de dados.
- 📈 **Painel de Sobrecarga Progressiva:**
  - Gráficos temporais dinâmicos (Recharts) com chaveamento de métricas: **1RM Estimado**, **Carga Máxima / Top Set** e **Volume Load**.
  - **Indicadores de Delta:** Comparativo automatizado entre a sessão atual e a penúltima do mesmo exercício (ex: `+2.5 kg no Top Set`, `+4.2% de 1RM`).
- 📊 **Monitoramento de Volume Semanal por Grupo Muscular:** Contagem de séries de trabalho por grupamento muscular (Peito, Costas, Quadríceps, Ombros, etc.) para garantir que você esteja dentro das faixas ótimas de hipertrofia (10–20 séries/semana).
- 📋 **Gerenciador de Divisões e Fichas de Treino (Split Manager):**
  - Presets consagrados prontos para uso: **Upper/Lower (4 dias)**, **Push/Pull/Legs (PPL - 3 dias)**, **PPL + Upper/Lower (5 dias)** e **Bro Split (5 dias)**.
  - Personalização de exercícios-alvo, metas de séries, faixas de repetições (min/max) e RPE alvo.
- 🗂️ **Histórico Cronológico e Linha do Tempo:** Visualização detalhada de sessões anteriores com cards expansíveis e exclusão segura em cascata.

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia | Finalidade no Projeto |
| :--- | :--- | :--- |
| **Framework Fullstack** | [Next.js 16](https://nextjs.org/) (App Router, React 19) | Server Components, rotas de API integradas e renderização de alta performance. |
| **Linguagem** | [TypeScript 5](https://www.typescriptlang.org/) | Tipagem estática fim a fim dos modelos de dados, contratos de API e componentes UI. |
| **Inteligência Artificial** | [Google Gemini 2.5 Flash](https://ai.google.dev/) via `@google/genai` | Extração estruturada de texto com esquema JSON rígido (`responseSchema`) e zero alucinação. |
| **Banco de Dados** | [SQLite](https://www.sqlite.org/) via [`better-sqlite3`](https://github.com/WiseLibs/better-sqlite3) | Armazenamento local rápido, autocontido, sem dependência de serviços externos. |
| **ORM & Migrations** | [Drizzle ORM](https://orm.drizzle.team/) + `drizzle-kit` | Consultas tipadas com overhead zero e migrações declarativas simples. |
| **Visualização de Dados** | [Recharts 3](https://recharts.org/) | Gráficos responsivos, interativos e acessíveis de linha e barras. |
| **Estilização** | [Tailwind CSS v4](https://tailwindcss.com/) + CSS Moderno | Design dark mode elegante de alta densidade visual (High-Performance Fitness UI). |
| **Ícones** | [Lucide React](https://lucide.dev/) | Iconografia consistente e semântica. |
| **Testes Automatizados** | [Vitest](https://vitest.dev/) | Suíte de testes unitários ultrarrápida para fórmulas científicas e presets de treino. |

---

## 🏗️ Arquitetura e Estrutura de Pastas

### Fluxo de Dados da Aplicação

```
[ Usuário digita texto livre ]
               │
               ▼
┌──────────────────────────────┐
│  QuickWorkoutLogger (React)  │
└──────────────┬───────────────┘
               │ POST /api/parse-workout
               ▼
┌──────────────────────────────┐       Prompt Especializado
│ Google Gemini 2.5 Flash SDK  │ ◄───► + responseSchema
└──────────────┬───────────────┘       (Estruturação Estrita)
               │ Retorna JSON estruturado
               ▼
┌──────────────────────────────┐
│    Preview & Confirm Modal   │ ◄─── Permite edição e conferência manual
└──────────────┬───────────────┘
               │ POST /api/workouts
               ▼
┌──────────────────────────────┐
│      Drizzle ORM Client      │ ───► SQLite (tracker.db)
└──────────────┬───────────────┘
               │ Queries Analíticas (1RM, Volume, Deltas)
               ▼
┌──────────────────────────────┐
│ Progressive Overload Charts  │ ───► Renderização via Recharts
└──────────────────────────────┘
```

### Estrutura de Diretórios

```
dashboard-rastreador-de-cargas/
├── docs/                             # Documentação técnica e especificações
│   └── superpowers/specs/            # Especificações de design de arquitetura e produto
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── api/                      # Endpoints HTTP da aplicação
│   │   │   ├── exercises/            # Listagem de catálogo de exercícios
│   │   │   ├── export/               # Exportação analítica (CSV com UTF-8 BOM e JSON completo)
│   │   │   ├── metrics/              # Agregações de 1RM, volume e sobrecarga
│   │   │   ├── parse-workout/        # Integração NLP com Google Gemini Flash
│   │   │   ├── routines/             # Gerenciamento de rotinas e splits
│   │   │   └── workouts/             # CRUD de sessões de treino
│   │   ├── globals.css               # Design tokens, tema escuro e resets
│   │   ├── layout.tsx                # Shell raiz da aplicação e metadados
│   │   ├── page.tsx                  # Server Component principal da página
│   │   └── DashboardClient.tsx       # Orquestrador de estado do cliente
│   ├── components/                   # Componentes modulares de interface
│   │   ├── Header.tsx                # Cabeçalho com métricas agregadas e estatísticas
│   │   ├── ExportDataModal.tsx       # Modal interativo de exportação e backup de dados
│   │   ├── QuickWorkoutLogger.tsx    # Entrada de texto livre com disparo para IA
│   │   ├── PreviewConfirmModal.tsx   # Modal de validação e edição antes do commit
│   │   ├── ProgressiveOverloadCharts.tsx # Gráficos de 1RM e evolução de cargas
│   │   ├── MuscleVolumeBarChart.tsx  # Gráfico de séries por grupamento muscular
│   │   ├── RoutineSplitManager.tsx   # Configuração e personalização de fichas
│   │   └── WorkoutHistoryFeed.tsx    # Histórico cronológico expansível de sessões
│   ├── db/                           # Camada de persistência de dados
│   │   ├── index.ts                  # Inicialização da conexão better-sqlite3
│   │   ├── schema.ts                 # Schemas relacionais do Drizzle ORM
│   │   └── seed.ts                   # Carga inicial com exercícios canônicos e fichas
│   └── lib/                          # Regras de negócio, serviços e utilitários
│       ├── export-service.ts         # Geração de CSV RFC 4180, backups JSON e queries
│       ├── formulas.ts               # Cálculo de 1RM (Epley), Volume Load e sanitização
│       ├── gemini-parser.ts          # Configuração da LLM e schema de saída
│       ├── preset-routines.ts        # Modelos de divisões (Upper/Lower, PPL, Bro Split)
│       └── workout-service.ts        # Lógica de inserção e montagem relacional
├── tests/                            # Testes unitários com Vitest
│   ├── export.test.ts                # Validação de escaping CSV, BOM e integridade de export
│   ├── formulas.test.ts              # Validação das fórmulas de 1RM e Volume Load
│   └── routines.test.ts              # Validação de presets e divisões de treino
├── drizzle.config.ts                 # Configurações do Drizzle Kit
├── vitest.config.ts                  # Configurações de teste do Vitest
└── package.json
```

---

## 🚀 Começando (Getting Started)

### Pré-requisitos

- **Node.js:** Versão 18.18+ ou 20+ instalada ([nodejs.org](https://nodejs.org/)).
- **npm** ou gerenciador de pacotes equivalente (`pnpm`, `yarn`).
- **Google Gemini API Key:** Chave de API gratuita obtida no [Google AI Studio](https://aistudio.google.com/).

### Passo a Passo de Instalação

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/ViktorGabriel/dashboard-rastreador-de-cargas.git
   cd dashboard-rastreador-de-cargas
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Configure as Variáveis de Ambiente:**
   Copie o arquivo `.env.example` para `.env`:
   ```bash
   cp .env.example .env
   ```
   Abra o arquivo `.env` e configure sua chave do Google Gemini:
   ```env
   # Chave de API do Google Gemini (obrigatória para o parser de IA)
   GEMINI_API_KEY="AIzaSyYourGeminiApiKeyHere"

   # Caminho do banco SQLite local
   DATABASE_URL="tracker.db"
   ```

4. **Prepare o Banco de Dados (Migração e Seed):**
   Execute o push das tabelas para o SQLite local e popule o catálogo canônico de exercícios:
   ```bash
   npm run db:push
   npm run db:seed
   ```

5. **Inicie o Servidor de Desenvolvimento:**
   ```bash
   npm run dev
   ```

Acesse [http://localhost:3000](http://localhost:3000) no seu navegador para utilizar o dashboard.

---

## 📡 Documentação da API

A aplicação disponibiliza endpoints RESTful integrados pelo App Router do Next.js:

| Método | Rota | Descrição |
| :--- | :--- | :--- |
| `POST` | `/api/parse-workout` | Processa o texto livre usando IA e retorna o treino estruturado. |
| `GET` | `/api/workouts` | Lista todas as sessões de treino com exercícios e séries. |
| `POST` | `/api/workouts` | Salva uma sessão de treino confirmada no banco de dados. |
| `DELETE` | `/api/workouts?id=:id` | Remove uma sessão de treino e seus registros relacionados. |
| `GET` | `/api/exercises` | Retorna o catálogo canônico de exercícios cadastrados. |
| `GET` | `/api/metrics` | Retorna KPIs globais, métricas de sobrecarga e volume muscular. |
| `GET` | `/api/routines` | Retorna a divisão de treino ativa e fichas configuradas. |
| `POST` | `/api/routines` | Aplica presets (`UPPER_LOWER`, `PPL`, etc.) ou cria rotinas. |

### Exemplos de Requisição e Resposta

#### 1. Parser com IA (`POST /api/parse-workout`)

**Request:**
```json
{
  "text": "Hoje fiz supino reto 1x3 com 140kg top set @9 e 3x6 com 115kg back-off"
}
```

**Response (200 OK):**
```json
{
  "is_workout": true,
  "title": "Treino Peito / Força",
  "date": "2026-09-25",
  "feedback_message": "Treino identificado com sucesso!",
  "exercises": [
    {
      "name": "Supino Reto com Barra",
      "target_muscle_group": "Peito",
      "category": "COMPOUND",
      "sets": [
        {
          "set_number": 1,
          "set_type": "TOP_SET",
          "weight_kg": 140,
          "reps": 3,
          "rpe": 9
        },
        {
          "set_number": 2,
          "set_type": "BACKOFF",
          "weight_kg": 115,
          "reps": 6
        },
        {
          "set_number": 3,
          "set_type": "BACKOFF",
          "weight_kg": 115,
          "reps": 6
        },
        {
          "set_number": 4,
          "set_type": "BACKOFF",
          "weight_kg": 115,
          "reps": 6
        }
      ]
    }
  ]
}
```

#### 2. Consulta de Sobrecarga Progressiva (`GET /api/metrics?exerciseId=1`)

**Response (200 OK):**
```json
{
  "exercise": {
    "id": 1,
    "name": "Supino Reto com Barra",
    "targetMuscleGroup": "Peito",
    "category": "COMPOUND"
  },
  "history": [
    {
      "date": "2026-09-18",
      "title": "Push A",
      "max_weight": 137.5,
      "top_set_weight": 137.5,
      "best_1rm": 151.3,
      "total_volume": 2480,
      "sets_count": 4,
      "best_rpe": 9
    },
    {
      "date": "2026-09-25",
      "title": "Push A",
      "max_weight": 140.0,
      "top_set_weight": 140.0,
      "best_1rm": 154.0,
      "total_volume": 2490,
      "sets_count": 4,
      "best_rpe": 9
    }
  ],
  "overloadDelta": {
    "diff_weight_kg": 2.5,
    "diff_1rm_kg": 2.7,
    "diff_volume_kg": 10,
    "is_progress": true
  }
}
```

---

## 🧮 Fórmulas Científicas Implementadas

### 1. Estimativa de 1RM (Fórmula de Epley)
Para repetições maiores que 1, a carga máxima teórica estimada é calculada por:

$$\text{1RM} = \text{Carga} \times \left(1 + \frac{\text{Reps}}{30}\right)$$

*Nota:* Para $1\text{ repetição}$, o valor de $1\text{RM}$ é exatamente a carga realizada.

### 2. Volume Load (Tonagem)
Representa o estresse mecânico acumulado por série e sessão de treino:

$$\text{Volume Load} = \text{Carga (kg)} \times \text{Repetições}$$

### 3. Normalização Inteligente de Barra
Quando o usuário relata carga como *"40kg de cada lado no supino"*, o parser infere a inclusão padrão de **20 kg da barra olímpica**:

$$\text{Carga Total} = (40 \times 2) + 20 = 100\text{ kg}$$

---

## 🧪 Testes e Qualidade

O projeto utiliza **Vitest** para assegurar a corretude matemática das fórmulas e integridade das rotinas de treino:

```bash
# Executa todos os testes unitários
npm test

# Executa testes em modo watch (desenvolvimento contínuo)
npx vitest

# Executa verificação estática de tipos e lint
npm run lint
```

---

## 📦 Scripts Disponíveis no `package.json`

| Comando | Descrição |
| :--- | :--- |
| `npm run dev` | Inicia o servidor local Next.js em modo de desenvolvimento (`http://localhost:3000`). |
| `npm run build` | Compila o projeto com otimização de produção para deploy. |
| `npm run start` | Inicializa o servidor compilado de produção. |
| `npm test` | Executa a suíte de testes unitários com Vitest. |
| `npm run lint` | Executa o ESLint para verificar padrões e qualidade de código. |
| `npm run db:push` | Aplica o schema do Drizzle ORM diretamente ao banco SQLite. |
| `npm run db:seed` | Popula o banco com exercícios canônicos e divisões prévias. |

---

## 🗺️ Roadmap de Evolução

- [x] Extração semântica de treinos em linguagem natural via Gemini Flash.
- [x] Modal de conferência interativo (*Preview & Confirm*) antes de gravar no banco.
- [x] Cálculo automático de 1RM estimado (Epley) e Volume Load.
- [x] Gráficos de sobrecarga progressiva e delta comparativo entre sessões.
- [x] Gráfico semanal de volume por grupo muscular para hipertrofia.
- [x] Gerenciador de divisões clássicas (Upper/Lower, PPL, Bro Split).
- [x] Exportação completa de dados nos formatos CSV e JSON.
- [ ] Suporte a PWA com funcionamento offline e sincronização em background.
- [ ] Cronômetro de descanso integrado com alertas sonoros personalizáveis.
- [ ] Gráfico de fadiga acumulada e correlação RPE vs RIR por bloco de periodização.

---

## 👤 Autor e Créditos

Desenvolvido com foco em engenharia de ponta por **Viktor Gabriel**.

- **GitHub:** [@ViktorGabriel](https://github.com/ViktorGabriel)
- **Repositório do Projeto:** [ViktorGabriel/dashboard-rastreador-de-cargas](https://github.com/ViktorGabriel/dashboard-rastreador-de-cargas)

---

## 📄 Licença

Este projeto está sob a licença [MIT](LICENSE). Sinta-se livre para usar, estudar e contribuir.
