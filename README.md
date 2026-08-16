# 📚 OrganizaEstudos

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=nextdotjs" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/Node.js-20-339933?style=for-the-badge&logo=nodedotjs" alt="Node.js 20" />
  <img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb" alt="MongoDB" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript 5" />
  <img src="https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel" />
  <img src="https://img.shields.io/badge/shadcn/ui-000000?style=for-the-badge&logo=shadcn/ui&logoColor=white" alt="Shadcn/ui" />
  <img src="https://img.shields.io/badge/express.js-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express.js" />
  <img src="https://img.shields.io/badge/lucide-000000?style=for-the-badge&logo=lucide&logoColor=F56565" alt="Lucide" />
</p>

Plataforma para organizar estudos com foco em produtividade, rotina e acompanhamento de progresso. O projeto combina um frontend moderno em Next.js com uma API REST em Express e banco MongoDB, permitindo gerenciar matérias, tópicos, revisões, cronograma e anotações de forma estruturada.

## Visão Geral

O OrganizaEstudos ajuda o usuário a:

- manter um painel central com o status das matérias e o progresso geral;
- organizar estudos por disciplina e assunto;
- planejar revisões por data e calendário;
- registrar anotações e arquivos relacionados aos tópicos;
- receber um fluxo de dashboard com foco em tarefas do dia.

## Funcionalidades

- Autenticação com JWT e cookies
- Cadastro e login de usuários
- Dashboard com métricas de progresso
- Gestão de matérias, tópicos e revisões
- Cronograma semanal de estudos
- Visualização de conteúdo por disciplina
- Upload de anexos com Cloudinary
- Layout responsivo com Tailwind CSS e componentes do shadcn/ui

## Stack Tecnológica

### Frontend

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui
- Lucide React
- react-day-picker
- react-hot-toast

### Backend

- Node.js
- Express 5
- MongoDB + Mongoose
- JWT
- Cloudinary
- Cookie Parser
- CORS

## Arquitetura do Projeto

```text
organizaestudos-next/
├── backend/                 # API REST em Express
│   ├── controllers/         # Lógica de negócios
│   ├── db/                  # Conexão com banco de dados
│   ├── middleware/          # Middleware de autenticação
│   ├── models/              # Schemas do MongoDB
│   ├── routes/              # Rotas da API
│   └── utils/               # Utilitários
├── frontend/                # Aplicação web em Next.js
│   ├── src/actions/         # Ações em server components
│   ├── src/app/             # App Router do Next.js
│   ├── src/components/      # Componentes reutilizáveis
│   ├── src/services/        # Serviços de comunicação com API
│   └── src/types/           # Tipagens TypeScript
└── README.md
```

## Requisitos do Ambiente

Antes de iniciar, garanta que você tenha:

- Node.js 20+
- npm
- MongoDB Atlas ou uma instância MongoDB acessível
- Conta no Cloudinary

## Configuração Local

### 1. Clone o repositório

```bash
git clone https://github.com/ItaloKaua288/organizaestudos-next.git
cd organizaestudos-next
```

### 2. Instale as dependências do backend

```bash
cd backend
npm install
```

### 3. Configure as variáveis do backend

Crie um arquivo `.env` com base no exemplo disponível em `backend/.env.example`.

```env
MONGO_URL=mongodb+srv://<usuario>:<senha>@<cluster>.mongodb.net/<database>
JWT_SECRET=sua_chave_secreta
PORT=5000
CLIENT_URL=http://localhost:3000
CLOUDINARY_CLOUD_NAME=seu_cloud_name
CLOUDINARY_API_KEY=sua_api_key
CLOUDINARY_API_SECRET=sua_api_secret
```

### 4. Inicie o backend

```bash
npm run dev
```

A API ficará disponível em:

- `http://localhost:5000`

### 5. Instale as dependências do frontend

```bash
cd ../frontend
npm install
```

### 6. Configure as variáveis do frontend

Crie um arquivo `.env.local` com base no exemplo disponível em `frontend/.env.example`.

```env
API_BASE_URL=http://localhost:5000/api
```

### 7. Inicie o frontend

```bash
npm run dev
```

A aplicação ficará disponível em:

- `http://localhost:3000`

## Scripts Disponíveis

### Backend

```bash
npm run dev
npm start
```

### Frontend

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Fluxo de Funcionamento

1. O usuário cria uma conta e realiza login.
2. A API valida as credenciais e gera um token JWT.
3. O frontend mantém sessão e acessa rotas protegidas.
4. As matérias, tópicos e cronograma são persistidos no MongoDB.
5. Arquivos anexados são enviados para o Cloudinary.
6. O dashboard centraliza as informações para acompanhamento do progresso.

## Deploy

Frontend e backend foram ambos implantados na plataforma Vercel.

O backend pode ser implantado em qualquer ambiente Node.js compatível.

O frontend Next.js pode ser implantado em plataformas como:

- Vercel
- Netlify
- Railway
- qualquer provedor com suporte para Next.js

Para produção, ajuste as variáveis de ambiente com os valores corretos do deploy.

## Licença

Este projeto está licenciado sob a licença MIT.

## Observações

- O frontend usa a variável `API_BASE_URL` para apontar para a API.
- Em desenvolvimento, a aplicação depende da disponibilidade do backend em `http://localhost:5000`.
- Não commite arquivos com credenciais reais de produção.
