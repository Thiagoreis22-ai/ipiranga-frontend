import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Lock, Hash, AlertCircle, Building2, CheckCircle, Info } from "lucide-react";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, needsSetup, setupAdmin, checkSetupStatus } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [setupResult, setSetupResult] = useState(null);

  const [matricula, setMatricula] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    checkSetupStatus();
  }, []);

  const handleSetup = async () => {
    setLoading(true);
    setError("");
    const result = await setupAdmin();
    if (result.success) {
      setSetupResult(result.data);
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await login(matricula, password);
    if (result.success) {
      navigate("/dashboard");
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        backgroundImage: `linear-gradient(to bottom, hsl(222 47% 11% / 0.95), hsl(222 47% 11% / 0.98)), url('https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=2070&auto=format&fit=crop')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
      data-testid="login-page"
    >
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `url('https://www.transparenttextures.com/patterns/carbon-fibre.png')`,
        }}
      />

      <div className="w-full max-w-md relative z-10">
        {/* Logo Header */}
        <div className="text-center mb-8 animate-slide-in">
          <div className="inline-flex items-center justify-center mb-4">
            <img 
              src="/logo-ipiranga.jpg" 
              alt="Ipiranga AI" 
              className="h-20 w-auto object-contain"
            />
          </div>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-white uppercase">
            IPIRANGA AI
          </h1>
          <p className="text-muted-foreground mt-2">
            Inteligência Operacional do Tratamento de Caldo
          </p>
        </div>

        {/* Setup Card - Only shown when no users exist */}
        {needsSetup && !setupResult && (
          <Card className="border-border/50 bg-card/95 backdrop-blur-sm animate-slide-in mb-4">
            <CardHeader className="text-center pb-4">
              <div className="flex items-center justify-center gap-2 text-amber-500 mb-2">
                <Info className="w-5 h-5" />
                <span className="text-sm uppercase tracking-wider font-semibold">
                  Configuração Inicial
                </span>
              </div>
              <CardTitle className="font-heading text-xl">
                Primeiro Acesso
              </CardTitle>
              <CardDescription>
                O sistema precisa de um administrador inicial
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleSetup}
                className="w-full uppercase tracking-wide font-semibold"
                disabled={loading}
                data-testid="setup-btn"
              >
                {loading ? "Criando..." : "Criar Administrador Inicial"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Setup Result */}
        {setupResult && (
          <Alert className="mb-4 border-emerald-500/50 bg-emerald-500/10">
            <CheckCircle className="h-4 w-4 text-emerald-500" />
            <AlertTitle className="text-emerald-500">Administrador Criado!</AlertTitle>
            <AlertDescription className="space-y-2 mt-2">
              <p><strong>Matrícula:</strong> <code className="bg-background/50 px-2 py-1 rounded">{setupResult.matricula}</code></p>
              <p><strong>Senha:</strong> <code className="bg-background/50 px-2 py-1 rounded">{setupResult.senha_inicial}</code></p>
              <p className="text-amber-500 text-sm mt-2">⚠️ {setupResult.aviso}</p>
            </AlertDescription>
          </Alert>
        )}

        {/* Login Card */}
        <Card className="border-border/50 bg-card/95 backdrop-blur-sm animate-slide-in">
          <CardHeader className="text-center pb-4">
            <div className="flex items-center justify-center gap-2 text-muted-foreground mb-2">
              <Building2 className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wider">
                Acesso Industrial
              </span>
            </div>
            <CardTitle className="font-heading text-xl">
              Entrar no Sistema
            </CardTitle>
            <CardDescription>
              Use sua matrícula e senha fornecidas pelo supervisor
            </CardDescription>
          </CardHeader>

          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="matricula">Matrícula</Label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="matricula"
                    type="text"
                    placeholder="Ex: OPR001"
                    className="pl-10 uppercase"
                    value={matricula}
                    onChange={(e) => setMatricula(e.target.value.toUpperCase())}
                    required
                    data-testid="login-matricula"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    data-testid="login-password"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full uppercase tracking-wide font-semibold"
                disabled={loading}
                data-testid="login-submit"
              >
                {loading ? "Entrando..." : "Entrar no Sistema"}
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-border">
              <p className="text-xs text-center text-muted-foreground">
                Não possui acesso? Solicite ao seu supervisor ou líder de turno.
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Sistema de Gestão Industrial - Usinas agroindustrial
        </p>
      </div>
    </div>
  );
}
