import {
    BrowserRouter,
    Routes,
    Route
} from 'react-router-dom';

import HomePage from './pages/HomePage';
import CadastroMoradorPage from './pages/CadastroMoradorPage';
import PedidoSindicoPage from './pages/PedidoSindicoPage';

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
                    path="/pedido-sindico"
                    element={<PedidoSindicoPage />}
                />

            </Routes>

        </BrowserRouter>
    );
}

export default App;