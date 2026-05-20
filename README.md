# Sendflow

SaaS de broadcast de mensagens com isolamento multi-tenant, desenvolvido para o projeto prático de Desenvolvedor Full-Stack da SendFlow. Cada cliente possui conexões, contatos e mensagens próprias, além de uma coleção extra de usage para métricas. A leitura é feita em tempo real através da Firestore.

**Acesse o projeto:** https://sendflow-dev-prova.web.app/

## Stack

| Camada      | Tecnologias                                               |
| ----------- | --------------------------------------------------------- |
| Frontend    | React, TypeScript, Vite, Material UI, Tailwind CSS        |
| Formulários | React Hook Form, Zod                                      |
| Backend     | Firebase Auth, Cloud Firestore, Cloud Functions (Node 22) |
| Infra       | Firebase Hosting, pnpm workspaces                         |

## Funcionalidades

- Autenticação com e-mail e senha (Firebase Auth)
- CRUD de conexões, contatos e mensagens
- Seleção de contatos específicos por envio
- Agendamento de mensagens com atualização automática via Cloud Functions
- Filtro por mensagens enviadas e agendadas
- Isolamento completo de dados por usuário

## Estrutura

```
sendflow/
  web/                    Frontend React com Vite
  functions/              Cloud Functions
  firestore.rules         Regras de segurança do Firestore
  firestore.indexes.json
  firebase.json           Configuração de Hosting, Functions e Firestore
```

## Modelo de dados

Todas as coleções ficam na raiz do Firestore, isoladas por `userId`:

| Coleção       | Descrição                                              |
| ------------- | ------------------------------------------------------ |
| `connections` | Conexões do usuário                                    |
| `contacts`    | Contatos vinculados a uma conexão                      |
| `messages`    | Mensagens criadas e agendadas                          |
| `usage`       | Métricas pré-computadas por usuário para o dashboard (coleção extra) |

## Segurança

O Firestore bloqueia escritas diretas em `connections`, `contacts` e `messages` — todas passam por Cloud Functions. As Functions validam:

- Usuário autenticado e dono do recurso
- Limite de conexões por usuário (atualmente, cada usuário possui limite de 100 conexões)
- Contatos pertencentes ao usuário e à conexão selecionada
- Datas de agendamento futuras
- Bloqueio de edição de mensagens já enviadas
- Bloqueio de exclusão de conexões com contatos ou mensagens vinculadas

## Requisitos

- Node.js compatível com o projeto
- pnpm instalado globalmente
- Firebase CLI instalado
- Projeto Firebase com Auth, Firestore, Functions e Hosting configurados

## Configuração

### 1. Firebase Console

Habilite os seguintes serviços no Firebase Console:

1. **Authentication** — provedor e-mail/senha
2. **Cloud Firestore** — modo produção
3. **Cloud Functions**
4. **Firebase Hosting**

### 2. Variáveis de ambiente

```bash
cp web/.env.example web/.env.local
```

Preencha `web/.env.local` com os dados do app criado no Firebase Console:

```env
VITE_FIREBASE_API_KEY="..."
VITE_FIREBASE_AUTH_DOMAIN="..."
VITE_FIREBASE_PROJECT_ID="..."
VITE_FIREBASE_STORAGE_BUCKET="..."
VITE_FIREBASE_MESSAGING_SENDER_ID="..."
VITE_FIREBASE_APP_ID="..."
VITE_FIREBASE_MEASUREMENT_ID="..."
```

### 3. Instalação

```bash
pnpm install
```

## Desenvolvimento

```bash
pnpm dev
```

## Build

```bash
pnpm build
```

Compila o frontend e as Cloud Functions.

## Lint

```bash
pnpm lint
```

## Deploy

```bash
firebase login

firebase deploy --only functions,firestore:rules,firestore:indexes,hosting
```
