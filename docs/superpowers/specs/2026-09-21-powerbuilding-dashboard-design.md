# Especificação de Design: Dashboard de Powerbuilding com Parser IA de Texto Livre

**Data:** 2026-09-21  
**Status:** Validado com o usuário  
**Autor:** Antigravity AI  

---

## 1. Visão Geral e Objetivos

O objetivo deste projeto é construir uma aplicação web (Dashboard / Micro-SaaS MVP) voltada para atletas de **Powerbuilding e Hipertrofia**, eliminando o atrito do preenchimento manual de formulários complexos durante o registro de treinos.

Em vez de selecionar exercícios em selects intermináveis e preencher inputs de repetições e séries um a um, o usuário digita ou cola um texto em linguagem natural livre (exemplo: *"hoje fiz supino reto 1x3 com 140kg top set @9 e 3x6 com 115kg back-off, depois remada curvada 4x8 com 80kg"*). Uma inteligência artificial (Google Gemini Flash) realiza a extração semântica estruturada e exibe uma prévia visual para conferência rápida (*Preview & Confirm*). Após confirmação, os dados são persistidos em um banco de dados SQLite local, alimentando gráficos analíticos de sobrecarga progressiva (1RM estimado, volume acumulado e cargas máximas).

---

## 2. Arquitetura do Sistema

A solução adota uma arquitetura fullstack unificada em TypeScript:

```
┌────────────────────────────────────────────────────────┐
│                   Next.js App Router                   │
│                                                        │
│  ┌───────────────────────┐   ┌──────────────────────┐  │
│  │   Frontend (React)    │   │  API Routes (Server) │  │
│  │  - Quick Logger       │   │  - /api/parse-workout│  │
│  │  - Preview Card       │──>│  - /api/workouts     │  │
│  │  - Overload Charts    │   │  - /api/exercises    │  │
│  │  - History Feed       │   │  - /api/metrics      │  │
│  └───────────────────────┘   └──────────┬───────────┘  │
└─────────────────────────────────────────┼──────────────┘
                                          │
                  ┌───────────────────────┴──────────────────────┐
                  ▼                                              ▼
       ┌─────────────────────┐                       ┌──────────────────────┐
       │ Google Gemini Flash │                       │      SQLite DB       │
       │  (Structured JSON)  │                       │   (via Drizzle ORM)  │
       └─────────────────────┘                       └──────────────────────┘
```

- **Framework:** Next.js (TypeScript, React 19, App Router).
- **Estilização:** Vanilla CSS / CSS Modules com tokens de design system escuro (Dark High-Performance Theme) com tipografia moderna (Inter / Outfit) e micro-interações fluidas.
- **Camada de IA:** Google Gemini Flash (`gemini-2.5-flash` ou `gemini-1.5-flash`) utilizando a SDK oficial com `responseSchema` estrito (JSON estruturado e determinístico).
- **Camada de Dados & ORM:** SQLite (`better-sqlite3`) gerenciado pelo **Drizzle ORM** para tipagem ponta a ponta sem overhead binário.
- **Visualização de Dados:** Gráficos responsivos com biblioteca especializada (Recharts ou Chart.js) para renderização de curvas de 1RM, volume load e séries por grupo muscular.

---

## 3. Modelo de Dados (Schema Drizzle / SQLite)

### 3.1. Tabela `exercises`
Armazena o catálogo canônico de exercícios para evitar fragmentação de histórico.
- `id`: `INTEGER PRIMARY KEY AUTOINCREMENT`
- `name`: `TEXT NOT NULL UNIQUE` (ex: `"Supino Reto com Barra"`)
- `canonical_name`: `TEXT NOT NULL` (nome sanitizado para matching sem acentos e minúsculo)
- `target_muscle_group`: `TEXT NOT NULL` (ex: `"Peito"`, `"Costas"`, `"Quadríceps"`, `"Posterior"`, `"Ombros"`, `"Bíceps"`, `"Tríceps"`)
- `category`: `TEXT NOT NULL` (`"COMPOUND"` para básicos multiarticulares ou `"ISOLATION"` para isoladores)
- `created_at`: `INTEGER DEFAULT (unixepoch())`

### 3.2. Tabela `workouts`
Representa uma sessão de treino concluída.
- `id`: `INTEGER PRIMARY KEY AUTOINCREMENT`
- `date`: `TEXT NOT NULL` (formato ISO `YYYY-MM-DD`)
- `title`: `TEXT` (ex: `"Treino Push A - Foco Força"`)
- `raw_input_text`: `TEXT NOT NULL` (texto original digitado pelo usuário para rastreabilidade e auditoria)
- `notes`: `TEXT` (observações gerais da sessão)
- `created_at`: `INTEGER DEFAULT (unixepoch())`

### 3.3. Tabela `workout_exercises`
Associa os exercícios executados à sessão específica de treino com ordenação.
- `id`: `INTEGER PRIMARY KEY AUTOINCREMENT`
- `workout_id`: `INTEGER NOT NULL REFERENCES workouts(id) ON DELETE CASCADE`
- `exercise_id`: `INTEGER NOT NULL REFERENCES exercises(id)`
- `order_index`: `INTEGER NOT NULL` (ordem cronológica no treino: 1, 2, 3...)
- `notes`: `TEXT` (notas técnicas específicas do exercício)

