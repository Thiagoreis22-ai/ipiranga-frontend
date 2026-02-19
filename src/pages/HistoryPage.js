import React, { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { ScrollArea } from "../components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Calendar } from "../components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover";
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
  History,
  Search,
  Calendar as CalendarIcon,
  Filter,
  Download,
  FileText,
  Beaker,
  Gauge,
  AlertTriangle,
} from "lucide-react";
import { cn, formatDate, getUrgencyColor, getStatusColor } from "../lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const entityTypes = [
  { value: "all", label: "Todos", icon: History },
  { value: "occurrence", label: "Ocorrências", icon: AlertTriangle },
  { value: "parameter", label: "Parâmetros", icon: Gauge },
  { value: "dosage", label: "Dosagens", icon: Beaker },
];

export default function HistoryPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [entityType, setEntityType] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (entityType !== "all") params.append("entity_type", entityType);
      if (startDate) params.append("start_date", startDate.toISOString());
      if (endDate) params.append("end_date", endDate.toISOString());

      const response = await axios.get(`${API_URL}/api/audit/logs?${params}`);
      setLogs(response.data);
    } catch (error) {
      console.error("Error fetching logs:", error);
      toast.error("Erro ao carregar histórico");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [entityType, startDate, endDate]);

  const filteredLogs = logs.filter((log) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      log.protocol?.toLowerCase().includes(searchLower) ||
      log.equipment?.toLowerCase().includes(searchLower) ||
      log.operator_name?.toLowerCase().includes(searchLower) ||
      log.chemical_type?.toLowerCase().includes(searchLower) ||
      log.description?.toLowerCase().includes(searchLower)
    );
  });

  const getEntityIcon = (type) => {
    switch (type) {
      case "occurrence":
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case "parameter":
        return <Gauge className="w-4 h-4 text-blue-500" />;
      case "dosage":
        return <Beaker className="w-4 h-4 text-emerald-500" />;
      default:
        return <FileText className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getEntityLabel = (type) => {
    const entity = entityTypes.find((e) => e.value === type);
    return entity?.label || type;
  };

  const renderLogDetails = (log) => {
    switch (log.entity_type) {
      case "occurrence":
        return (
          <div className="space-y-1">
            <p className="font-mono font-medium">{log.protocol}</p>
            <p className="text-sm text-muted-foreground">{log.equipment}</p>
            <div className="flex gap-2 mt-2">
              <Badge className={cn("capitalize text-xs", getUrgencyColor(log.urgency))}>
                {log.urgency}
              </Badge>
              <Badge className={cn("capitalize text-xs", getStatusColor(log.status))}>
                {log.status}
              </Badge>
            </div>
          </div>
        );
      case "parameter":
        return (
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">pH:</span>{" "}
              <span className="font-mono">{log.ph?.toFixed(1)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Brix:</span>{" "}
              <span className="font-mono">{log.brix?.toFixed(1)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Turbidez:</span>{" "}
              <span className="font-mono">{log.turbidity?.toFixed(0)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Temp:</span>{" "}
              <span className="font-mono">{log.temperature?.toFixed(1)}°C</span>
            </div>
            <div>
              <span className="text-muted-foreground">Turno:</span>{" "}
              <span className="font-mono">{log.shift}</span>
            </div>
          </div>
        );
      case "dosage":
        return (
          <div className="space-y-1">
            <p className="font-medium capitalize">{log.chemical_type}</p>
            <p className="text-sm">
              <span className="font-mono">{log.quantity}</span> {log.unit} -{" "}
              <span className="text-muted-foreground">
                R$ {log.total_cost?.toFixed(2)}
              </span>
            </p>
            <Badge variant="outline" className="text-xs">
              Turno {log.shift}
            </Badge>
          </div>
        );
      default:
        return <p className="text-muted-foreground">Detalhes não disponíveis</p>;
    }
  };

  const exportToCSV = () => {
    const headers = ["Tipo", "Data/Hora", "Operador", "Detalhes"];
    const rows = filteredLogs.map((log) => [
      getEntityLabel(log.entity_type),
      formatDate(log.timestamp),
      log.operator_name,
      log.protocol || log.chemical_type || `pH: ${log.ph}`,
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `historico_ipiranga_${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    toast.success("Exportação concluída!");
  };

  return (
    <div data-testid="history-page">
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-tight">
              Histórico e Auditoria
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Registro completo de todas as operações
            </p>
          </div>
          <Button variant="outline" onClick={exportToCSV} data-testid="export-csv">
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      <div className="page-content">
        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por protocolo, operador, equipamento..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="search-history"
                  />
                </div>
              </div>

              <Select value={entityType} onValueChange={setEntityType}>
                <SelectTrigger className="w-44" data-testid="filter-entity">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  {entityTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <type.icon className="w-4 h-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-44" data-testid="filter-start-date">
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    {startDate
                      ? format(startDate, "dd/MM/yyyy")
                      : "Data Início"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-44" data-testid="filter-end-date">
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    {endDate ? format(endDate, "dd/MM/yyyy") : "Data Fim"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>

              {(startDate || endDate) && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setStartDate(null);
                    setEndDate(null);
                  }}
                >
                  Limpar Filtros
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle className="card-title-industrial flex items-center justify-between">
              <span className="flex items-center gap-2">
                <History className="w-4 h-4" />
                Registros ({filteredLogs.length})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">Tipo</TableHead>
                    <TableHead className="w-[180px]">Data/Hora</TableHead>
                    <TableHead>Detalhes</TableHead>
                    <TableHead className="w-[150px]">Operador</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center py-12 text-muted-foreground"
                      >
                        <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Nenhum registro encontrado</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLogs.map((log, index) => (
                      <TableRow key={log.id || index} data-testid={`log-row-${index}`}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getEntityIcon(log.entity_type)}
                            <span className="text-sm">
                              {getEntityLabel(log.entity_type)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {formatDate(log.timestamp)}
                          </span>
                        </TableCell>
                        <TableCell>{renderLogDetails(log)}</TableCell>
                        <TableCell>
                          <span className="text-sm">{log.operator_name}</span>
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
    </div>
  );
}
