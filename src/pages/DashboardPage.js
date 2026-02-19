import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
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
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  Plus,
  Droplets,
  Thermometer,
  Gauge,
  FlaskConical,
  Activity,
  Clock,
} from "lucide-react";
import { formatDate, getParameterStatus } from "../lib/utils";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const parameterConfig = [
  { key: "ph", label: "pH", icon: FlaskConical, unit: "", ideal: "6.8 - 7.2" },
  { key: "brix", label: "Brix", icon: Gauge, unit: "°Bx", ideal: "14 - 18" },
  { key: "pol", label: "Pol", icon: Activity, unit: "%", ideal: "12 - 16" },
  { key: "turbidity", label: "Turbidez", icon: Droplets, unit: "NTU", ideal: "< 500" },
  { key: "temperature", label: "Temperatura", icon: Thermometer, unit: "°C", ideal: "103 - 105" },
  { key: "flow", label: "Vazão", icon: Activity, unit: "m³/h", ideal: "Nominal" },
];

export default function DashboardPage() {
  const [latestParams, setLatestParams] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    ph: "",
    brix: "",
    pol: "",
    turbidity: "",
    temperature: "",
    flow: "",
    shift: "A",
    notes: "",
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [latestRes, statsRes] = await Promise.all([
        axios.get(`${API_URL}/api/parameters/latest`).catch(() => ({ data: null })),
        axios.get(`${API_URL}/api/parameters/stats`),
      ]);
      setLatestParams(latestRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const resetForm = () => {
    setFormData({
      ph: "",
      brix: "",
      pol: "",
      turbidity: "",
      temperature: "",
      flow: "",
      shift: "A",
      notes: "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post(`${API_URL}/api/parameters`, {
        ph: parseFloat(formData.ph),
        brix: parseFloat(formData.brix),
        pol: parseFloat(formData.pol),
        turbidity: parseFloat(formData.turbidity),
        temperature: parseFloat(formData.temperature),
        flow: parseFloat(formData.flow),
        shift: formData.shift,
        notes: formData.notes || null,
      });
      toast.success("Parâmetros registrados com sucesso!");
      setShowAddDialog(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error("Erro ao registrar parâmetros");
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const getTrendIcon = (current, average) => {
    if (!current || !average) return <Minus className="w-4 h-4 text-muted-foreground" />;
    const diff = ((current - average) / average) * 100;
    if (diff > 5) return <TrendingUp className="w-4 h-4 text-emerald-500" />;
    if (diff < -5) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  const getStatusBadge = (param, value) => {
    const status = getParameterStatus(param, value);
    if (status === "ok") return <Badge className="status-ok">Normal</Badge>;
    if (status === "warning") return <Badge className="status-warning">Atenção</Badge>;
    return <Badge className="status-critical">Crítico</Badge>;
  };

  return (
    <div data-testid="dashboard-page">
      <div className="page-header">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-heading text-xl sm:text-2xl font-bold tracking-tight">
              Dashboard de Tratamento
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Visão geral dos parâmetros do caldo
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>
                Atualização: {latestParams ? formatDate(latestParams.timestamp) : "N/A"}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              disabled={loading}
              data-testid="refresh-btn"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
            <Button size="sm" onClick={() => setShowAddDialog(true)} data-testid="add-params-btn">
              <Plus className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Registrar</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="page-content">
        {/* Parameter Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6" data-testid="parameters-grid">
          {parameterConfig.map((param) => {
            const value = latestParams?.[param.key];
            const avgValue = stats?.[`avg_${param.key}`];
            const Icon = param.icon;

            return (
              <Card key={param.key} className="parameter-card" data-testid={`param-card-${param.key}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-sm bg-primary/10 flex items-center justify-center">
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  </div>
                  {value !== undefined && getStatusBadge(param.key, value)}
                </div>
                <div className="space-y-1">
                  <p className="parameter-label text-xs">{param.label}</p>
                  <div className="flex items-end gap-1 sm:gap-2">
                    <span className="text-lg sm:text-2xl font-mono font-semibold" data-testid={`value-${param.key}`}>
                      {value !== undefined ? value.toFixed(1) : "—"}
                    </span>
                    <span className="text-xs sm:text-sm text-muted-foreground mb-0.5">
                      {param.unit}
                    </span>
                    {getTrendIcon(value, avgValue)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Ideal: {param.ideal}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Statistics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="card-title-industrial">Médias do Dia</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {parameterConfig.map((param) => {
                  const avgValue = stats?.[`avg_${param.key}`];
                  return (
                    <div key={param.key} className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
                      <span className="text-xs sm:text-sm text-muted-foreground">{param.label}</span>
                      <span className="font-mono text-xs sm:text-sm font-medium">
                        {avgValue ? avgValue.toFixed(2) : "—"} {param.unit}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total de leituras hoje</span>
                  <span className="font-mono text-lg font-semibold text-primary">
                    {stats?.count || 0}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="card-title-industrial">Status Operacional</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between p-3 rounded-sm bg-emerald-500/10 border border-emerald-500/20">
                  <span className="text-sm font-medium">Sistema</span>
                  <Badge className="status-ok">Online</Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-sm bg-muted">
                  <span className="text-sm font-medium">Turno Atual</span>
                  <span className="font-mono text-sm">
                    {new Date().getHours() < 8 ? "C" : new Date().getHours() < 16 ? "A" : "B"}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-sm bg-muted">
                  <span className="text-sm font-medium">Operador</span>
                  <span className="text-sm">{latestParams?.operator_name || "—"}</span>
                </div>
                {latestParams?.notes && (
                  <div className="p-3 rounded-sm bg-amber-500/10 border border-amber-500/20">
                    <p className="text-xs uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1">
                      Última Observação
                    </p>
                    <p className="text-sm">{latestParams.notes}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Parameters Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">Registrar Novos Parâmetros</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              {parameterConfig.map((param) => (
                <div key={param.key} className="space-y-2">
                  <Label htmlFor={param.key} className="text-xs sm:text-sm">{param.label}</Label>
                  <Input
                    id={param.key}
                    type="number"
                    step="0.1"
                    placeholder={param.ideal}
                    value={formData[param.key]}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, [param.key]: e.target.value }))
                    }
                    required
                    data-testid={`input-${param.key}`}
                  />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="shift">Turno</Label>
                <Select
                  value={formData.shift}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, shift: value }))}
                >
                  <SelectTrigger data-testid="input-shift">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">Turno A (08h - 16h)</SelectItem>
                    <SelectItem value="B">Turno B (16h - 00h)</SelectItem>
                    <SelectItem value="C">Turno C (00h - 08h)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <Input
                  id="notes"
                  placeholder="Opcional"
                  value={formData.notes}
                  onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                  data-testid="input-notes"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting} data-testid="submit-params">
                {submitting ? "Registrando..." : "Registrar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
