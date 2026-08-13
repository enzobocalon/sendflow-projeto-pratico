# Sendflow

SaaS de broadcast de mensagens com isolamento multi-tenant, desenvolvido para o projeto prático de Desenvolvedor Full-Stack da SendFlow. Cada cliente possui conexões, contatos e mensagens próprias. As páginas visíveis e as métricas do dashboard são atualizadas em tempo real pelo Firestore.

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
  functions/              Agendador e pacote compartilhado
  firestore.rules         Regras de segurança do Firestore
  firestore.indexes.json
  firebase.json           Configuração de Hosting, Functions e Firestore
```

No frontend, cada feature separa suas responsabilidades em:

- `components`: renderização e contratos de propriedades;
- `models`: collections, leituras `get...`, hooks reativos `use...` e operações
  de persistência `create...`, `upsert...` e `delete...`;
- `facades`: coordenação dos casos de uso da UI, incluindo formulários,
  handlers, dialogs e feedback. Um facade pode consumir um ou vários models.

Os hooks reativos atuais usam os listeners nativos do Firestore. A adoção de
RxJS fica reservada para uma etapa posterior.

Os arquivos usam `kebab-case`. Arquivos que representam uma camada de uma
entidade usam o nome da entidade no singular e a camada como sufixo, por
exemplo `connection.model.ts`, `contact.schema.ts` e `message.service.ts`.
Arquivos que representam coleções preservam o plural semântico, como
`connections-list.tsx` e `use-connections.ts`.

## Modelo de dados

Todas as coleções ficam na raiz do Firestore, isoladas por `userId`:

| Coleção       | Descrição                           |
| ------------- | ----------------------------------- |
| `connections` | Conexões ativas ou arquivadas       |
| `contacts`    | Contatos vinculados a uma conexão   |
| `messages`    | Mensagens criadas e agendadas       |
| `usage`       | Contadores do dashboard por usuário |

## Segurança

O frontend grava diretamente no Firestore. As Security Rules validam:

- Usuário autenticado e dono do recurso
- Campos permitidos, formatos, timestamps e propriedade dos recursos
- Contatos vinculados a uma conexão ativa do próprio usuário
- Datas de agendamento futuras
- Bloqueio de edição de mensagens já enviadas
- Bloqueio de hard delete de conexões

O model de conexões limita o usuário a 100 conexões ativas e impede o
arquivamento quando há contatos ou mensagens vinculadas. O model de mensagens
também revalida os contatos selecionados na mesma transação da gravação. A única
Cloud Function publicada é o agendador que marca mensagens vencidas como
enviadas. Os models atualizam `usage/{userId}` atomicamente junto ao recurso,
e o dashboard mantém um único listener nesse documento.

## Requisitos

- Node.js 22
- JDK 21 ou superior para executar o Firestore Emulator
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

## Testes

Os testes unitários rodam diretamente com Vitest. Os testes de integração e de
regras usam o Firestore Emulator e, por isso, precisam do JDK 21 ou superior:

```bash
pnpm test
```

Para gerar o relatório de cobertura das Functions:

```bash
pnpm test:coverage
```

## Popular o Firestore para desenvolvimento

O seed cria ou atualiza 100 conexões, 100 contatos e 100 mensagens para um
usuário. Informe explicitamente o projeto Firebase e o UID encontrado no
Firebase Authentication. Prefira um usuário dedicado a testes, pois o limite
normal da aplicação é de 100 conexões por usuário:

```bash
pnpm seed:firestore -- --project-id sendflow-dev-prova --user-id SEU_USER_ID
```

Para usar o Firestore Emulator:

```bash
pnpm seed:firestore -- --project-id sendflow-dev-prova --user-id SEU_USER_ID --emulator-host 127.0.0.1:8080
```

No Firebase real, o Admin SDK precisa de Application Default Credentials ou da
variável `GOOGLE_APPLICATION_CREDENTIALS` apontando para uma service account.
Os IDs do seed são determinísticos, então repetir o comando para o mesmo usuário
atualiza os documentos criados anteriormente sem duplicá-los. Os contatos e as
mensagens ficam vinculados à primeira conexão de seed para também exercitar a
paginação do seletor de contatos no composer de mensagens. Por segurança, o
comando é interrompido se o usuário já possuir documentos que não sejam desse
seed. Ao final, o script recalcula `usage/{userId}` considerando também os dados
mantidos com `--allow-existing`.

Para manter dados já existentes de um usuário de testes, acrescente a opção
`--allow-existing`. Nenhum documento existente será apagado:

```bash
pnpm seed:firestore -- --project-id sendflow-dev-prova --user-id SEU_USER_ID --allow-existing
```

Para apenas reconciliar os contadores de um usuário existente, sem criar ou
alterar conexões, contatos e mensagens:

```bash
pnpm sync:usage -- --project-id sendflow-dev-prova --user-id SEU_USER_ID
```

## Deploy

```bash
firebase login

firebase deploy --only functions,firestore:rules,firestore:indexes,hosting
```
