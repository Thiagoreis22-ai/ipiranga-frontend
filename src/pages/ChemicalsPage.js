import React, { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
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
  DialogTrigger,
} from "../components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { ScrollArea } from "../components/ui/scroll-area";
import { toast } from "sonner";
import {
  Plus,
  Beaker,
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { formatDate, formatCurrency } from "../lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const chemicalTypes = [
  { value: "cal", label: "Cal", unit: "kg", color: "#3b82f6" },
  { value: "floculante", label: "Floculante", unit: "L", color: "#10b981" },
  { value: "acido", label: "Ácido Fosfórico", unit: "L", color: "#f59e0b" },
  { value: "polimero", label: "Polímero", unit: "kg", color: "#8b5cf6" },
];

const CHART_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"];

export default function ChemicalsPage() {
  const [dosages, setDosages] = useState([]);
  const [stats, setStats] = useState({});
  const [dailyData, setDailyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);

  const [formData, setFormData] = useState({
    chemical_type: "",
    quantity: "",
    unit: "",
    cost_per_unit: "",
    shift: "A",
    notes: "",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dosagesRes, statsRes, dailyRes] = await Promise.all([
        axios.get(`${API_URL}/api/dosage`),
        axios.get(`${API_URL}/api/dosage/stats`),
        axios.get(`${API_URL}/api/dosage/daily`),
      ]);
      setDosages(dosagesRes.data);
      setStats(statsRes.data);
      setDailyData(dailyRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChemicalChange = (value) => {
    const chemical = chemicalTypes.find((c) => c.value === value);
    setFormData((prev) => ({
      ...prev,
      chemical_type: value,
      unit: chemical?.unit || "",
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/dosage`, {
        chemical_type: formData.chemical_type,
        quantity: parseFloat(formData.quantity),
        unit: formData.unit,
        cost_per_unit: parseFloat(formData.cost_per_unit),
        shift: formData.shift,
        notes: formData.notes || null,
      });
      toast.success("Dosagem registrada com sucesso!");
      setShowAddDialog(false);
      setFormData({
        chemical_type: "",
        quantity: "",
        unit: "",
        cost_per_unit: "",
        shift: "A",
        notes: "",
      });
      fetchData();
    } catch (error) {
      toast.error("Erro ao registrar dosagem");
      console.error(error);
    }
  };

  const pieData = Object.entries(stats).map(([type, data]) => ({
    name: chemicalTypes.find((c) => c.value === type)?.label || type,
    value: data.total_cost,
    color: chemicalTypes.find((c) => c.value === type)?.color || "#gray",
  }));

  const totalCost = Object.values(stats).reduce(
    (acc, curr) => acc + (curr.total_cost || 0),
    0
  );

  return (
    <div data-testid="chemicals-page">
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-tight">
              Controle de Dosagem Química
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gerenciamento de insumos do tratamento de caldo
            </p>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button data-testid="add-dosage-btn">
                <Plus className="w-4 h-4 mr-2" />
                Registrar Dosagem
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="font-heading flex items-center gap-2">
                  <Beaker className="w-5 h-5 text-primary" />
                  Registrar Dosagem
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Tipo de Produto *</Label>
                  <Select
                    value={formData.chemical_type}
                    onValueChange={handleChemicalChange}
                    required
                  >
                    <SelectTrigger data-testid="select-chemical">
                      <SelectValue placeholder="Selecione o produto" />
                    </SelectTrigger>
                    <SelectContent>
                      {chemicalTypes.map((chem) => (
                        <SelectItem key={chem.value} value={chem.value}>
                          {chem.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Quantidade *</Label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="0.0"
                      value={formData.quantity}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, quantity: e.target.value }))
                      }
                      required
                      data-testid="input-quantity"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Unidade</Label>
                    <Input value={formData.unit} disabled className="bg-muted" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Custo por Unidade (R$) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.cost_per_unit}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, cost_per_unit: e.target.value }))
                    }
                    required
                    data-testid="input-cost"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Turno *</Label>
                  <Select
                    value={formData.shift}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, shift: value }))
                    }
                  >
                    <SelectTrigger>
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
                  <Label>Observações</Label>
                  <Input
                    placeholder="Opcional"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, notes: e.target.value }))
                    }
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
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
                      !formData.chemical_type ||
                      !formData.quantity ||
                      !formData.cost_per_unit
                    }
                    data-testid="submit-dosage"
                  >
                    Registrar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="page-content">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {chemicalTypes.map((chem) => {
            const data = stats[chem.value] || { total_quantity: 0, total_cost: 0, count: 0 };
            return (
              <Card key={chem.value} data-testid={`card-${chem.value}`}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div
                      className="w-10 h-10 rounded-sm flex items-center justify-center"
                      style={{ backgroundColor: `${chem.color}20` }}
                    >
                      <Beaker className="w-5 h-5" style={{ color: chem.color }} />
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {data.count} registros
                    </Badge>
                  </div>
                  <div className="mt-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                      {chem.label}
                    </p>
                    <p className="text-2xl font-mono font-semibold mt-1">
                      {data.total_quantity?.toFixed(1) || "0"} {chem.unit}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatCurrency(data.total_cost)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="card-title-industrial flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Distribuição de Custos (Hoje)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center">
                {pieData.length > 0 && pieData.some((d) => d.value > 0) ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        dataKey="value"
                        label={({ name, percent }) =>
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Beaker className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum dado de dosagem hoje</p>
                  </div>
                )}
              </div>
              <div className="text-center mt-4 p-3 bg-muted rounded-sm">
                <p className="text-xs text-muted-foreground">Custo Total Hoje</p>
                <p className="text-xl font-mono font-bold text-primary">
                  {formatCurrency(totalCost)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="card-title-industrial flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Consumo por Turno
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dosages.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart
                    data={[
                      {
                        shift: "A",
                        ...Object.fromEntries(
                          chemicalTypes.map((c) => [
                            c.value,
                            dosages
                              .filter((d) => d.shift === "A" && d.chemical_type === c.value)
                              .reduce((acc, d) => acc + d.quantity, 0),
                          ])
                        ),
                      },
                      {
                        shift: "B",
                        ...Object.fromEntries(
                          chemicalTypes.map((c) => [
                            c.value,
                            dosages
                              .filter((d) => d.shift === "B" && d.chemical_type === c.value)
                              .reduce((acc, d) => acc + d.quantity, 0),
                          ])
                        ),
                      },
                      {
                        shift: "C",
                        ...Object.fromEntries(
                          chemicalTypes.map((c) => [
                            c.value,
                            dosages
                              .filter((d) => d.shift === "C" && d.chemical_type === c.value)
                              .reduce((acc, d) => acc + d.quantity, 0),
                          ])
                        ),
                      },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="shift" />
                    <YAxis />
                    <Tooltip />
                    {chemicalTypes.map((chem) => (
                      <Bar
                        key={chem.value}
                        dataKey={chem.value}
                        fill={chem.color}
                        name={chem.label}
                        radius={[4, 4, 0, 0]}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum dado disponível</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Dosage History Table */}
        <Card>
          <CardHeader>
            <CardTitle className="card-title-industrial">
              Histórico de Dosagens
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[300px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead>Quantidade</TableHead>
                    <TableHead>Custo Unitário</TableHead>
                    <TableHead>Custo Total</TableHead>
                    <TableHead>Turno</TableHead>
                    <TableHead>Operador</TableHead>
                    <TableHead>Data/Hora</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dosages.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Nenhuma dosagem registrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    dosages.map((dosage) => {
                      const chemical = chemicalTypes.find(
                        (c) => c.value === dosage.chemical_type
                      );
                      return (
                        <TableRow key={dosage.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: chemical?.color }}
                              />
                              {chemical?.label || dosage.chemical_type}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono">
                            {dosage.quantity} {dosage.unit}
                          </TableCell>
                          <TableCell className="font-mono">
                            {formatCurrency(dosage.cost_per_unit)}
                          </TableCell>
                          <TableCell className="font-mono font-medium">
                            {formatCurrency(dosage.total_cost)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">Turno {dosage.shift}</Badge>
                          </TableCell>
                          <TableCell>{dosage.operator_name}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {formatDate(dosage.timestamp)}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
