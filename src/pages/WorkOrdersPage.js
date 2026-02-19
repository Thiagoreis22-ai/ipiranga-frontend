import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";
import { ScrollArea } from "../components/ui/scroll-area";
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
import { toast } from "sonner";
import {
  ClipboardList,
  Plus,
  Play,
  CheckCircle,
  Clock,
  User,
  AlertTriangle,
  Wrench,
} from "lucide-react";
import { formatDate, cn } from "../lib/utils";
import { useAuth } from "../contexts/AuthContext";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const priorityOptions = [
  { value: "baixa", label: "Baixa", color: "bg-emerald-500/15 text-emerald-600" },
  { value: "media", label: "Média", color: "bg-amber-500/15 text-amber-600" },
  { value: "alta", label: "Alta", color: "bg-orange-500/15 text-orange-600" },
  { value: "urgente", label: "Urgente", color: "bg-red-500/15 text-red-600" },
];

const statusOptions = [
  { value: "pendente", label: "Pendente", color: "bg-amber-500/15 text-amber-600" },
  { value: "em_andamento", label: "Em Andamento", color: "bg-blue-500/15 text-blue-600" },
  { value: "concluida", label: "Concluída", color: "bg-emerald-500/15 text-emerald-600" },
];

const equipmentOptions = [
  "Peneira Rotativa",
  "Tanque de Caldo Misto",
  "Aquecedor Primário",
  "Aquecedor Secundário",
  "Decantador",
  "Filtro Rotativo",
  "Dosador de Cal",
  "Dosador de Floculante",
  "Bomba de Caldo",
  "Trocador de Calor",
  "Flasheador",
  "Outro",
];

