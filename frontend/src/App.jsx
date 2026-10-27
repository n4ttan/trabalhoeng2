import React from 'react';
import {
    BrowserRouter,
    Routes,
    Route
} from 'react-router-dom';

import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import CadastroMoradorValidacaoPage from './pages/CadastroMoradorValidacaoPage';
import PermissaoSindicoPage from './pages/PermissaoSindicoPage';
import AutorizacaoSindicoPage from './pages/AutorizacaoSindicoPage';
import PainelSindicoPage from './pages/PainelSindicoPage';
import PerfilMoradorPage from './pages/PerfilMoradorPage';
import NotificacoesPage from './pages/NotificacoesPage';
import CondominiosPage from './pages/CondominiosPage';

function App() {
    return (
        <BrowserRouter>
            <Navbar />
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
                <Route path="/condominios" element={<CondominiosPage />} />

                {/* Solicitação para ser síndico */}
                <Route path="/permissao-sindico" element={<PermissaoSindicoPage />} />

                {/* Autorização de síndico */}
                <Route path="/autorizacao-sindico" element={<AutorizacaoSindicoPage />} />

                {/* Painel administrativo */}
                <Route path="/painel-sindico" element={<PainelSindicoPage />} />

                {/* Perfil do Morador */}
                <Route path="/perfil" element={<PerfilMoradorPage />} />

                {/* Notificações / Mural */}
                <Route path="/notificacoes" element={<NotificacoesPage />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;