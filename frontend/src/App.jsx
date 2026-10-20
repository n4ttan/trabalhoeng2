import {
    BrowserRouter,
    Routes,
    Route
} from 'react-router-dom';

import HomePage
    from './pages/HomePage';

import LoginPage
    from './pages/LoginPage';

import CadastroMoradorPage
    from './pages/CadastroMoradorPage';

import CadastroMoradorValidacaoPage
    from './pages/CadastroMoradorValidacaoPage';

import PermissaoSindicoPage
    from './pages/PermissaoSindicoPage';

import AutorizacaoSindicoPage
    from './pages/AutorizacaoSindicoPage';

import PainelSindicoPage
    from './pages/PainelSindicoPage';


function App() {

    return (

        <BrowserRouter>

            <Routes>

                {/* Página inicial */}
                <Route
                    path="/"
                    element={
                        <HomePage />
                    }
                />


                {/* Login */}
                <Route
                    path="/login"
                    element={
                        <LoginPage />
                    }
                />


                {/* Cadastro do morador */}
                <Route
                    path="/cadastro-morador"
                    element={
                        <CadastroMoradorPage />
                    }
                />


                {/* Validação do cadastro */}
                <Route
                    path="/morador/cadastro"
                    element={
                        <CadastroMoradorValidacaoPage />
                    }
                />


                {/* Solicitação para ser síndico */}
                <Route
                    path="/permissao-sindico"
                    element={
                        <PermissaoSindicoPage />
                    }
                />


                {/* Autorização de síndico */}
                <Route
                    path="/autorizacao-sindico"
                    element={
                        <AutorizacaoSindicoPage />
                    }
                />


                {/* Painel administrativo do síndico */}
                <Route
                    path="/painel-sindico"
                    element={
                        <PainelSindicoPage />
                    }
                />

            </Routes>

        </BrowserRouter>
    );
}


export default App;