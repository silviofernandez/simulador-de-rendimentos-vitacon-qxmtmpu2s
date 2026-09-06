import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Lock, Mail, User, CheckCircle2 } from 'lucide-react'

export default function AuthPage() {
  const { login, register, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/'

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, navigate, from])

  // Login state
  const [loginEmail, setLoginEmail] = useState('gabsilvio@gmail.com')
  const [loginPassword, setLoginPassword] = useState('Skip@Pass')
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)

  // Register state
  const [registerName, setRegisterName] = useState('')
  const [registerEmail, setRegisterEmail] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [registerLoading, setRegisterLoading] = useState(false)
  const [registerError, setRegisterError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError(null)

    if (!loginEmail || !loginPassword) {
      setLoginError('Por favor preencha email e senha.')
      return
    }

    try {
      setLoginLoading(true)
      await login(loginEmail, loginPassword)
      navigate(from, { replace: true })
    } catch (err: unknown) {
      console.error(err)
      setLoginError('Credenciais inválidas. Verifique seu e-mail e senha.')
    } finally {
      setLoginLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setRegisterError(null)

    if (!registerName || !registerEmail || !registerPassword) {
      setRegisterError('Por favor preencha todos os campos.')
      return
    }

    if (registerPassword.length < 8) {
      setRegisterError('A senha deve possuir pelo menos 8 caracteres.')
      return
    }

    try {
      setRegisterLoading(true)
      await register(registerName, registerEmail, registerPassword)
      navigate(from, { replace: true })
    } catch (err: unknown) {
      console.error(err)
      setRegisterError('Erro ao criar conta. Este e-mail já pode estar em uso.')
    } finally {
      setRegisterLoading(false)
    }
  }

  return (
    <div className="flex min-h-[85vh] items-center justify-center py-10 px-4">
      <div className="w-full max-w-md">
        {/* Brand header */}
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0F6B4F] text-white shadow-xl shadow-[#0F6B4F]/25 mb-4">
            <span className="font-bold text-2xl tracking-wider">V</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1F2A24]">
            Vitacon <span className="text-[#0F6B4F]">Rentabilidade</span>
          </h1>
          <p className="mt-1 text-sm text-[#5E6E64]">
            Simulador de investimentos e rendimentos em Studios
          </p>
        </div>

        {/* Auth Card */}
        <Card className="border-[#E3DFD6] shadow-xl shadow-black/5 rounded-2xl overflow-hidden bg-white">
          <CardHeader className="bg-[#F7F5F1]/50 border-b border-[#E3DFD6] pb-4">
            <CardTitle className="text-lg font-semibold text-[#1F2A24]">
              Acesso ao Sistema
            </CardTitle>
            <CardDescription className="text-xs text-[#5E6E64]">
              Entre com suas credenciais ou crie um novo acesso de investidor
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-[#F7F5F1] p-1 rounded-xl mb-6">
                <TabsTrigger
                  value="login"
                  className="rounded-lg text-xs font-semibold data-[state=active]:bg-[#0F6B4F] data-[state=active]:text-white transition-all"
                >
                  Entrar
                </TabsTrigger>
                <TabsTrigger
                  value="register"
                  className="rounded-lg text-xs font-semibold data-[state=active]:bg-[#0F6B4F] data-[state=active]:text-white transition-all"
                >
                  Criar conta
                </TabsTrigger>
              </TabsList>

              {/* Tab: Entrar */}
              <TabsContent value="login" className="space-y-4 focus-visible:outline-none">
                {loginError && (
                  <Alert
                    variant="destructive"
                    className="py-2.5 bg-red-50 text-[#C62828] border-red-200 rounded-xl text-xs"
                  >
                    <AlertDescription>{loginError}</AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="login-email" className="text-xs font-semibold text-[#1F2A24]">
                      E-mail
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-[#5E6E64]" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="seu@email.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="pl-10 h-12 rounded-xl border-[#E3DFD6] focus-visible:ring-[#0F6B4F]"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="login-pass" className="text-xs font-semibold text-[#1F2A24]">
                      Senha
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-[#5E6E64]" />
                      <Input
                        id="login-pass"
                        type="password"
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="pl-10 h-12 rounded-xl border-[#E3DFD6] focus-visible:ring-[#0F6B4F]"
                        required
                      />
                    </div>
                  </div>

                  <div className="rounded-xl bg-[#0F6B4F]/5 p-3 border border-[#0F6B4F]/15 flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-[#0F6B4F] mt-0.5 shrink-0" />
                    <div className="text-[11px] text-[#1F2A24]">
                      <span className="font-semibold text-[#0F6B4F]">
                        Usuário de teste inicial:
                      </span>
                      <br />
                      E-mail:{' '}
                      <code className="bg-white px-1 py-0.5 rounded border border-[#0F6B4F]/20">
                        gabsilvio@gmail.com
                      </code>
                      <br />
                      Senha:{' '}
                      <code className="bg-white px-1 py-0.5 rounded border border-[#0F6B4F]/20">
                        Skip@Pass
                      </code>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loginLoading}
                    className="w-full h-12 rounded-xl bg-[#0F6B4F] hover:bg-[#0B5740] text-white font-medium shadow-md shadow-[#0F6B4F]/20 transition-all"
                  >
                    {loginLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Autenticando...
                      </>
                    ) : (
                      'Entrar no Simulador'
                    )}
                  </Button>
                </form>
              </TabsContent>

              {/* Tab: Criar Conta */}
              <TabsContent value="register" className="space-y-4 focus-visible:outline-none">
                {registerError && (
                  <Alert
                    variant="destructive"
                    className="py-2.5 bg-red-50 text-[#C62828] border-red-200 rounded-xl text-xs"
                  >
                    <AlertDescription>{registerError}</AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="reg-name" className="text-xs font-semibold text-[#1F2A24]">
                      Nome Completo
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-3.5 h-4 w-4 text-[#5E6E64]" />
                      <Input
                        id="reg-name"
                        type="text"
                        placeholder="Ex: João Silva"
                        value={registerName}
                        onChange={(e) => setRegisterName(e.target.value)}
                        className="pl-10 h-12 rounded-xl border-[#E3DFD6] focus-visible:ring-[#0F6B4F]"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="reg-email" className="text-xs font-semibold text-[#1F2A24]">
                      E-mail
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-[#5E6E64]" />
                      <Input
                        id="reg-email"
                        type="email"
                        placeholder="seu@email.com"
                        value={registerEmail}
                        onChange={(e) => setRegisterEmail(e.target.value)}
                        className="pl-10 h-12 rounded-xl border-[#E3DFD6] focus-visible:ring-[#0F6B4F]"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="reg-pass" className="text-xs font-semibold text-[#1F2A24]">
                      Senha (mínimo 8 caracteres)
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-[#5E6E64]" />
                      <Input
                        id="reg-pass"
                        type="password"
                        placeholder="••••••••"
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
                        className="pl-10 h-12 rounded-xl border-[#E3DFD6] focus-visible:ring-[#0F6B4F]"
                        required
                        minLength={8}
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={registerLoading}
                    className="w-full h-12 rounded-xl bg-[#0F6B4F] hover:bg-[#0B5740] text-white font-medium shadow-md shadow-[#0F6B4F]/20 transition-all"
                  >
                    {registerLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Criando Conta...
                      </>
                    ) : (
                      'Cadastrar e Acessar'
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