export default function WorkOrdersPage() {
  const { isSupervisor, user } = useAuth();
  const [workOrders, setWorkOrders] = useState([]);
  const [operators, setOperators] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [selectedWO, setSelectedWO] = useState(null);
  const [completionNotes, setCompletionNotes] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    equipment: "",
    priority: "media",
    assigned_to: "",
    due_date: "",
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [woRes, statsRes] = await Promise.all([
        axios.get(`${API_URL}/api/work-orders`),
        axios.get(`${API_URL}/api/work-orders/stats/summary`),
      ]);
      setWorkOrders(woRes.data);
      setStats(statsRes.data);

      if (isSupervisor) {
        const opRes = await axios.get(`${API_URL}/api/operators/list`);
        setOperators(opRes.data);
      }
    } catch (error) {
      console.error("Error fetching work orders:", error);
    } finally {
      setLoading(false);
    }
  }, [isSupervisor]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      equipment: "",
      priority: "media",
      assigned_to: "",
      due_date: "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await axios.post(`${API_URL}/api/work-orders`, formData);
      toast.success(`OS ${response.data.os_number} criada com sucesso!`);
      setShowAddDialog(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erro ao criar OS");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStart = async (woId) => {
    try {
      await axios.patch(`${API_URL}/api/work-orders/${woId}/start`);
      toast.success("OS iniciada!");
      fetchData();
    } catch (error) {
      toast.error("Erro ao iniciar OS");
    }
  };

  const handleComplete = async () => {
    if (!selectedWO) return;
    setSubmitting(true);
    try {
      await axios.patch(
        `${API_URL}/api/work-orders/${selectedWO.id}/complete?completion_notes=${encodeURIComponent(completionNotes)}`
      );
      toast.success("OS concluída!");
      setShowCompleteDialog(false);
      setSelectedWO(null);
      setCompletionNotes("");
      fetchData();
    } catch (error) {
      toast.error("Erro ao concluir OS");
    } finally {
      setSubmitting(false);
    }
  };

  const getPriorityBadge = (priority) => {
    const config = priorityOptions.find((p) => p.value === priority);
    return (
      <Badge className={cn("capitalize", config?.color)}>
        {config?.label || priority}
      </Badge>
    );
  };

  const getStatusBadge = (status) => {
    const config = statusOptions.find((s) => s.value === status);
    return (
      <Badge className={cn("capitalize", config?.color)}>
        {config?.label || status}
      </Badge>
    );
  };

  const filteredWOs = workOrders.filter(
    (wo) => filterStatus === "all" || wo.status === filterStatus
  );

  return (
    <div data-testid="work-orders-page">
      <div className="page-header">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-heading text-xl sm:text-2xl font-bold tracking-tight">
              Ordens de Serviço
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isSupervisor ? "Gerenciamento de OS" : "Minhas OS atribuídas"}
            </p>
          </div>
          {isSupervisor && (
            <Button onClick={() => setShowAddDialog(true)} data-testid="add-os-btn">
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Nova OS</span>
              <span className="sm:hidden">Nova</span>
            </Button>
          )}
        </div>
      </div>

      <div className="page-content">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <Card>
            <CardContent className="pt-4 sm:pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    Total
                  </p>
                  <p className="text-xl sm:text-2xl font-mono font-bold mt-1">
                    {stats.total || 0}
                  </p>
                </div>
                <ClipboardList className="w-6 h-6 sm:w-8 sm:h-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 sm:pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    Pendentes
                  </p>
                  <p className="text-xl sm:text-2xl font-mono font-bold mt-1 text-amber-500">
                    {stats.pending || 0}
                  </p>
                </div>
                <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-amber-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 sm:pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    Em Andamento
                  </p>
                  <p className="text-xl sm:text-2xl font-mono font-bold mt-1 text-blue-500">
                    {stats.in_progress || 0}
                  </p>
                </div>
                <Wrench className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 sm:pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    Concluídas
                  </p>
                  <p className="text-xl sm:text-2xl font-mono font-bold mt-1 text-emerald-500">
                    {stats.completed || 0}
                  </p>
                </div>
                <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <div className="mb-4">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {statusOptions.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Work Orders List - Mobile Optimized */}
        <div className="space-y-4">
          {filteredWOs.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma ordem de serviço encontrada</p>
              </CardContent>
            </Card>
          ) : (
            filteredWOs.map((wo) => (
              <Card key={wo.id} className="overflow-hidden" data-testid={`wo-card-${wo.id}`}>
                <CardHeader className="pb-2">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-sm bg-primary/10 flex items-center justify-center shrink-0">
                        <ClipboardList className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base font-mono">
                          {wo.os_number}
                        </CardTitle>
                        <p className="text-sm font-medium mt-1">{wo.title}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-13 sm:ml-0">
                      {getPriorityBadge(wo.priority)}
                      {getStatusBadge(wo.status)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {wo.description}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Equipamento:</span>
                      <p className="font-medium">{wo.equipment}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Atribuído para:</span>
                      <p className="font-medium flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {wo.assigned_to_name}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Criado por:</span>
                      <p className="font-medium">{wo.created_by_name}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Data:</span>
                      <p className="font-medium">{formatDate(wo.created_at)}</p>
                    </div>
                  </div>

                  {wo.completion_notes && (
                    <div className="p-3 bg-emerald-500/10 rounded-sm border border-emerald-500/20">
                      <p className="text-xs text-emerald-600 font-medium mb-1">Observações da conclusão:</p>
                      <p className="text-sm">{wo.completion_notes}</p>
                    </div>
                  )}

                  {/* Actions */}
                  {wo.status !== "concluida" && wo.assigned_to === user?.id && (
                    <div className="flex gap-2 pt-2 border-t">
                      {wo.status === "pendente" && (
                        <Button
                          size="sm"
                          onClick={() => handleStart(wo.id)}
                          className="flex-1"
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Iniciar
                        </Button>
                      )}
                      {wo.status === "em_andamento" && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedWO(wo);
                            setShowCompleteDialog(true);
                          }}
                          className="flex-1"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Concluir
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Create OS Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-primary" />
              Nova Ordem de Serviço
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input
                placeholder="Ex: Manutenção preventiva"
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Descrição *</Label>
              <Textarea
                placeholder="Descreva o serviço a ser realizado..."
                rows={3}
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Equipamento *</Label>
                <Select
                  value={formData.equipment}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, equipment: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {equipmentOptions.map((eq) => (
                      <SelectItem key={eq} value={eq}>
                        {eq}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Prioridade *</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, priority: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorityOptions.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-3 h-3" />
                          {p.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Atribuir para *</Label>
              <Select
                value={formData.assigned_to}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, assigned_to: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o operador" />
                </SelectTrigger>
                <SelectContent>
                  {operators.map((op) => (
                    <SelectItem key={op.id} value={op.id}>
                      <div className="flex items-center gap-2">
                        <User className="w-3 h-3" />
                        {op.name} ({op.matricula})
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddDialog(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={
                  submitting ||
                  !formData.title ||
                  !formData.description ||
                  !formData.equipment ||
                  !formData.assigned_to
                }
              >
                {submitting ? "Criando..." : "Criar OS"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Complete OS Dialog */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              Concluir OS
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Concluindo a ordem de serviço{" "}
              <span className="font-mono font-medium text-foreground">
                {selectedWO?.os_number}
              </span>
            </p>
            <div className="space-y-2">
              <Label>Observações da conclusão</Label>
              <Textarea
                placeholder="Descreva o que foi feito..."
                rows={4}
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCompleteDialog(false);
                  setSelectedWO(null);
                  setCompletionNotes("");
                }}
              >
                Cancelar
              </Button>
              <Button onClick={handleComplete} disabled={submitting}>
                {submitting ? "Concluindo..." : "Confirmar Conclusão"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
