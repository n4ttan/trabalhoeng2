/**
 * Script de Seed: Criação de Condomínios e Usuários de Teste
 * 
 * Cria 2 condomínios de teste, cada um contendo:
 * - 1 Síndico Responsável (status APROVADO)
 * - 2 Moradores vinculados a blocos e unidades (status APROVADO)
 * - 1 Administrador Geral da Plataforma
 * 
 * Uso:
 * node backend/scripts/criar_condominios_teste.js
 */

const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');

require('dotenv').config({ path: path.join(__dirname, '../.env') });

const SENHA_PADRAO = 'Senha@123';
const SENHA_ADMIN = 'Admin@123';

const DADOS_CONDOMINIOS = [
  {
    nome: 'Residencial Solar das Flores',
    blocos: ['Bloco A', 'Bloco B'],
    sindico: {
      nome: 'Fernando Síndico Flores',
      email: 'sindico.flores@morada.com',
      senha: SENHA_PADRAO,
      perfil: 'SINDICO'
    },
    moradores: [
      {
        nome: 'Mariana Moradora',
        email: 'mariana.flores@morada.com',
        senha: SENHA_PADRAO,
        bloco: 'Bloco A',
        unidade: '101'
      },
      {
        nome: 'Rodrigo Morador',
        email: 'rodrigo.flores@morada.com',
        senha: SENHA_PADRAO,
        bloco: 'Bloco B',
        unidade: '202'
      }
    ]
  },
  {
    nome: 'Residencial Vista do Vale',
    blocos: ['Bloco 1', 'Bloco 2'],
    sindico: {
      nome: 'Beatriz Síndica Vale',
      email: 'sindica.vale@morada.com',
      senha: SENHA_PADRAO,
      perfil: 'SINDICO'
    },
    moradores: [
      {
        nome: 'Lucas Morador',
        email: 'lucas.vale@morada.com',
        senha: SENHA_PADRAO,
        bloco: 'Bloco 1',
        unidade: '301'
      },
      {
        nome: 'Camila Moradora',
        email: 'camila.vale@morada.com',
        senha: SENHA_PADRAO,
        bloco: 'Bloco 2',
        unidade: '402'
      }
    ]
  }
];

const ADMIN_GERAL = {
  nome: 'Administrador da Plataforma',
  email: 'admin@morada.com',
  senha: SENHA_ADMIN,
  perfil: 'ADMIN'
};

