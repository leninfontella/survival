I'm going to be a fucking billionaire with this project.

# 🏆 Sobrevivente: Survivor League Platform

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![TypeScript](https://img.shields.io/badge/typescript-%23007acc.svg?style=for-the-badge&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)
![MongoDB](https://img.shields.io/badge/MongoDB-%234ea94b.svg?style=for-the-badge&logo=mongodb&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)

O **Sobrevivente** é uma aplicação Full Stack de entretenimento esportivo baseada no modelo "Survivor". Os jogadores escolhem um time vencedor a cada rodada das maiores ligas de futebol do mundo; um erro resulta em eliminação, e o último sobrevivente leva o prêmio acumulado.

## 📋 Regras Oficiais do Jogo

O sistema implementa automaticamente as seguintes regras de negócio:
* **Escolha por Rodada:** A cada rodada, o jogador deve escolher exatamente um time que acredita que vencerá sua partida.
* **Condição de Vitória:** Se o time escolhido vencer, o jogador avança para a próxima etapa.
* **Condição de Eliminação:** Em caso de empate ou derrota do time escolhido, o jogador é eliminado imediatamente.
* **Restrição de Escolha:** Não é permitido escolher o mesmo time mais de uma vez durante a mesma competição.
* **Prêmio Final:** O prêmio total acumulado (menos taxas) é destinado ao último jogador restante na sala.

## 🚀 Funcionalidades Principais

* **Painel de Estatísticas em Tempo Real:** Monitoramento de jogadores ativos, prêmio total acumulado, rodada atual e contagem de salas.
* **Sistema de Autenticação:** Fluxo completo de login e cadastro com rotas protegidas.
* **Gestão de Salas:** Interface para criação de salas administrativas e entrada de jogadores.
* **Dashboard Dinâmico:** Área restrita para usuários autenticados gerenciarem suas participações.

## 🛠️ Tecnologias Utilizadas

### Frontend
* **Framework:** React com TypeScript.
* **Roteamento:** React Router Dom para navegação SPA e proteção de rotas.
* **Estilização:** Tailwind CSS e Radix UI (via shadcn/ui).
* **Ícones:** Lucide React.
* **Gerenciamento de Estado:** React Context API (GameProvider) e TanStack Query.

### Backend
* **Ambiente:** Node.js com framework Express.
* **Banco de Dados:** MongoDB (via Mongoose).
* **Segurança:** CORS configurado para integração segura com o frontend.
* **Arquitetura:** Estrutura de rotas modularizada para Autenticação, Salas e Estatísticas.

## 🔧 Configuração do Ambiente

### Variáveis de Ambiente (.env)

**Servidor (Backend):**

```env

PORT=5000
MONGODB_URI=seu_link_mongodb
CLIENT_URL=http://localhost:5173
JWT_SECRET=sua_chave_secreta

Instalação
Clone o repositório:

Bash

git clone [https://github.com/seu-usuario/sobrevivente.git](https://github.com/seu-usuario/sobrevivente.git)
Instale as dependências do Backend e inicie:

Bash

cd server
npm install
npm start
Instale as dependências do Frontend e inicie:

Bash

cd client
npm install
npm run dev

🛣️ Endpoints da API

POST /api/auth: Gerenciamento de usuários e sessões.
GET/POST /api/rooms: Administração e consulta de salas de jogo.
GET /api/stats: Dados globais e estatísticas do sistema.

© 2026 Sobrevivente. Todos os direitos reservados.
