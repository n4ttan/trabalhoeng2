# Divisão do front: 20 rotas, 6 pessoas

Regra: cada pessoa é dona dos seus arquivos novos (`*Api.js` + página), então não há conflito.
Arquivos compartilhados (`App.jsx`, `Navbar.jsx`): só adicionar linha de rota/link, commit pequeno, `git pull --rebase` antes.
Cada um: branch própria `feat/<nome>-<tema>`, `npm run build` antes do commit, commits em português no imperativo, 1 commit por rota/tela, sem push na main.

| Quem | Itens | Arquivos (novos, salvo indicação) |
|---|---|---|
| Nattan | 1, 2, 3 — morador: meus boletos, 2ª via, pagar + comprovante | `boletoApi.js`, `MeusBoletosPage` |
| Rafael | 4, 5, 18 — painel financeiro, notificar inadimplentes, atribuir/desassociar gerenciamento | `pagamentoApi.js`, `PainelFinanceiroPage`, `gerenciamentoApi.js`, tela de gerenciamento |
| Adrian | 6, 7 — gerar boleto (individual/lote) e listagem geral | `boletoSindicoApi.js`, `GestaoBoletosPage` |
| Ryan | 8, 9, 10 — reservas do salão | `reservaSalaoApi.js`, `ReservasSalaoPage` |
| Otávio | 11, 12, 19, 20 — excluir reunião, notificação lida, reprovar síndico, rebaixar | `reuniaoApi.js`; edita `notificacaoApi.js`, `pedidoSindicoApi.js`, `usuarioApi.js`, `NotificacoesPage`, `AutorizacaoSindicoPage` |
| Felipe | 13, 14, 15, 16, 17 — moradores (listar/adicionar/bloco), criar bloco, excluir condomínio | edita `condominioApi.js`, `CondominiosPage`; `MoradoresPage` |

Pré-requisito de todos: ler a rota no backend (payload/resposta) antes de implementar.
