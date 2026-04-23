# Documento de Especificação Técnica - MVP Sistema de Gestão Juntos pelo Impacto (Revisado)

## 1. Introdução

Este documento detalha as especificações técnicas revisadas para o Produto Mínimo Viável (MVP) do Sistema de Gestão do Projeto Juntos pelo Impacto. Com um prazo de desenvolvimento e "implantação" de dois meses, o foco é em um MVP extremamente enxuto, priorizando as funcionalidades essenciais para validação inicial. O objetivo é fornecer uma visão clara das necessidades, requisitos, arquitetura proposta, mapeamento de telas e o escopo preciso para a primeira iteração do sistema, visando resolver os problemas mais críticos identificados na gestão atual do projeto.

## 2. Necessidades e Problemas Identificados

A gestão atual do programa "Juntos pelo Impacto" é predominantemente manual, utilizando planilhas e registros descentralizados. Isso gera uma série de dificuldades operacionais e impacta a eficiência e a rastreabilidade das informações. As principais necessidades e problemas a serem endereçados pelo MVP incluem:

*   **Fragmentação e Descontinuidade de Informações:** Dados dispersos e não consolidados, dificultando o acompanhamento da evolução das OSCs e projetos ao longo do tempo.
*   **Falta de Controle e Visibilidade:** Dificuldade em controlar a relação entre alunos, equipes e OSCs, bem como a ausência de visibilidade sobre o progresso dos projetos em andamento.
*   **Padronização Inexistente:** Falta de padronização na coleta de dados e na gestão da disponibilidade das OSCs, levando a problemas como duplicidade de seleção.
*   **Sobrecarga Operacional:** A gestão manual gera sobrecarga para as lideranças e riscos relacionados à segurança dos dados.

## 3. Requisitos do Sistema

### 3.1. Requisitos Funcionais (RF)

Os requisitos funcionais descrevem as funcionalidades essenciais que o MVP deve oferecer para atender às necessidades identificadas, focando no escopo mínimo acordado.

| ID | Funcionalidade | Descrição |
| :-- | :--- | :--- |
| RF001 | **Autenticação de Usuários** | O sistema deve permitir que usuários (Professor/Coordenador, Aluno) realizem login com credenciais válidas. |
| RF002 | **Gestão de Perfis de Acesso** | O sistema deve diferenciar as funcionalidades e informações acessíveis com base no perfil do usuário (Professor/Coordenador, Aluno). |
| RF003 | **Cadastro de OSCs** | O Professor/Coordenador deve ser capaz de cadastrar novas Organizações da Sociedade Civil (OSCs) no sistema. |
| RF004 | **Listagem e Visualização de OSCs** | O Professor/Coordenador deve poder visualizar uma lista de todas as OSCs cadastradas, com seus respectivos status. |
| RF005 | **Gestão de Status da OSC** | O sistema deve permitir que o Professor/Coordenador altere o status de uma OSC (ex: disponível, em andamento, bloqueada). |
| RF006 | **Seleção de OSC por Projeto** | Alunos devem poder visualizar e selecionar uma OSC disponível para o seu projeto. |
| RF007 | **Remoção Automática de OSC Selecionada** | Após a seleção por um projeto, a OSC deve ser automaticamente removida da lista de disponíveis para outras seleções. |
| RF008 | **Gestão de Disponibilidade de OSCs** | O Coordenador define manualmente a disponibilidade das OSCs a cada semestre, alterando o status (`AVAILABLE`, `IN_PROGRESS`, `BLOCKED`) via painel. OSCs com status `IN_PROGRESS` ou `BLOCKED` não aparecem na listagem de disponíveis para alunos. |
| RF009 | **Dashboard Gerencial (Professor/Coordenador)** | O Professor/Coordenador deve ter acesso a um painel com indicadores chave: quantidade de OSCs participantes, número de projetos ativos e alertas (simplificado). |
| RF010 | **Cadastro Público de Alunos** | Alunos se cadastram através da rota pública `/sign-up`. A tela de cadastro é habilitada manualmente pelo Coordenador apenas no início de cada semestre e desabilitada após o período de inscrição — o requisito é permanente, o acesso à tela é controlado. |
| RF011 | **Criação de Coordenadores via Seed** | Coordenadores são criados via script de seed (`prisma/seed.ts`). O sistema suporta múltiplos coordenadores. Não existe tela de cadastro para este perfil. |
| RF012 | **Gestão de Projetos e Equipes pelo Aluno** | Após o cadastro, o aluno pode: (a) criar um novo projeto — gera automaticamente uma equipe com código único de 6 caracteres; (b) entrar em uma equipe existente informando o código de 6 caracteres; (c) criar uma nova equipe para continuar um projeto existente em um novo semestre. Um aluno pode pertencer a múltiplas equipes simultaneamente. |
| RF013 | **Cálculo Automático de Semestre** | O semestre ativo é calculado automaticamente por data: janeiro a junho correspondem ao 1º semestre; julho a dezembro ao 2º semestre. Formato interno: `YYYY-N` (ex: `2025-1`, `2025-2`). Nenhuma configuração manual é necessária. |
| RF014 | **Definição de Status do Projeto** | Ao encerrar o semestre, o Coordenador define o status de cada projeto via painel: `IN_PROGRESS`, `COMPLETED`, `ABANDONED`, `ONGOING` ou `INCOMPLETE`. O status impacta automaticamente a OSC vinculada apenas em `COMPLETED` e `ABANDONED`, que liberam a OSC para `AVAILABLE`. |

