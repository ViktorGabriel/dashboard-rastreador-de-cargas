# 🏋️‍♂️ IronTracker — Dashboard Rastreador de Cargas & Powerbuilding

<p align="center">
  <strong>Registre treinos em texto puro com Inteligência Artificial, automatize o cálculo de 1RM, gerencie fadiga acumulada e acompanhe sua sobrecarga progressiva com precisão de elite.</strong>
</p>

<p align="center">
  <a href="#-sobre-o-projeto">Sobre</a> •
  <a href="#-funcionalidades-principais">Funcionalidades</a> •
  <a href="#-stack-tecnol%C3%B3gica">Stack Tecnológica</a> •
  <a href="#-arquitetura-e-estrutura">Arquitetura</a> •
  <a href="#-come%C3%A7ando-getting-started">Começando</a> •
  <a href="#-documenta%C3%A7%C3%A3o-da-api">API</a> •
  <a href="#-f%C3%B3rmulas-cient%C3%ADficas-implementadas">Fórmulas Científicas</a> •
  <a href="#-testes-e-qualidade">Testes</a> •
  <a href="#-roadmap-de-evolu%C3%A7%C3%A3o">Roadmap</a> •
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
  <img src="https://img.shields.io/badge/Vitest-21_Passed-6E9F18?style=for-the-badge&logo=vitest&logoColor=white" alt="Vitest" />
  <img src="https://img.shields.io/badge/PWA-Ready-orange?style=for-the-badge&logo=pwa&logoColor=white" alt="PWA Ready" />
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
- ⚡ **Gráfico de Fadiga Acumulada e Correlação RPE vs RIR:**
  - **Índice de Fadiga Semanal (0 a 100):** Cálculo ponderado de estresse sistêmico considerando tonagem total e intensidade média (RPE) por bloco de periodização (semanas ISO).
  - **Dispersão RPE vs RIR:** Matriz de coerência de esforço percebido vs repetições em reserva com linha ideal de referência ($RPE + RIR = 10$) e taxa percentual de consistência do atleta.
  - **Zonas de Carga:** Identificação visual de Deload (<30), Ótima (30–65), Alta (65–85) e Overreaching (>85).
- ⏱️ **Cronômetro de Descanso Integrado (Rest Timer):**
  - **Floating Action Button (FAB):** Widget flutuante com anel de progresso circular SVG em tempo real e visualização expansível/colapsável.
  - **Web Audio API:** Síntese de áudio de alta precisão sem dependência de arquivos externos mp3, com alertas personalizáveis: *Chime*, *Sino*, *Beep*, *Buzz* e *Silencioso*, além de controle fino de volume.
  - **Presets Rápidos & Ajustes:** Botões para 45s, 60s, 90s, 2m, 3m, 5m e botões de incremento/decremento de $\pm 15\text{s}$.
  - **Auto-Start Inteligente:** Acionamento automático configurável imediatamente após o atleta salvar e confirmar uma sessão de treino.
  - **Persistência Local:** Memorização de configurações, volume e tempo restante mesmo ao recarregar a página.
- 📱 **PWA Mobile-First & Funcionamento Offline:**
  - Instalável como aplicativo nativo no celular (iOS / Android) e no desktop através de Web App Manifest moderno (`display: standalone`).
  - **Service Worker com Cache Offline:** Pre-caching inteligente do App Shell, visualização offline de exercícios, rotinas e histórico prévio.
  - **Background Sync Automático:** Fila de sincronização local (`localStorage`) que grava treinos offline e sincroniza automaticamente com o servidor assim que a conexão de rede é restabelecida.
  - **Modal de Entrada Manual Offline:** Interface rápida de contingência para registro direto de treinos mesmo sem acesso à IA em áreas sem sinal da academia.
  - **Mobile Bottom Navigation:** Barra de navegação inferior tátil otimizada para o polegar no celular, com acesso rápido a Treino, Gráficos, Divisões, Descanso e Status Offline.
- 📋 **Gerenciador de Divisões e Fichas de Treino (Split Manager):**
  - Presets consagrados prontos para uso: **Upper/Lower (4 dias)**, **Push/Pull/Legs (PPL - 3 dias)**, **PPL + Upper/Lower (5 dias)** e **Bro Split (5 dias)**.
  - Personalização de exercícios-alvo, metas de séries, faixas de repetições (min/max) e RPE alvo.
