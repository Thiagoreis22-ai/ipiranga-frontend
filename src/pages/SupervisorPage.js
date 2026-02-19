import React, { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { ScrollArea } from "../components/ui/scroll-area";
import { Progress } from "../components/ui/progress";
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
  BarChart3,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity,
  Gauge,
} from "lucide-react";
import { cn, formatDate, getUrgencyColor } from "../lib/utils";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function SupervisorPage() {
  const [dashboardData, setDashboardData] = useState(null);
  const [weeklyTrends, setWeeklyTrends] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dashRes, trendsRes] = await Promise.all([
        axios.get(`${API_URL}/api/supervisor/dashboard`),
        axios.get(`${API_URL}/api/supervisor/weekly-trends`),
      ]);
      setDashboardData(dashRes.data);
      setWeeklyTrends(trendsRes.data.reverse());
    } catch (error) {
      console.error("Error fetching supervisor data:", error);
      if (error.response?.status === 403) {
        toast.error("Acesso restrito a supervisores");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Activity className="w-8 h-8 animate-pulse mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="supervisor-page">
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-tight">
              Dashboard do Supervisor
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gestão completa do tratamento de caldo
            </p>
          </div>
          <Badge variant="outline" className="gap-2">
            <Activity className="w-4 h-4" />
            Atualização em tempo real
          </Badge>
        </div>
      </div>

      <div className="page-content">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    Eficiência do Tratamento
                  </p>
                  <p className="text-3xl font-mono font-bold mt-2">
                    {dashboardData?.efficiency || 0}%
                  </p>
                </div>
                <div
                  className={cn(
                    "w-12 h-12 rounded-sm flex items-center justify-center",
                    dashboardData?.efficiency >= 80
                      ? "bg-emerald-500/20"
                      : dashboardData?.efficiency >= 60
                      ? "bg-amber-500/20"
                      : "bg-red-500/20"
                  )}
                >
                  <Gauge
                    className={cn(
                      "w-6 h-6",
                      dashboardData?.efficiency >= 80
                        ? "text-emerald-500"
                        : dashboardData?.efficiency >= 60
                        ? "text-amber-500"
                        : "text-red-500"
                    )}
                  />
                </div>
              </div>
              <Progress value={dashboardData?.efficiency || 0} className="mt-4" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    Ocorrências Críticas
                  </p>
                  <p className="text-3xl font-mono font-bold mt-2">
                    {dashboardData?.critical_occurrences?.length || 0}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-sm bg-red-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Requerem atenção imediata
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    Desvios por Turno
                  </p>
                  <div className="flex gap-4 mt-2">
                    {["A", "B", "C"].map((shift) => (
                      <div key={shift} className="text-center">
                        <p className="text-lg font-mono font-semibold">
                          {dashboardData?.shifts?.[shift] || 0}
                        </p>
                        <p className="text-xs text-muted-foreground">T{shift}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="w-12 h-12 rounded-sm bg-primary/20 flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    Leituras Hoje
                  </p>
                  <p className="text-3xl font-mono font-bold mt-2">
                    {dashboardData?.parameter_trends?.length || 0}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-sm bg-emerald-500/20 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-emerald-500" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Parâmetros registrados
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* pH Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="card-title-industrial flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Tendência de pH (7 dias)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {weeklyTrends.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={weeklyTrends}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis
                      dataKey="_id"
                      tickFormatter={(date) =>
                        new Date(date).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                        })
                      }
                    />
                    <YAxis domain={[6, 8]} />
                    <Tooltip
                      labelFormatter={(date) =>
                        new Date(date).toLocaleDateString("pt-BR")
                      }
                      formatter={(value) => [value?.toFixed(2), "pH"]}
                    />
                    <Line
                      type="monotone"
                      dataKey="avg_ph"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                    {/* Reference lines for ideal range */}
                    <Line
                      type="monotone"
                      dataKey={() => 6.8}
                      stroke="#10b981"
                      strokeDasharray="5 5"
                      strokeWidth={1}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey={() => 7.2}
                      stroke="#10b981"
                      strokeDasharray="5 5"
                      strokeWidth={1}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  Sem dados disponíveis
                </div>
              )}
            </CardContent>
          </Card>

          {/* Turbidity Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="card-title-industrial flex items-center gap-2">
                <TrendingDown className="w-4 h-4" />
                Tendência de Turbidez (7 dias)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {weeklyTrends.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={weeklyTrends}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis
                      dataKey="_id"
                      tickFormatter={(date) =>
                        new Date(date).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                        })
                      }
                    />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(date) =>
                        new Date(date).toLocaleDateString("pt-BR")
                      }
                      formatter={(value) => [value?.toFixed(0) + " NTU", "Turbidez"]}
                    />
                    <Bar
                      dataKey="avg_turbidity"
                      fill="#f59e0b"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  Sem dados disponíveis
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Failures */}
          <Card>
            <CardHeader>
              <CardTitle className="card-title-industrial flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Ranking de Falhas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dashboardData?.top_failures?.length > 0 ? (
                <div className="space-y-4">
                  {dashboardData.top_failures.map((failure, index) => (
                    <div
                      key={failure.type}
                      className="flex items-center justify-between p-3 rounded-sm bg-muted"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-mono font-bold text-muted-foreground">
                          #{index + 1}
                        </span>
                        <span className="font-medium capitalize">
                          {failure.type?.replace("_", " ")}
                        </span>
                      </div>
                      <Badge variant="outline" className="font-mono">
                        {failure.count} ocorrências
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma falha registrada</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Critical Occurrences */}
          <Card>
            <CardHeader>
              <CardTitle className="card-title-industrial flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                Ocorrências Críticas Abertas
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[300px]">
                {dashboardData?.critical_occurrences?.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Protocolo</TableHead>
                        <TableHead>Equipamento</TableHead>
                        <TableHead>Urgência</TableHead>
                        <TableHead>Data</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dashboardData.critical_occurrences.map((occ) => (
                        <TableRow key={occ.id}>
                          <TableCell className="font-mono font-medium">
                            {occ.protocol}
                          </TableCell>
                          <TableCell>{occ.equipment}</TableCell>
                          <TableCell>
                            <Badge className={cn("capitalize", getUrgencyColor(occ.urgency))}>
                              {occ.urgency}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {formatDate(occ.timestamp)}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <CheckCircle className="w-12 h-12 mx-auto mb-4 text-emerald-500 opacity-50" />
                    <p>Nenhuma ocorrência crítica aberta</p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