### 3.2. Requisitos Não Funcionais (RNF)

Os requisitos não funcionais definem as qualidades e restrições do sistema, adaptados para um MVP de desenvolvimento local.

| ID | Requisito Não Funcional | Descrição |
| :-- | :--- | :--- |
| RNF001 | **Usabilidade** | A interface do usuário deve ser intuitiva e de fácil aprendizado para todos os perfis de usuário, minimizando a necessidade de treinamento extensivo. |
| RNF002 | **Segurança** | O sistema deve implementar controle de acesso baseado em papéis (RBAC) e proteção básica contra vulnerabilidades comuns. |
| RNF003 | **Manutenibilidade** | O código-fonte deve ser bem documentado, modular e seguir padrões de codificação para facilitar futuras manutenções e evoluções. |
| RNF004 | **Compatibilidade** | O sistema deve ser compatível com os navegadores web modernos (Chrome, Firefox, Edge, Safari) e ser responsivo para diferentes tamanhos de tela (desktop, tablet, mobile). |
| RNF005 | **Ambiente de Desenvolvimento** | O sistema deve ser configurado para desenvolvimento local, sem a necessidade de infraestrutura de servidor ou balanceamento de carga para o MVP. |

## 4. Mapeamento de Telas (MVP)

Com base no escopo ultra-enxuto, as telas essenciais para o MVP são:

| Tela | Descrição | Perfil de Acesso | Rota |
| :--- | :--- | :--- | :--- |
| **Cadastro** | Criação de conta com perfil Aluno. Rota pública, sem aprovação. | Público | `/sign-up` |
| **Login** | Autenticação de usuários. | Todos | `/sign-in` |
| **Dashboard (Professor/Coordenador)** | Painel único com: (a) métricas — total de OSCs por status e projetos ativos; (b) alerta de projetos pendentes de fechamento do semestre anterior; (c) controle de habilitação do cadastro público de alunos (`signUpEnabled`) com indicador de estado e data da última alteração. | Professor/Coordenador | `/dashboard` |
| **Gestão de OSCs (Professor/Coordenador)** | Cadastro, listagem e alteração de status de OSCs. | Professor/Coordenador | `/oscs` |
| **Gestão de Projetos (Professor/Coordenador)** | Listagem de todos os projetos separados por semestre (atual × anteriores), com OSC vinculada, equipes e membros. Projetos com `status = IN_PROGRESS` de semestres anteriores aparecem destacados como pendentes de fechamento. Ação de definir status final ao encerrar semestre (RF014) com feedback da consequência automática na OSC. | Professor/Coordenador | `/projects` |
| **Projetos (Aluno)** | Listagem de todos os projetos; opções de criar novo projeto, entrar em equipe pelo código ou continuar projeto existente em novo semestre. | Aluno | `/projects` |
| **Seleção de OSC (Aluno)** | Lista de OSCs disponíveis para seleção pela equipe do aluno. | Aluno | `/oscs` |

