import React from 'react';
import { Navigate } from 'react-router-dom';
import { obterPerfil } from '../services/authApi';

// Sem login vai para /login; com login mas sem o perfil exigido volta para /condominios.
export default function RotaProtegida({ perfis, children }) {
  const perfil = obterPerfil();
  if (!perfil) return <Navigate to="/login" replace />;
  if (perfis && !perfis.includes(perfil)) return <Navigate to="/condominios" replace />;
  return children;
}
