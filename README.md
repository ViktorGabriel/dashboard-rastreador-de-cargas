# 🏋️‍♂️ Dashboard Rastreador de Cargas & Powerbuilding

Um micro-SaaS e dashboard web focado em **Powerbuilding e Hipertrofia**, onde você não perde tempo preenchendo formulários complexos: basta digitar o texto puro do seu treino (ex: *"hoje fiz supino reto 1x3 com 140kg top set @9 e 3x6 com 115kg back-off"*) e a **Inteligência Artificial (Google Gemini)** faz o parse estruturado automático, salvando no banco com gráficos analíticos de sobrecarga progressiva (1RM estimado, volume acumulado e histórico de cargas).

---

## 🚀 Funcionalidades Principais

- **Entrada em Linguagem Natural:** Digite ou cole o treino em texto livre — a IA identifica exercícios, séries, repetições, cargas, RPE/RIR, aquecimentos, top sets e back-offs.
- **Fluxo Preview & Confirm:** Conferência visual rápida dos dados extraídos pela IA antes de salvar no banco de dados.
- **Gráficos de Sobrecarga Progressiva:**
  - Evolução de 1RM estimado (Fórmula de Epley/Brzycki).
  - Carga máxima e Top Set por sessão.
  - Volume Load total ($\sum \text{carga} \times \text{reps}$).
- **Monitoramento de Volume por Grupo Muscular:** Visualização de séries semanais para hipertrofia.
- **Histórico e Linha do Tempo:** Consulta cronológica detalhada de sessões anteriores.

---

## 🛠️ Stack Tecnológica

- **Framework:** Next.js (TypeScript, React, App Router)
- **IA:** Google Gemini Flash (`@google/genai` / Structured Outputs)
- **Banco de Dados & ORM:** SQLite + Drizzle ORM
- **Estilização:** CSS moderno com Dark Mode de alta performance
- **Gráficos:** Recharts / Chart.js

---

## 📄 Especificação Técnica

O documento completo de design de arquitetura e modelo de dados está disponível em:
[`docs/superpowers/specs/2026-09-21-powerbuilding-dashboard-design.md`](./docs/superpowers/specs/2026-09-21-powerbuilding-dashboard-design.md)
