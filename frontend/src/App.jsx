import React from 'react';
import {
    BrowserRouter,
    Routes,
    Route
} from 'react-router-dom';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import RotaProtegida from './components/RotaProtegida';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import CadastroMoradorValidacaoPage from './pages/CadastroMoradorValidacaoPage';
import PermissaoSindicoPage from './pages/PermissaoSindicoPage';
import AutorizacaoSindicoPage from './pages/AutorizacaoSindicoPage';
import PainelSindicoPage from './pages/PainelSindicoPage';
import PerfilMoradorPage from './pages/PerfilMoradorPage';
import NotificacoesPage from './pages/NotificacoesPage';
import CondominiosPage from './pages/CondominiosPage';
import ReunioesPage from './pages/ReunioesPage';
import ReservasChurrasqueiraPage from './pages/ReservasChurrasqueiraPage';
import ReservasSalaoPage from './pages/ReservasSalaoPage';
import VisitantesPage from './pages/VisitantesPage';
import MoradoresPage from './pages/MoradoresPage';
import MeusBoletosPage from './pages/MeusBoletosPage';
import GestaoBoletosPage from './pages/GestaoBoletosPage';
import GestaoMultasPage from './pages/GestaoMultasPage';
import MinhasMultasPage from './pages/MinhasMultasPage';
import PainelFinanceiroPage from './pages/PainelFinanceiroPage';
import RelatoriosPage from './pages/RelatoriosPage';
import GerenciamentoPage from './pages/GerenciamentoPage';
import OcorrenciasPage from './pages/OcorrenciasPage';

function App() {
    return (
        <BrowserRouter>
            <Navbar />
            <main className="app-conteudo-principal">
                <Routes>
                    {/* Página inicial */}
                    <Route path="/" element={<HomePage />} />

                    {/* Login */}
                    <Route path="/login" element={<LoginPage />} />

                    {/* Cadastro do morador */}
                    <Route path="/cadastro" element={<CadastroMoradorValidacaoPage />} />
                    <Route path="/cadastro-morador" element={<CadastroMoradorValidacaoPage />} />
                    <Route path="/morador/cadastro" element={<CadastroMoradorValidacaoPage />} />

                    {/* Múltiplos Condomínios */}
                    <Route path="/condominios" element={<RotaProtegida><CondominiosPage /></RotaProtegida>} />

                    {/* Solicitação para ser síndico */}
                    <Route path="/permissao-sindico" element={<RotaProtegida><PermissaoSindicoPage /></RotaProtegida>} />

                    {/* Autorização de síndico */}
                    <Route path="/autorizacao-sindico" element={<RotaProtegida perfis={['ADMIN']}><AutorizacaoSindicoPage /></RotaProtegida>} />

                    {/* Painel administrativo */}
                    <Route path="/painel-sindico" element={<RotaProtegida perfis={['SINDICO', 'ADMIN']}><PainelSindicoPage /></RotaProtegida>} />

                    {/* Perfil do Morador */}
                    <Route path="/perfil" element={<RotaProtegida><PerfilMoradorPage /></RotaProtegida>} />

                    {/* Notificações / Mural */}
                    <Route path="/notificacoes" element={<RotaProtegida><NotificacoesPage /></RotaProtegida>} />

                    {/* Reuniões */}
                    <Route path="/reunioes" element={<RotaProtegida><ReunioesPage /></RotaProtegida>} />

                    {/* Ocorrências */}
                    <Route path="/ocorrencias" element={<RotaProtegida perfis={['MORADOR', 'SINDICO', 'ADMIN']}><OcorrenciasPage /></RotaProtegida>} />

                    {/* Reservas de Churrasqueira */}
                    <Route path="/reservas-churrasqueira" element={<RotaProtegida><ReservasChurrasqueiraPage /></RotaProtegida>} />

                    {/* Reservas de Salão de Festas */}
                    <Route path="/reservas-salao" element={<RotaProtegida><ReservasSalaoPage /></RotaProtegida>} />

                    {/* Visitantes (morador pré-autoriza; síndico opera a portaria) */}
                    <Route path="/visitantes" element={<RotaProtegida><VisitantesPage /></RotaProtegida>} />

                    {/* Gestão de Moradores e Blocos (Síndico/Admin) */}
                    <Route path="/moradores" element={<RotaProtegida perfis={['SINDICO', 'ADMIN']}><MoradoresPage /></RotaProtegida>} />

                    {/* Boletos do morador */}
                    <Route path="/meus-boletos" element={<RotaProtegida perfis={['MORADOR', 'ADMIN']}><MeusBoletosPage /></RotaProtegida>} />

                    {/* Boletos do condomínio (síndico) */}
                    <Route path="/gestao-boletos" element={<RotaProtegida perfis={['SINDICO', 'ADMIN']}><GestaoBoletosPage /></RotaProtegida>} />

                    {/* Multas (KAN-12) */}
                    <Route path="/minhas-multas" element={<RotaProtegida perfis={['MORADOR', 'ADMIN']}><MinhasMultasPage /></RotaProtegida>} />
                    <Route path="/gestao-multas" element={<RotaProtegida perfis={['SINDICO', 'ADMIN']}><GestaoMultasPage /></RotaProtegida>} />

                    {/* Painel Financeiro (síndico) */}
                    <Route path="/painel-financeiro" element={<RotaProtegida perfis={['SINDICO', 'ADMIN']}><PainelFinanceiroPage /></RotaProtegida>} />
                    <Route path="/relatorios" element={<RotaProtegida perfis={['SINDICO', 'ADMIN']}><RelatoriosPage /></RotaProtegida>} />

                    {/* Atribuir e Desassociar Gerenciamento (Admin) */}
                    <Route path="/gerenciamento" element={<RotaProtegida perfis={['ADMIN']}><GerenciamentoPage /></RotaProtegida>} />
                </Routes>
            </main>
            <Footer />
        </BrowserRouter>
    );
}

export default App;