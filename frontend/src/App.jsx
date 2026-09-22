import { useEffect, useState } from 'react';
import PedidoSindicoPage from './pages/PedidoSindicoPage';

function App() {
    const [mensagem, setMensagem] = useState('');

    useEffect(() => {
        fetch('http://localhost:3000/')
            .then(response => response.json())
            .then(data => {
                setMensagem(data.texto);
            })
            .catch(error => {
                console.error('Erro ao buscar mensagem:', error);
            });
    }, []);

    return (
        <main>
             <PedidoSindicoPage />
        </main>
    );
}

export default App;