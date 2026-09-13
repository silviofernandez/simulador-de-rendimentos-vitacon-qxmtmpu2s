import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'

import { AuthProvider } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import Layout from '@/components/Layout'

import IndexPage from '@/pages/Index'
import SimulacoesPage from '@/pages/Simulacoes'
import DatabasePage from '@/pages/Database'
import MidiasPage from '@/pages/Midias'
import AdminUsuariosPage from '@/pages/AdminUsuarios'
import NovoEmpreendimentoPage from '@/pages/NovoEmpreendimento'
import AuthPage from '@/pages/Auth'
import NotFound from '@/pages/NotFound'

import { listarEmpreendimentos } from '@/services/empreendimentos'
import { EmpreendimentoRecord } from '@/types/simulador'

export default function App() {
  const [empreendimentos, setEmpreendimentos] = useState<EmpreendimentoRecord[]>([])
  const [isLoadingEmpreendimentos, setIsLoadingEmpreendimentos] = useState(true)

  useEffect(() => {
    async function carregarBase() {
      try {
        const data = await listarEmpreendimentos()
        setEmpreendimentos(data)
      } finally {
        setIsLoadingEmpreendimentos(false)
      }
    }
    carregarBase()
  }, [])

  return (
    <BrowserRouter>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner position="top-right" richColors />
          <Routes>
            {/* Rota pública de autenticação */}
            <Route path="/auth" element={<AuthPage />} />

            {/* Simulador e simulações: públicos (link compartilhável, sem login) */}
            <Route element={<Layout />}>
              <Route path="/" element={<IndexPage />} />
              <Route path="/midias" element={<MidiasPage />} />
              <Route path="/simulacoes" element={<SimulacoesPage />} />
            </Route>

            {/* Base de Dados e Área Admin: protegidas */}
            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route
                path="/database"
                element={
                  <DatabasePage
                    empreendimentos={empreendimentos}
                    isLoading={isLoadingEmpreendimentos}
                  />
                }
              />
              <Route
                path="/admin/usuarios"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminUsuariosPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/empreendimentos/novo"
                element={
                  <ProtectedRoute requireAdmin>
                    <NovoEmpreendimentoPage />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Página 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
