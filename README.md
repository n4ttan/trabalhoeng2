# Sistema de Gerenciamento de Condomínio

Sistema web para gerenciamento de condomínios, desenvolvido como projeto da disciplina de Engenharia de Software II.

## Tecnologias

### Frontend
- React
- Vite

### Backend
- Node.js
- Express

### Banco de Dados
- MySQL

## Arquitetura

O sistema utiliza uma arquitetura em camadas:

React → Express → Controller → Service → Repository → MySQL

## Estrutura do projeto

```text
projetocondominio/
├── backend/
│   ├── .env
│   ├── .gitignore
│   ├── package.json
│   ├── package-lock.json
│   └── src/
│       ├── controllers/
│       ├── repositories/
│       ├── services/
│       └── server.js
├── frontend/
├── database/
│   └── schema.sql
├── docs/
├── tests/
└── README.md
```

## Como rodar

Pré-requisitos: Node.js e MySQL instalados.

1. **Banco de dados:** execute o `database/schema.sql` no MySQL (só na primeira vez). Quem já tem o banco criado precisa rodar apenas os comandos `ALTER TABLE` novos que ainda não aplicou, por exemplo:
   `ALTER TABLE usuarios ADD COLUMN tentativas_validacao INT NOT NULL DEFAULT 0;`
2. **Backend:**

   ~~~
   cd backend
   npm install
   cp .env.example .env      (no Windows: copy .env.example .env)
   ~~~

   Preencha o `.env` (usuário e senha do MySQL e, para o envio de e-mail, `EMAIL_USER` e `BREVO_API_KEY`) e rode `node src/server.js`. O servidor sobe na porta 3000.
3. **Frontend:**

   ~~~
   cd frontend
   npm install
   npm run dev
   ~~~

   Abra o endereço mostrado no terminal (geralmente http://localhost:5173).

O arquivo `.env` nunca deve ser enviado ao GitHub. Use o `.env.example` como modelo.

## Testes

Os testes de unidade usam Jest e não acessam banco, rede nem e-mail (o repositório e o serviço de e-mail são substituídos por mocks):

~~~
cd backend
npm test
~~~

## Cadastro de morador com validação de e-mail (KAN-22)

O morador se cadastra em `/morador/cadastro`, recebe um código de 6 dígitos por e-mail e só depois fica aguardando a aprovação do síndico.

| Método | Rota | Corpo | O que faz |
|--------|------|-------|-----------|
| POST | `/usuarios/moradores` | nome, email, senha, unidade | Cria o morador (perfil fixo MORADOR) e envia o código |
| POST | `/usuarios/validar-email` | email, codigo | Valida o código e passa o cadastro para PENDENTE_APROVACAO |
| POST | `/usuarios/reenviar-codigo` | email | Gera e envia um novo código |

Regras: o código tem 6 dígitos e vale 15 minutos; são permitidas 5 tentativas erradas por código; o reenvio só é aceito 60 segundos depois do último código.

Estados do cadastro (`status_cadastro`): AGUARDANDO_EMAIL → PENDENTE_APROVACAO → APROVADO ou REJEITADO.

O e-mail é enviado pela API do Brevo (variáveis `EMAIL_USER` e `BREVO_API_KEY`). O cadastro de candidato continua em `POST /usuarios`, que só aceita o perfil CANDIDATO.

## Gestão do projeto

- Quadro Kanban (GitHub Projects): https://github.com/users/n4ttan/projects/3
- Quadro Jira: https://trabalhoeng2.atlassian.net/jira/software/projects/KAN/boards/2

## Pendências conhecidas

- Autenticação e autorização nas rotas do síndico (aprovar, rejeitar, listar pendentes) e na exclusão de usuários.
- Link "já tenho um código" na tela de validação de e-mail.
- Limite de frequência por IP nas rotas que enviam e-mail.
