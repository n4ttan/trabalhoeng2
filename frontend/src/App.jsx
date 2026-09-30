import {
    BrowserRouter,
    Routes,
    Route
} from 'react-router-dom';

import HomePage from './pages/HomePage';
import CadastroMoradorPage from './pages/CadastroMoradorPage';

import PermissaoSindicoPage
    from './pages/PermissaoSindicoPage';

import AutorizacaoSindicoPage
    from './pages/AutorizacaoSindicoPage';

function App() {

    return (
        <BrowserRouter>

            <Routes>

                <Route
                    path="/"
                    element={<HomePage />}
                />

                <Route
                    path="/cadastro-morador"
                    element={<CadastroMoradorPage />}
                />

                <Route
                    path="/permissao-sindico"
                    element={<PermissaoSindicoPage />}
                />

                <Route
                    path="/autorizacao-sindico"
                    element={<AutorizacaoSindicoPage />}
                />

            </Routes>

        </BrowserRouter>
    );
}

export default App;