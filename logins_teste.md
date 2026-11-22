# Credenciais e Logins de Teste — Morada Residências

Este documento reúne todas as credenciais de acesso geradas para os condomínios e perfis de teste da aplicação. Todos os usuários já estão cadastrados com status **APROVADO**, dispensando validação adicional de e-mail e permitindo login imediato na tela `/login`.

---

## 🏢 Condomínio 1: Residencial Solar das Flores

| Função | Nome Completo | E-mail de Login | Senha de Acesso | Bloco / Unidade | Permissões no Sistema |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Síndico Responsável** | Fernando Síndico Flores | `sindico.flores@morada.com` | `Senha@123` | Administração | Gestão do condomínio, aprovação de moradores, emissão/gestão de boletos, agendamento e cancelamento de reuniões, publicação de comunicados. |
| **Morador 1** | Mariana Moradora | `mariana.flores@morada.com` | `Senha@123` | Bloco A - Apto 101 | Consulta de boletos próprios, agendamento de churrasqueira e salão de festas do condomínio, leitura do mural de avisos. |
| **Morador 2** | Rodrigo Morador | `rodrigo.flores@morada.com` | `Senha@123` | Bloco B - Apto 202 | Consulta de boletos próprios, agendamento de áreas comuns, cancelamento de reservas próprias, leitura de notificações. |

---

## 🏢 Condomínio 2: Residencial Vista do Vale

| Função | Nome Completo | E-mail de Login | Senha de Acesso | Bloco / Unidade | Permissões no Sistema |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Síndico Responsável** | Beatriz Síndica Vale | `sindica.vale@morada.com` | `Senha@123` | Administração | Gestão completa do Residencial Vista do Vale, gerenciamento de blocos e moradores, painel financeiro exclusivo do condomínio. |
| **Morador 1** | Lucas Morador | `lucas.vale@morada.com` | `Senha@123` | Bloco 1 - Apto 301 | Acesso restrito ao Condomínio Vista do Vale: boletos próprios, reservas de salão/churrasqueira e avisos. |
| **Morador 2** | Camila Moradora | `camila.vale@morada.com` | `Senha@123` | Bloco 2 - Apto 402 | Acesso restrito ao Condomínio Vista do Vale: boletos próprios, reservas e notificações. |

---

## 🛡️ Administrador Geral da Plataforma

| Função | Nome Completo | E-mail de Login | Senha de Acesso | Escopo de Acesso |
| :--- | :--- | :--- | :--- | :--- |
| **ADMIN Geral** | Administrador da Plataforma | `admin@morada.com` | `Admin@123` | Acesso irrestrito a todos os condomínios, autorização de síndicos, atribuição de gerenciamentos e painéis financeiros globais. |

> **Contato Oficial de Suporte da Administração:**
> - E-mail do Administrador: `galdinosindico@gmail.com`
> - E-mail Corporativo: `admin@moradaresidencias.com.br`

---

## 🔄 Como Recriar ou Atualizar os Dados de Teste

Para reexecutar o seed e redefinir as senhas e condomínios a qualquer momento, execute:

```bash
# A partir da raiz do projeto:
node backend/scripts/criar_condominios_teste.js
```

O script é idempotente: caso os condomínios ou usuários já existam, seus dados, senhas criptografadas e vínculos com blocos serão atualizados mantendo a consistência referencial.
