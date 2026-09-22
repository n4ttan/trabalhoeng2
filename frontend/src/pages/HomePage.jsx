import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

function HomePage() {

    const [mensagem, setMensagem] = useState('');

    useEffect(() => {

        fetch('http://localhost:3000/')
            .then(response => response.json())
            .then(data => {
                setMensagem(data.texto);
            })
            .catch(error => {
                console.error(
                    'Erro ao buscar mensagem:',
                    error
                );

                setMensagem('Sistema do Condomínio');
            });

    }, []);

    return (
        <main>

            <div>

                <h1>
                    {mensagem}
                </h1>

                <h2>
                    Sistema do Condomínio
                </h2>

                <div>

                    <Link to="/cadastro-morador">
                        Cadastro de Morador
                    </Link>

                </div>

                <br />

                <div>

                    <Link to="/pedido-sindico">
                        Gestão de Síndico
                    </Link>

                </div>

            </div>

        </main>
    );
}

export default HomePage;