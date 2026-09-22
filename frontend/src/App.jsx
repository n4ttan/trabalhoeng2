import {
    BrowserRouter,
    Routes,
    Route
} from 'react-router-dom';

import HomePage from './pages/HomePage';
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
                    path="/pedido-sindico"
                    element={<PedidoSindicoPage />}
                />
            </Routes>
        </BrowserRouter>
    );
}

export default App;