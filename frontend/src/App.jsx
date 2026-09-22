import { useEffect, useState } from 'react';

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
            <h1>{mensagem}</h1>
        </main>
    );
}

export default App;