### 3.4. Tabela `exercise_sets`
Registra cada série realizada com suas métricas analíticas calculadas.
- `id`: `INTEGER PRIMARY KEY AUTOINCREMENT`
- `workout_exercise_id`: `INTEGER NOT NULL REFERENCES workout_exercises(id) ON DELETE CASCADE`
- `set_number`: `INTEGER NOT NULL`
- `set_type`: `TEXT NOT NULL` (Enum: `"WARMUP"`, `"TOP_SET"`, `"WORKING"`, `"BACKOFF"`)
- `weight_kg`: `REAL NOT NULL` (carga total erguida)
- `reps`: `INTEGER NOT NULL` (repetições)
- `rpe`: `REAL` (Rating of Perceived Exertion, ex: 8.0, 9.5; nulo se omitido)
- `rir`: `INTEGER` (Reps in Reserve; nulo se omitido)
- `rest_seconds`: `INTEGER` (descanso em segundos; nulo se omitido)
- `estimated_1rm`: `REAL NOT NULL` (calculado via fórmula de Epley: `weight * (1 + reps / 30)`)
- `volume_load`: `REAL NOT NULL` (calculado: `weight * reps`)

---

## 4. Pipeline de IA e Regras de Extração

### 4.1. Endpoint `/api/parse-workout`
- **Entrada:** `{ "text": string }`
- **Processamento:**
  - O texto é enviado ao Gemini com um prompt especializado em Powerbuilding e terminologia brasileira de musculação.
  - A saída é forçada via `responseSchema` no seguinte formato JSON:
    ```typescript
    interface ParsedWorkoutResult {
      is_workout: boolean;
      feedback_message?: string;
      date?: string; // YYYY-MM-DD
      title?: string;
      exercises: Array<{
        name: string;
        target_muscle_group: string;
        category: "COMPOUND" | "ISOLATION";
        notes?: string;
        sets: Array<{
          set_number: number;
          set_type: "WARMUP" | "TOP_SET" | "WORKING" | "BACKOFF";
          weight_kg: number;
          reps: number;
          rpe?: number;
          rir?: number;
          rest_seconds?: number;
          notes?: string;
        }>;
      }>;
    }
    ```
- **Normalização de Cargas e Sinônimos:**
  - "X cada lado" em exercícios de barra: convertido para carga total (`X * 2 + peso da barra`).
  - Mapeamento inteligente de sinônimos: "supino", "supino reto barra", "bench press" são associados ao mesmo registro canônico.
  - Expansão de repetições múltiplas: "4x8 com 90kg" é desdobrado em 4 séries individuais de 8 reps com 90kg.
  - Classificação de Top Set vs Back-off: identifica séries de pico (alta carga, poucas repetições) e séries subsequentes de sustentação.

---

## 5. Experiência do Usuário (UX) & Telas

1. **Header & Status Bar:**
   - Identidade visual do app, estatísticas rápidas do mês (Total de treinos no mês, volume total acumulado).
2. **Quick Workout Logger (Hero Section):**
   - Textarea com visual expansivo, atalhos de sugestão rápida e botão "Analisar Treino com IA".
   - Loader responsivo com micro-animação durante a análise.
3. **Card de Prévia (Preview & Confirm Modal/Accordion):**
   - Apresenta o resultado do parse com badges destacadas (`[Peito]`, `[Top Set]`, `[Back-off]`).
   - Permite que o usuário ajuste qualquer número pontual ou adicione/remova séries antes de confirmar.
   - Botão de ação direta: "Confirmar e Salvar no Banco".
4. **Painel de Sobrecarga Progressiva (Progressive Overload Dashboard):**
   - **Seletor de Exercício:** Dropdown com busca para filtrar qualquer exercício.
   - **Gráfico de Evolução:** Curva temporal de Carga Máxima, 1RM Estimado e Volume Load.
   - **Cards de Indicadores de Sobrecarga:** Compara a sessão atual com a anterior do mesmo exercício (ex: *"+2.5kg no Top Set"*, *"+4% de 1RM"*).
5. **Volume Semanal por Grupo Muscular:**
   - Gráfico de barras indicando séries válidas na semana por grupo muscular (Peito, Costas, Pernas, etc.) para controle de hipertrofia.
6. **Histórico Cronológico:**
   - Timeline dos últimos treinos com detalhamento expansível de cada sessão e opções de edição/exclusão.

---

## 6. Tratamento de Erros e Casos de Borda

1. **Texto Inválido / Sem Treino:**
   - Se o usuário digitar algo não relacionado a treino, o retorno `is_workout: false` exibe uma mensagem amigável sem quebrar o estado.
2. **Queda de Conexão ou Erro de API:**
   - Mensagem de erro contextual com botão de "Tentar Novamente" mantendo o texto digitado intacto.
3. **Validação de Payload:**
   - Validação com Zod no backend antes de qualquer inserção no SQLite.
4. **Resiliência a Nulos:**
   - Valores opcionais (RPE, descanso, notas) são tratados graciosamente na interface sem exibir `NaN` ou `undefined`.

---

## 7. Estratégia de Verificação e Testes

- **Testes Unitários:**
  - Validação de cálculos matemáticos: fórmula de Epley para 1RM e Volume Load.
  - Normalização de sinônimos de exercícios.
  - Validação de schemas Zod contra payloads válidos e inválidos.
- **Testes de Integração com SQLite:**
  - Migrações Drizzle, inserção em lote de sessões com exercícios e séries, e queries de agregação analítica.
- **Validação E2E no Navegador:**
  - Fluxo ponta a ponta: digitar treino em linguagem natural -> disparar IA -> inspecionar card de confirmação -> salvar treino -> validar persistência e atualização dinâmica dos gráficos de sobrecarga.
