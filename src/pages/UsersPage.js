import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { ScrollArea } from "../components/ui/scroll-area";
import { Switch } from "../components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { toast } from "sonner";
import {
  UserPlus,
  Users,
  Search,
  Key,
  Shield,
  Hash,
} from "lucide-react";
import { formatDate, cn } from "../lib/utils";
import { useAuth } from "../contexts/AuthContext";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const roleOptions = [
  { value: "operator", label: "Operador", color: "bg-blue-500/15 text-blue-600" },
  { value: "supervisor", label: "Supervisor", color: "bg-amber-500/15 text-amber-600" },
  { value: "admin", label: "Administrador", color: "bg-emerald-500/15 text-emerald-600" },
];

const functionOptions = [
  "Operador de Tratamento",
  "Operador de Caldeira",
  "Operador de Evaporação",
  "Líder de Turno",
  "Supervisor de Produção",
  "Engenheiro de Processo",
  "Coordenador de Área",
  "Gerente Industrial",
  "Administrador do Sistema",
];

export default function UsersPage() {
  const { isAdmin, user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    matricula: "",
    sector: "Tratamento de Caldo",
    function: "",
    password: "",
    role: "operator",
  });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/users`);
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Erro ao carregar usuários");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const resetForm = () => {
    setFormData({
      name: "",
      matricula: "",
      sector: "Tratamento de Caldo",
      function: "",
      password: "",
      role: "operator",
    });
  };

  const handleCloseAddDialog = () => {
    setShowAddDialog(false);
    resetForm();
  };

  const handleCloseResetDialog = () => {
    setShowResetDialog(false);
    setSelectedUser(null);
    setNewPassword("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post(`${API_URL}/api/users`, formData);
      toast.success(`Usuário ${formData.matricula} criado com sucesso!`);
      handleCloseAddDialog();
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erro ao criar usuário");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (userId, currentActive) => {
    try {
      await axios.patch(`${API_URL}/api/users/${userId}`, {
        active: !currentActive,
      });
      toast.success(
        currentActive ? "Usuário desativado" : "Usuário ativado"
      );
      fetchUsers();
    } catch (error) {
      toast.error("Erro ao atualizar status");
    }
  };

  const handleOpenResetDialog = (user) => {
    setSelectedUser(user);
    setNewPassword("");
    setShowResetDialog(true);
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error("Senha deve ter pelo menos 6 caracteres");
      return;
    }
    setSubmitting(true);
    try {
      await axios.post(
        `${API_URL}/api/users/${selectedUser.id}/reset-password?new_password=${encodeURIComponent(newPassword)}`
      );
      toast.success("Senha redefinida com sucesso!");
      handleCloseResetDialog();
    } catch (error) {
      toast.error("Erro ao redefinir senha");
    } finally {
      setSubmitting(false);
    }
  };

  const getRoleBadge = (role) => {
    const roleConfig = roleOptions.find((r) => r.value === role);
    return (
      <Badge className={cn("capitalize", roleConfig?.color)}>
        {roleConfig?.label || role}
      </Badge>
    );
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.matricula.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === "all" || u.role === filterRole;
    return matchesSearch && matchesRole;
  });

  return (
    <div data-testid="users-page">
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-tight">
              Gestão de Usuários
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Cadastro e gerenciamento de funcionários
            </p>
          </div>
          <Button onClick={() => setShowAddDialog(true)} data-testid="add-user-btn">
            <UserPlus className="w-4 h-4 mr-2" />
            Cadastrar Funcionário
          </Button>
        </div>
      </div>

      <div className="page-content">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    Total de Usuários
                  </p>
                  <p className="text-2xl font-mono font-bold mt-1">
                    {users.length}
                  </p>
                </div>
                <Users className="w-8 h-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    Operadores
                  </p>
                  <p className="text-2xl font-mono font-bold mt-1">
                    {users.filter((u) => u.role === "operator").length}
                  </p>
                </div>
                <div className="w-8 h-8 rounded-sm bg-blue-500/20 flex items-center justify-center">
                  <Hash className="w-4 h-4 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    Supervisores
                  </p>
                  <p className="text-2xl font-mono font-bold mt-1">
                    {users.filter((u) => u.role === "supervisor").length}
                  </p>
                </div>
                <div className="w-8 h-8 rounded-sm bg-amber-500/20 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-amber-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    Ativos
                  </p>
                  <p className="text-2xl font-mono font-bold mt-1">
                    {users.filter((u) => u.active).length}
                  </p>
                </div>
                <div className="w-8 h-8 rounded-sm bg-emerald-500/20 flex items-center justify-center">
                  <Users className="w-4 h-4 text-emerald-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome ou matrícula..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="search-users"
                  />
                </div>
              </div>
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Nível" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {roleOptions.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle className="card-title-industrial">
              Lista de Funcionários ({filteredUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Matrícula</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Função</TableHead>
                    <TableHead>Nível</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Cadastrado em</TableHead>
                    <TableHead className="w-[150px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center py-8 text-muted-foreground"
                      >
                        Nenhum usuário encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((u) => (
                      <TableRow key={u.id} data-testid={`user-row-${u.id}`}>
                        <TableCell className="font-mono font-medium">
                          {u.matricula}
                        </TableCell>
                        <TableCell>{u.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {u.function}
                        </TableCell>
                        <TableCell>{getRoleBadge(u.role)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={u.active}
                              onCheckedChange={() =>
                                handleToggleActive(u.id, u.active)
                              }
                              disabled={u.id === currentUser?.id}
                            />
                            <span
                              className={cn(
                                "text-xs",
                                u.active
                                  ? "text-emerald-500"
                                  : "text-muted-foreground"
                              )}
                            >
                              {u.active ? "Ativo" : "Inativo"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(u.created_at)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenResetDialog(u)}
                          >
                            <Key className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Add User Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Cadastrar Novo Funcionário
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nome Completo *</Label>
              <Input
                placeholder="Nome do funcionário"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                required
                data-testid="input-name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Matrícula *</Label>
                <Input
                  placeholder="Ex: OPR001"
                  value={formData.matricula}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      matricula: e.target.value.toUpperCase(),
                    }))
                  }
                  required
                  className="uppercase"
                  data-testid="input-matricula"
                />
              </div>
              <div className="space-y-2">
                <Label>Setor</Label>
                <Input
                  value={formData.sector}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, sector: e.target.value }))
                  }
                  data-testid="input-sector"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Função *</Label>
              <Select
                value={formData.function}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, function: value }))
                }
              >
                <SelectTrigger data-testid="input-function">
                  <SelectValue placeholder="Selecione a função" />
                </SelectTrigger>
                <SelectContent>
                  {functionOptions.map((func) => (
                    <SelectItem key={func} value={func}>
                      {func}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Nível de Acesso *</Label>
              <Select
                value={formData.role}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, role: value }))
                }
              >
                <SelectTrigger data-testid="input-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions
                    .filter((r) => isAdmin || r.value === "operator")
                    .map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4" />
                          {role.label}
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Senha Inicial *</Label>
              <Input
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={formData.password}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, password: e.target.value }))
                }
                required
                minLength={6}
                data-testid="input-password"
              />
              <p className="text-xs text-muted-foreground">
                O funcionário deverá alterar a senha no primeiro acesso
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseAddDialog}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={
                  submitting ||
                  !formData.name ||
                  !formData.matricula ||
                  !formData.function ||
                  !formData.password
                }
                data-testid="submit-user"
              >
                {submitting ? "Criando..." : "Cadastrar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading flex items-center gap-2">
              <Key className="w-5 h-5 text-primary" />
              Redefinir Senha
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Defina uma nova senha para{" "}
              <span className="font-medium text-foreground">
                {selectedUser?.name}
              </span>{" "}
              ({selectedUser?.matricula})
            </p>
            <div className="space-y-2">
              <Label>Nova Senha</Label>
              <Input
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={handleCloseResetDialog}>
                Cancelar
              </Button>
              <Button onClick={handleResetPassword} disabled={submitting}>
                {submitting ? "Redefinindo..." : "Redefinir"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