- 🗂️ **Histórico Cronológico e Linha do Tempo:** Visualização detalhada de sessões anteriores com cards expansíveis e exclusão segura em cascata.
- 💾 **Exportação e Backup Analítico:** Download dos dados completos em formato CSV tabular (com UTF-8 BOM para Excel) e backup JSON estruturado.

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia | Finalidade no Projeto |
| :--- | :--- | :--- |
| **Framework Fullstack** | [Next.js 16](https://nextjs.org/) (App Router, React 19) | Server Components, rotas de API integradas e renderização de alta performance. |
| **Linguagem** | [TypeScript 5](https://www.typescriptlang.org/) | Tipagem estática fim a fim dos modelos de dados, contratos de API e componentes UI. |
| **Inteligência Artificial** | [Google Gemini 2.5 Flash](https://ai.google.dev/) via `@google/genai` | Extração estruturada de texto com esquema JSON rígido (`responseSchema`) e zero alucinação. |
| **Banco de Dados** | [SQLite](https://www.sqlite.org/) via [`better-sqlite3`](https://github.com/WiseLibs/better-sqlite3) | Armazenamento local rápido, autocontido, sem dependência de serviços externos. |
| **ORM & Migrations** | [Drizzle ORM](https://orm.drizzle.team/) + `drizzle-kit` | Consultas tipadas com overhead zero e migrações declarativas simples. |
| **Visualização de Dados** | [Recharts 3](https://recharts.org/) | Gráficos responsivos de linha, barras empilhadas e dispersão (Scatter). |
| **Estilização** | [Tailwind CSS v4](https://tailwindcss.com/) + CSS Moderno | Design dark mode elegante de alta densidade visual (High-Performance Fitness UI). |
| **Áudio & Som** | [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) | Síntese de frequências acústicas no navegador para alarmes sonoros customizáveis. |
| **PWA & Offline** | Service Worker + Web App Manifest | Execução offline, cache local e Background Sync para treinos na academia. |
| **Ícones** | [Lucide React](https://lucide.dev/) | Iconografia consistente e semântica. |
| **Testes Automatizados** | [Vitest](https://vitest.dev/) | Suíte de testes unitários ultrarrápida para fórmulas científicas, exportações e sincronização offline. |

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
               │ Queries Analíticas (1RM, Volume, Fadiga, Deltas)
               ▼
┌──────────────────────────────┐       Dispara evento DOM
│ Progressive Overload Charts  │ ───►  'auto-start-rest-timer'
│ Fatigue & RPE/RIR Charts     │                 │
└──────────────────────────────┘                 ▼
                                       ┌───────────────────┐
                                       │ RestTimer (Audio) │
                                       └───────────────────┘
```

### Estrutura de Diretórios

```
dashboard-rastreador-de-cargas/
├── docs/                             # Documentação técnica e especificações
│   └── superpowers/specs/            # Especificações de design de arquitetura e produto
├── public/                           # Ativos estáticos e Service Worker
│   ├── icon-192.png                  # Ícone PWA para telas padrão
│   ├── icon-512.png                  # Ícone PWA de alta resolução
│   └── sw.js                         # Service Worker de cache e estratégias offline
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── api/                      # Endpoints HTTP da aplicação
│   │   │   ├── exercises/            # Listagem de catálogo de exercícios
│   │   │   ├── export/               # Exportação analítica (CSV com UTF-8 BOM e JSON completo)
│   │   │   ├── metrics/              # Agregações de 1RM, volume e telemetria de fadiga/RPE
│   │   │   ├── parse-workout/        # Integração NLP com Google Gemini Flash
│   │   │   ├── routines/             # Gerenciamento de rotinas e splits
│   │   │   └── workouts/             # CRUD de sessões de treino
│   │   ├── globals.css               # Design tokens, tema escuro e resets
│   │   ├── layout.tsx                # Shell raiz da aplicação e metadados
│   │   ├── manifest.ts               # Geração dinâmica do manifesto PWA
│   │   ├── page.tsx                  # Server Component principal da página
│   │   └── DashboardClient.tsx       # Orquestrador de estado do cliente
│   ├── components/                   # Componentes modulares de interface
│   │   ├── Header.tsx                # Cabeçalho com métricas agregadas e estatísticas
│   │   ├── ExportDataModal.tsx       # Modal interativo de exportação e backup de dados
│   │   ├── FatigueRPEChart.tsx       # Gráfico de fadiga acumulada e correlação RPE vs RIR
│   │   ├── ManualOfflineWorkoutModal.tsx # Registro manual de treinos em contingência offline
│   │   ├── MobileBottomNav.tsx       # Barra de navegação inferior tátil mobile
│   │   ├── MuscleVolumeBarChart.tsx  # Gráfico de séries por grupamento muscular
│   │   ├── OfflineSyncModal.tsx      # Modal de gerenciamento da fila de sincronização offline
│   │   ├── PreviewConfirmModal.tsx   # Modal de validação e edição antes do commit
│   │   ├── ProgressiveOverloadCharts.tsx # Gráficos de 1RM e evolução de cargas
│   │   ├── QuickWorkoutLogger.tsx    # Entrada de texto livre com disparo para IA
│   │   ├── RestTimer.tsx             # Cronômetro flutuante de descanso com Web Audio API
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
│       ├── offline-sync.ts           # Gerenciamento de fila offline e sincronização em background
│       ├── preset-routines.ts        # Modelos de divisões (Upper/Lower, PPL, Bro Split)
│       ├── use-pwa.ts                # Hook de controle de Service Worker, status online e instalação
│       ├── use-rest-timer.ts         # Hook de cronômetro e sintetizador de Web Audio API
│       └── workout-service.ts        # Lógica de inserção e montagem relacional
├── tests/                            # Testes unitários com Vitest
│   ├── export.test.ts                # Validação de escaping CSV, BOM e integridade de export
│   ├── formulas.test.ts              # Validação das fórmulas de 1RM e Volume Load
│   ├── offline-sync.test.ts          # Validação da fila e sincronização offline
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
| `GET` | `/api/metrics?exerciseId=:id` | Retorna histórico analítico de 1RM e delta do exercício. |
| `GET` | `/api/metrics?summary=fatigue` | Retorna índice de fadiga acumulada e correlação RPE vs RIR por bloco semanal. |
| `GET` | `/api/routines` | Retorna a divisão de treino ativa e fichas configuradas. |
| `POST` | `/api/routines` | Aplica presets (`UPPER_LOWER`, `PPL`, etc.) ou customiza rotinas. |
| `GET` | `/api/export?format=csv` | Gera arquivo CSV estruturado com séries e tonagens. |
| `GET` | `/api/export?format=json` | Gera backup JSON integral do banco de dados. |

### Exemplos de Requisição e Resposta

#### 1. Telemetria de Fadiga e Esforço Subjetivo (`GET /api/metrics?summary=fatigue`)

**Response (200 OK):**
```json
{
  "weeklyFatigue": [
    {
      "weekLabel": "Semana 38",
      "weekStart": "2026-09-14",
      "totalVolume": 13400,
      "avgRpe": 8.5,
      "avgRir": 1.5,
      "workingSetsCount": 21,
      "sessionsCount": 4,
      "fatigueScore": 68.4,
      "zone": "HIGH"
    },
    {
      "weekLabel": "Semana 39",
      "weekStart": "2026-09-21",
      "totalVolume": 17700,
      "avgRpe": 8.7,
      "avgRir": 1.3,
      "workingSetsCount": 29,
      "sessionsCount": 5,
      "fatigueScore": 82.1,
      "zone": "HIGH"
    }
  ],
  "rpeRirScatter": [
    {
      "rpe": 9.0,
      "rir": 1.0,
      "weight": 190,
      "exerciseName": "Levantamento Terra Convencional",
      "date": "2026-09-24",
      "count": 1
    }
  ],
  "coherenceRate": 92.5,
  "summary": {
    "currentFatigueScore": 82.1,
    "currentZone": "HIGH",
    "avgWeeklyVolume": 15550,
    "avgRpe": 8.6,
    "avgRir": 1.4
  }
}
```

---

## 🧮 Fórmulas Científicas Implementadas

### 1. Estimativa de 1RM (Fórmula de Epley)
Para repetições maiores que 1, a carga máxima teórica estimada é calculada por:

$$\text{1RM} = \text{Carga} \times \left(1 + \frac{\text{Reps}}{30}\right)$$

*Nota:* Para $1\text{ repetição}$, o valor de $1\text{RM}$ é exatamente a carga realizada.

### 2. Volume Load (Tonagem Acumulada)
Representa o estresse mecânico acumulado por série e sessão de treino:

$$\text{Volume Load} = \text{Carga (kg)} \times \text{Repetições}$$

### 3. Índice de Fadiga Acumulada (0 a 100)
Métrica composta que combina a tonagem normalizada semanal e a intensidade percebida (RPE) nas séries válidas:

$$\text{Fadiga} = \min\left(100, \left(\frac{\text{Volume Semanal}}{\text{Volume de Referência}} \times 50\right) + \left(\frac{\text{RPE Médio}}{10} \times 50\right)\right)$$

### 4. Coerência RPE vs RIR
Avalia a precisão na autorregulação do atleta com base na equação de Borg / Helms:

$$\text{Coerência Ideal:} \quad \text{RPE} + \text{RIR} = 10 \quad (\pm 0.5)$$

### 5. Normalização Inteligente de Barra
Quando o usuário relata carga como *"40kg de cada lado no supino"*, o parser infere a inclusão padrão de **20 kg da barra olímpica**:

$$\text{Carga Total} = (40 \times 2) + 20 = 100\text{ kg}$$

---

## 🧪 Testes e Qualidade

O projeto conta com suíte de testes unitários com **Vitest** cobrindo integridade matemática, regras de negócio e estratégias offline:

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
- [x] Suporte a PWA com funcionamento offline e sincronização em background.
- [x] Cronômetro de descanso integrado com alertas sonoros personalizáveis (Web Audio API).
- [x] Gráfico de fadiga acumulada e correlação RPE vs RIR por bloco de periodização.

---

## 👤 Autor e Créditos

Desenvolvido com foco em engenharia de ponta por **Viktor Gabriel**.

- **GitHub:** [@ViktorGabriel](https://github.com/ViktorGabriel)
- **Repositório do Projeto:** [ViktorGabriel/dashboard-rastreador-de-cargas](https://github.com/ViktorGabriel/dashboard-rastreador-de-cargas)

---

## 📄 Licença

Este projeto está sob a licença [MIT](LICENSE). Sinta-se livre para usar, estudar e contribuir.