![alt text](assets/login.png)
![alt text](assets/dashboard.png)
![alt text](assets/osc-manager.png)
![alt text](assets/list-osc.png)

## 5. Escopo do MVP (Mínimo Produto Viável - Revisado)

O MVP focará nas funcionalidades que entregam o maior valor para resolver os problemas mais urgentes da gestão manual, priorizando a **eliminação do controle via planilhas** e a **centralização das informações** dentro do prazo de 2 meses.

**Funcionalidades INCLUÍDAS no MVP:**

*   **Autenticação e Gestão de Perfis:** Login para Professor/Coordenador e Aluno, com diferenciação de acesso (RF001, RF002).
*   **Cadastro de Alunos:** Tela pública de cadastro (`/sign-up`) habilitada manualmente pelo Coordenador no início de cada semestre. O cadastro é aberto enquanto a tela estiver ativa (RF010).
*   **Criação de Coordenadores via Seed:** Coordenadores são criados via script (`prisma/seed.ts`), suportando múltiplos coordenadores. Não há tela de cadastro para este perfil (RF011).
*   **Gestão de Projetos e Equipes pelo Aluno:** Aluno pode criar novo projeto (gera equipe com código automático), entrar em equipe pelo código de 6 caracteres ou criar nova equipe para continuar projeto existente. Um aluno pode pertencer a múltiplas equipes (RF012).
*   **Cadastro e Gestão Básica de OSCs:** Cadastro, listagem e alteração de status (disponível, em andamento, bloqueada) por Professor/Coordenador (RF003, RF004, RF005).
*   **Fluxo de Seleção de OSC por Projeto:** Visualização de OSCs disponíveis, seleção pelo aluno em nome do projeto e remoção automática da lista (RF006, RF007).
*   **Gestão de Disponibilidade de OSCs:** Coordenador define manualmente o status das OSCs por semestre (RF008).
*   **Definição de Status do Projeto:** Coordenador define status do projeto ao encerrar semestre — libera automaticamente a OSC quando aplicável (RF014).
*   **Dashboard Simplificado (Professor/Coordenador):** Painel com quantidade de OSCs participantes e número de projetos ativos (RF009).

**Funcionalidades EXCLUÍDAS do MVP (para futuras iterações):**

*   Habilitação/desabilitação automática da tela de cadastro de alunos (hoje é manual).
*   Visualização do Status do Projeto (Aluno) detalhada.
*   Gestão de Formulários (para OSCs e Alunos).
*   Relatórios gerenciais avançados com filtros e exportação.
*   Notificações e alertas complexos.
*   Qualquer funcionalidade relacionada a implantação em servidor, load balancer, etc.

## 6. Conclusão do MVP

O MVP revisado visa entregar uma solução funcional e utilizável que digitaliza e centraliza os processos críticos de gestão do projeto Juntos pelo Impacto, focando nas interações essenciais entre Professor/Coordenador e Aluno para a gestão e seleção de OSCs. Ao limitar o escopo às funcionalidades mais críticas e à arquitetura de desenvolvimento local, será possível entregar uma primeira versão robusta dentro do prazo de dois meses, permitindo a validação rápida e a iteração futura com base no feedback dos usuários.