async function executarSeed() {
  console.log('Iniciando seed de condomínios e usuários de teste...');

  const conexao = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'valve123',
    database: process.env.DB_NAME || 'condominio'
  });

  const relatorioLogins = [];

  try {
    // 1. Criar ou Atualizar Administrador Geral
    const hashAdmin = await bcrypt.hash(ADMIN_GERAL.senha, 10);
    const [adminExistente] = await conexao.query(
      'SELECT id FROM usuarios WHERE email = ?',
      [ADMIN_GERAL.email]
    );

    let adminId;
    if (adminExistente.length > 0) {
      adminId = adminExistente[0].id;
      await conexao.query(
        'UPDATE usuarios SET nome = ?, senha = ?, perfil = ?, status_cadastro = ? WHERE id = ?',
        [ADMIN_GERAL.nome, hashAdmin, ADMIN_GERAL.perfil, 'APROVADO', adminId]
      );
    } else {
      const [resAdmin] = await conexao.query(
        'INSERT INTO usuarios (nome, email, senha, perfil, status_cadastro) VALUES (?, ?, ?, ?, ?)',
        [ADMIN_GERAL.nome, ADMIN_GERAL.email, hashAdmin, ADMIN_GERAL.perfil, 'APROVADO']
      );
      adminId = resAdmin.insertId;
    }

    relatorioLogins.push({
      condominio: 'Geral (Todos os Condomínios)',
      funcao: 'ADMINISTRADOR GERAL',
      nome: ADMIN_GERAL.nome,
      email: ADMIN_GERAL.email,
      senha: ADMIN_GERAL.senha,
      blocoUnidade: 'N/A'
    });

    // 2. Iterar sobre cada condomínio
    for (const condoData of DADOS_CONDOMINIOS) {
      console.log(`\nConfigurando condomínio: ${condoData.nome}...`);

      // 2.1 Criar ou obter condomínio
      const [condoRows] = await conexao.query(
        'SELECT id FROM condominios WHERE nome = ?',
        [condoData.nome]
      );

      let condoId;
      if (condoRows.length > 0) {
        condoId = condoRows[0].id;
        console.log(`- Condomínio existente encontrado (ID: ${condoId})`);
      } else {
        const [resCondo] = await conexao.query(
          'INSERT INTO condominios (nome, numero_moradores) VALUES (?, ?)',
          [condoData.nome, 2]
        );
        condoId = resCondo.insertId;
        console.log(`- Condomínio criado (ID: ${condoId})`);
      }

      // 2.2 Criar ou mapear blocos
      const mapaBlocos = {};
      for (const nomeBloco of condoData.blocos) {
        const [blocoRows] = await conexao.query(
          'SELECT id FROM blocos WHERE nome = ? AND id_condominio = ?',
          [nomeBloco, condoId]
        );

        let blocoId;
        if (blocoRows.length > 0) {
          blocoId = blocoRows[0].id;
        } else {
          const [resBloco] = await conexao.query(
            'INSERT INTO blocos (nome, id_condominio) VALUES (?, ?)',
            [nomeBloco, condoId]
          );
          blocoId = resBloco.insertId;
        }
        mapaBlocos[nomeBloco] = blocoId;
        console.log(`  * Bloco "${nomeBloco}" (ID: ${blocoId})`);
      }

      // 2.3 Criar Síndico
      const hashSindico = await bcrypt.hash(condoData.sindico.senha, 10);
      const [sindicoRows] = await conexao.query(
        'SELECT id FROM usuarios WHERE email = ?',
        [condoData.sindico.email]
      );

      let sindicoId;
      if (sindicoRows.length > 0) {
        sindicoId = sindicoRows[0].id;
        await conexao.query(
          `UPDATE usuarios SET 
            nome = ?, senha = ?, perfil = 'SINDICO', id_condominio = ?, status_cadastro = 'APROVADO' 
           WHERE id = ?`,
          [condoData.sindico.nome, hashSindico, condoId, sindicoId]
        );
      } else {
        const [resSindico] = await conexao.query(
          `INSERT INTO usuarios 
            (nome, email, senha, perfil, id_condominio, status_cadastro) 
           VALUES (?, ?, ?, 'SINDICO', ?, 'APROVADO')`,
          [condoData.sindico.nome, condoData.sindico.email, hashSindico, condoId]
        );
        sindicoId = resSindico.insertId;
      }

      // Vincular síndico como responsável pelo condomínio
      await conexao.query(
        'UPDATE condominios SET sindico_responsavel = ?, numero_moradores = 2 WHERE id = ?',
        [sindicoId, condoId]
      );

      // Vincular na tabela gestores_condominios se existir
      const [gestorRows] = await conexao.query(
        'SELECT id FROM gestores_condominios WHERE usuario_id = ? AND condominio_id = ?',
        [sindicoId, condoId]
      );
      if (gestorRows.length === 0) {
        await conexao.query(
          'INSERT INTO gestores_condominios (usuario_id, condominio_id) VALUES (?, ?)',
          [sindicoId, condoId]
        );
      }

      relatorioLogins.push({
        condominio: condoData.nome,
        funcao: 'SÍNDICO',
        nome: condoData.sindico.nome,
        email: condoData.sindico.email,
        senha: condoData.sindico.senha,
        blocoUnidade: 'Administração'
      });

      console.log(`  * Síndico configurado: ${condoData.sindico.email} (ID: ${sindicoId})`);

      // 2.4 Criar os 2 Moradores
      for (const moradorData of condoData.moradores) {
        const hashMorador = await bcrypt.hash(moradorData.senha, 10);
        const blocoId = mapaBlocos[moradorData.bloco];

        const [moradorRows] = await conexao.query(
          'SELECT id FROM usuarios WHERE email = ?',
          [moradorData.email]
        );

        let moradorId;
        if (moradorRows.length > 0) {
          moradorId = moradorRows[0].id;
          await conexao.query(
            `UPDATE usuarios SET 
              nome = ?, senha = ?, perfil = 'MORADOR', id_condominio = ?, 
              id_bloco = ?, bloco = ?, unidade = ?, status_cadastro = 'APROVADO' 
             WHERE id = ?`,
            [moradorData.nome, hashMorador, condoId, blocoId, moradorData.bloco, moradorData.unidade, moradorId]
          );
        } else {
          const [resMorador] = await conexao.query(
            `INSERT INTO usuarios 
              (nome, email, senha, perfil, id_condominio, id_bloco, bloco, unidade, status_cadastro) 
             VALUES (?, ?, ?, 'MORADOR', ?, ?, ?, ?, 'APROVADO')`,
            [moradorData.nome, moradorData.email, hashMorador, condoId, blocoId, moradorData.bloco, moradorData.unidade]
          );
          moradorId = resMorador.insertId;
        }

        relatorioLogins.push({
          condominio: condoData.nome,
          funcao: 'MORADOR',
          nome: moradorData.nome,
          email: moradorData.email,
          senha: moradorData.senha,
          blocoUnidade: `${moradorData.bloco} - Apto ${moradorData.unidade}`
        });

        console.log(`  * Morador configurado: ${moradorData.email} (${moradorData.bloco} - Apto ${moradorData.unidade})`);
      }
    }

    console.log('\nSeed finalizado com sucesso!');
    console.table(relatorioLogins);

    return relatorioLogins;

  } catch (erro) {
    console.error('Erro ao executar seed:', erro);
    throw erro;
  } finally {
    await conexao.end();
  }
}

if (require.main === module) {
  executarSeed()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { executarSeed };
