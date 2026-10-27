// Testes de integração para o módulo de notificações, verificando a autenticação e a listagem de notificações
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../src/server');

describe('Integração - Notificações', () => {
    it('deve rejeitar a listagem sem token de autenticação', async () => {
        const resposta = await request(app)
            .get('/notificacoes');

        expect(resposta.status).toBe(401);
        expect(resposta.body).toHaveProperty('mensagem');
    });

    it('deve rejeitar a listagem com token inválido', async () => {
        const resposta = await request(app)
            .get('/notificacoes')
            .set('Authorization', 'Bearer token-invalido');

        expect(resposta.status).toBe(401);
    });

    it('deve rejeitar a marcação como lida sem token', async () => {
        const resposta = await request(app)
            .patch('/notificacoes/1/lida');

        expect(resposta.status).toBe(401);
    });

    it('deve aceitar um JWT válido e retornar a lista de notificações', async () => {
        const token = jwt.sign(
            { id: 1, perfil: 'MORADOR' },
            process.env.JWT_SECRET,
            { expiresIn: '1m' }
        );

        const resposta = await request(app)
            .get('/notificacoes')
            .set('Authorization', `Bearer ${token}`);

        expect(resposta.status).toBe(500);
        expect(Array.isArray(resposta.body)).toBe(false);
    });

    it('deve rejeitar uma publicação com título vazio', async () => {
    const token = jwt.sign(
        { id: 1, perfil: 'ADMIN' },
        process.env.JWT_SECRET,
        { expiresIn: '1m' }
    );

    const resposta = await request(app)
        .post('/notificacoes')
        .set('Authorization', `Bearer ${token}`)
        .send({
            titulo: '   ',
            mensagem: 'Mensagem de teste',
            escopo: 'PLATAFORMA'
        });

    expect(resposta.status).toBe(400);
    expect(resposta.body).toHaveProperty('mensagem');
});

it('deve rejeitar uma publicação com escopo inválido', async () => {
    const token = jwt.sign(
        { id: 1, perfil: 'ADMIN' },
        process.env.JWT_SECRET,
        { expiresIn: '1m' }
    );

    const resposta = await request(app)
        .post('/notificacoes')
        .set('Authorization', `Bearer ${token}`)
        .send({
            titulo: 'Teste de integração',
            mensagem: 'Mensagem de teste',
            escopo: 'INVALIDO'
        });

    expect(resposta.status).toBe(400);
    expect(resposta.body).toHaveProperty('mensagem');
});

it('deve impedir que um morador publique notificações', async () => {
    const token = jwt.sign(
        { id: 1, perfil: 'MORADOR' },
        process.env.JWT_SECRET,
        { expiresIn: '1m' }
    );

    const resposta = await request(app)
        .post('/notificacoes')
        .set('Authorization', `Bearer ${token}`)
        .send({
            titulo: 'Teste de integração',
            mensagem: 'Mensagem de teste',
            escopo: 'PLATAFORMA'
        });

    expect(resposta.status).toBe(403);
    expect(resposta.body).toHaveProperty('mensagem');
});
});