import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listarMeusBoletos, obterSegundaVia } from '../services/boletoApi';
import './MeusBoletosPage.css';

const brl = (v) =>
  Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// Datas do MySQL chegam como ISO; usar só a parte da data evita deslocar o dia pelo fuso.
const dataBR = (iso) => String(iso).slice(0, 10).split('-').reverse().join('/');

function situacao(boleto) {
  if (boleto.status === 'PAGO') return { chave: 'pago', texto: 'Pago' };
  if (boleto.status === 'CANCELADO') return { chave: 'cancelado', texto: 'Cancelado' };
  const hoje = new Date().toISOString().slice(0, 10);
  if (String(boleto.data_vencimento).slice(0, 10) < hoje) {
    return { chave: 'atrasado', texto: 'Em atraso' };
  }
  return { chave: 'aberto', texto: 'Em aberto' };
}

function abrirTemplate(html) {
  const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
  window.open(url, '_blank', 'noopener');
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

export default function MeusBoletosPage() {
  const [boletos, setBoletos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [painel, setPainel] = useState(null); // { id, carregando, erro, via }
  const [copiado, setCopiado] = useState(false);

  const navigate = useNavigate();
  const condoSalvo = localStorage.getItem('morada_condominio_ativo');
  const condominioAtivo = condoSalvo ? JSON.parse(condoSalvo) : null;

  useEffect(() => {
    if (!condominioAtivo) {
      navigate('/condominios');
      return;
    }
    carregar();
  }, [condominioAtivo?.id]);

  async function carregar() {
    try {
      setCarregando(true);
      setErro('');
      const dados = await listarMeusBoletos(condominioAtivo.id);
      setBoletos(Array.isArray(dados) ? dados : []);
    } catch (err) {
      setErro(err.message || 'Não foi possível carregar seus boletos.');
    } finally {
      setCarregando(false);
    }
  }

  async function abrirSegundaVia(boleto) {
    if (painel?.id === boleto.id) {
      setPainel(null);
      return;
    }
    setCopiado(false);
    setPainel({ id: boleto.id, carregando: true });
    try {
      const { boleto: via } = await obterSegundaVia(condominioAtivo.id, boleto.id);
      setPainel({ id: boleto.id, via });
    } catch (err) {
      setPainel({ id: boleto.id, erro: err.message || 'Não foi possível gerar a 2ª via.' });
    }
  }

  async function copiarLinha(texto) {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
    } catch {
      setCopiado(false);
    }
  }

  if (!condominioAtivo) return null;

  const emAberto = boletos.filter((b) => ['aberto', 'atrasado'].includes(situacao(b).chave));
  const totalAberto = emAberto.reduce((soma, b) => soma + Number(b.valor), 0);

  return (
    <main className="boletos-page">
      <header className="boletos-header">
        <h2>Meus boletos</h2>
        <p>
          {condominioAtivo.nome}
          {!carregando && !erro && boletos.length > 0 && (
            <>
              {' · '}
              {emAberto.length === 0
                ? 'Nenhum boleto em aberto'
                : `${emAberto.length} em aberto, ${brl(totalAberto)}`}
            </>
          )}
        </p>
      </header>

      {erro && (
        <div className="boletos-erro" role="alert">
          <span>{erro}</span>
          <button type="button" onClick={carregar}>Tentar de novo</button>
        </div>
      )}

      {carregando ? (
        <p className="boletos-vazio" role="status">Carregando boletos…</p>
      ) : (
        !erro &&
        (boletos.length === 0 ? (
          <p className="boletos-vazio">
            Você ainda não tem boletos neste condomínio. Quando o síndico gerar a taxa do mês, ela aparece aqui.
          </p>
        ) : (
          <ul className="boletos-lista">
            {boletos.map((b) => {
              const sit = situacao(b);
              return (
                <li key={b.id} className="boleto-linha">
                  <div className="boleto-ref">
                    <strong>{b.mes_referencia}</strong>
                    <span>Vence em {dataBR(b.data_vencimento)}</span>
                  </div>
                  <span className={`boleto-status boleto-status--${sit.chave}`}>{sit.texto}</span>
                  <span className="boleto-valor">{brl(b.valor)}</span>
                  {['aberto', 'atrasado'].includes(sit.chave) && (
                    <div className="boleto-acoes">
                      <button
                        type="button"
                        className="btn-secundario"
                        aria-expanded={painel?.id === b.id}
                        onClick={() => abrirSegundaVia(b)}
                      >
                        2ª via
                      </button>
                    </div>
                  )}
                  {painel?.id === b.id && (
                    <div className="boleto-painel">
                      {painel.carregando && <p role="status">Gerando 2ª via…</p>}
                      {painel.erro && <p className="boleto-painel-erro" role="alert">{painel.erro}</p>}
                      {painel.via && (
                        <>
                          <dl className="boleto-detalhes">
                            <div><dt>Valor original</dt><dd>{brl(painel.via.valor_original)}</dd></div>
                            <div><dt>Multa</dt><dd>{brl(painel.via.multa)}</dd></div>
                            <div><dt>Juros</dt><dd>{brl(painel.via.juros)}</dd></div>
                            <div><dt>Novo vencimento</dt><dd>{dataBR(painel.via.nova_data_vencimento)}</dd></div>
                            <div className="boleto-total"><dt>Total a pagar</dt><dd>{brl(painel.via.valor_total)}</dd></div>
                          </dl>
                          <p className="boleto-linha-digitavel">{painel.via.linha_digitavel}</p>
                          <div className="boleto-painel-acoes">
                            <button type="button" className="btn-secundario" onClick={() => copiarLinha(painel.via.linha_digitavel)}>
                              {copiado ? 'Linha copiada' : 'Copiar linha digitável'}
                            </button>
                            <button type="button" className="btn-secundario" onClick={() => abrirTemplate(painel.via.template_html)}>
                              Abrir boleto para imprimir
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        ))
      )}
    </main>
  );
}
