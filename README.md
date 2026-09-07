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