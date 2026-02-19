import React, { useState, useEffect } from "react";
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
import { toast } from "sonner";
import {
  Plus,
  AlertTriangle,
  Upload,
  FileText,
  Clock,
  Search,
} from "lucide-react";
import { cn, formatDate, getUrgencyColor, getStatusColor } from "../lib/utils";
import { useNavigate } from "react-router-dom";

const API_URL = process.env.REACT_APP_BACKEND_URL;

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

const occurrenceTypes = [
  { value: "entupimento", label: "Entupimento" },
  { value: "falha_dosagem", label: "Falha de Dosagem" },
  { value: "excesso_impurezas", label: "Excesso de Impurezas" },
  { value: "perda_clarificacao", label: "Perda de Clarificação" },
  { value: "vazamento", label: "Vazamento" },
  { value: "temperatura", label: "Problema de Temperatura" },
  { value: "outros", label: "Outros" },
];

const urgencyOptions = [
  { value: "baixa", label: "Baixa" },
  { value: "media", label: "Média" },
  { value: "alta", label: "Alta" },
  { value: "critica", label: "Crítica" },
];

export default function OccurrencesPage() {
  const navigate = useNavigate();
  const [occurrences, setOccurrences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterUrgency, setFilterUrgency] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const [formData, setFormData] = useState({
    equipment: "",
    occurrence_type: "",
    urgency: "",
    description: "",
    photo_base64: null,
  });

  const fetchOccurrences = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/occurrences`);
      setOccurrences(response.data);
    } catch (error) {
      console.error("Error fetching occurrences:", error);
      toast.error("Erro ao carregar ocorrências");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOccurrences();
  }, []);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, photo_base64: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_URL}/api/occurrences`, formData);
      toast.success(`Protocolo ${response.data.protocol} gerado com sucesso!`);
      setShowAddDialog(false);
      setFormData({
        equipment: "",
        occurrence_type: "",
        urgency: "",
        description: "",
        photo_base64: null,
      });
      fetchOccurrences();
    } catch (error) {
      toast.error("Erro ao registrar ocorrência");
      console.error(error);
    }
  };

  const filteredOccurrences = occurrences.filter((occ) => {
    const matchesSearch =
      occ.protocol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      occ.equipment.toLowerCase().includes(searchTerm.toLowerCase()) ||
      occ.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesUrgency = filterUrgency === "all" || occ.urgency === filterUrgency;
    const matchesStatus = filterStatus === "all" || occ.status === filterStatus;
    return matchesSearch && matchesUrgency && matchesStatus;
  });

  return (
    <div data-testid="occurrences-page">
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-tight">
              Ocorrências Industriais
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Registro e acompanhamento de falhas operacionais
            </p>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button data-testid="add-occurrence-btn">
                <Plus className="w-4 h-4 mr-2" />
                Nova Ocorrência
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="font-heading flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  Registrar Nova Ocorrência
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="equipment">Equipamento Afetado *</Label>
                    <Select
                      value={formData.equipment}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, equipment: value }))
                      }
                      required
                    >
                      <SelectTrigger data-testid="select-equipment">
                        <SelectValue placeholder="Selecione o equipamento" />
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
                    <Label htmlFor="occurrence_type">Tipo de Ocorrência *</Label>
                    <Select
                      value={formData.occurrence_type}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, occurrence_type: value }))
                      }
                      required
                    >
                      <SelectTrigger data-testid="select-type">
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {occurrenceTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="urgency">Urgência *</Label>
                  <Select
                    value={formData.urgency}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, urgency: value }))
                    }
                    required
                  >
                    <SelectTrigger data-testid="select-urgency">
                      <SelectValue placeholder="Selecione a urgência" />
                    </SelectTrigger>
                    <SelectContent>
                      {urgencyOptions.map((urg) => (
                        <SelectItem key={urg.value} value={urg.value}>
                          {urg.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição Detalhada *</Label>
                  <Textarea
                    id="description"
                    placeholder="Descreva a ocorrência com o máximo de detalhes possível..."
                    rows={4}
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, description: e.target.value }))
                    }
                    required
                    data-testid="input-description"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="photo">Foto (opcional)</Label>
                  <div className="flex items-center gap-4">
                    <Input
                      id="photo"
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                      data-testid="input-photo"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById("photo").click()}
                      className="w-full"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {formData.photo_base64 ? "Foto selecionada" : "Anexar Foto"}
                    </Button>
                  </div>
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
                      !formData.equipment ||
                      !formData.occurrence_type ||
                      !formData.urgency ||
                      !formData.description
                    }
                    data-testid="submit-occurrence"
                  >
                    Gerar Protocolo
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
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
                    placeholder="Buscar por protocolo, equipamento..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="search-occurrences"
                  />
                </div>
              </div>
              <Select value={filterUrgency} onValueChange={setFilterUrgency}>
                <SelectTrigger className="w-40" data-testid="filter-urgency">
                  <SelectValue placeholder="Urgência" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {urgencyOptions.map((urg) => (
                    <SelectItem key={urg.value} value={urg.value}>
                      {urg.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40" data-testid="filter-status">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="aberta">Aberta</SelectItem>
                  <SelectItem value="andamento">Em Andamento</SelectItem>
                  <SelectItem value="resolvida">Resolvida</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Occurrences Table */}
        <Card>
          <CardHeader>
            <CardTitle className="card-title-industrial">
              Lista de Ocorrências ({filteredOccurrences.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[140px]">Protocolo</TableHead>
                    <TableHead>Equipamento</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Urgência</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Operador</TableHead>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead className="w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOccurrences.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        Nenhuma ocorrência encontrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOccurrences.map((occ) => (
                      <TableRow key={occ.id} data-testid={`occurrence-row-${occ.id}`}>
                        <TableCell className="font-mono font-medium">
                          {occ.protocol}
                        </TableCell>
                        <TableCell>{occ.equipment}</TableCell>
                        <TableCell className="capitalize">
                          {occ.occurrence_type.replace("_", " ")}
                        </TableCell>
                        <TableCell>
                          <Badge className={cn("capitalize", getUrgencyColor(occ.urgency))}>
                            {occ.urgency}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn("capitalize", getStatusColor(occ.status))}>
                            {occ.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{occ.operator_name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {formatDate(occ.timestamp)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/reports?occurrence=${occ.id}`)}
                            data-testid={`view-report-${occ.id}`}
                          >
                            <FileText className="w-4 h-4" />
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
    </div>
  );
}
