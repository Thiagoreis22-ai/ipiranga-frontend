import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { ScrollArea } from "../components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { toast } from "sonner";
import { FileText, Download, Printer, QrCode, Clock, Check } from "lucide-react";
import { formatDate, getUrgencyColor } from "../lib/utils";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { QRCodeSVG } from "qrcode.react";

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function ReportsPage() {
  const [searchParams] = useSearchParams();
  const [occurrences, setOccurrences] = useState([]);
  const [selectedOccurrence, setSelectedOccurrence] = useState(null);
  const [loading, setLoading] = useState(true);
  const reportRef = useRef(null);

  const preselectedId = searchParams.get("occurrence");

  useEffect(() => {
    fetchOccurrences();
  }, []);

  useEffect(() => {
    if (preselectedId && occurrences.length > 0) {
      const occ = occurrences.find((o) => o.id === preselectedId);
      if (occ) setSelectedOccurrence(occ);
    }
  }, [preselectedId, occurrences]);

  const fetchOccurrences = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/occurrences`);
      setOccurrences(response.data);
    } catch (error) {
      console.error("Error fetching occurrences:", error);
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = async () => {
    if (!reportRef.current || !selectedOccurrence) return;

    toast.loading("Gerando PDF...");

    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${selectedOccurrence.protocol}.pdf`);

      toast.dismiss();
      toast.success("PDF gerado com sucesso!");
    } catch (error) {
      toast.dismiss();
      toast.error("Erro ao gerar PDF");
      console.error(error);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div data-testid="reports-page">
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-tight">
              Relatórios Oficiais
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Geração de documentos para auditoria e rastreabilidade
            </p>
          </div>
          {selectedOccurrence && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-2" />
                Imprimir
              </Button>
              <Button onClick={generatePDF} data-testid="generate-pdf-btn">
                <Download className="w-4 h-4 mr-2" />
                Exportar PDF
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="page-content">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Occurrence Selector */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="card-title-industrial">
                Selecionar Ocorrência
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={selectedOccurrence?.id || ""}
                onValueChange={(id) => {
                  const occ = occurrences.find((o) => o.id === id);
                  setSelectedOccurrence(occ);
                }}
              >
                <SelectTrigger data-testid="select-occurrence">
                  <SelectValue placeholder="Selecione uma ocorrência" />
                </SelectTrigger>
                <SelectContent>
                  {occurrences.map((occ) => (
                    <SelectItem key={occ.id} value={occ.id}>
                      {occ.protocol} - {occ.equipment}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedOccurrence && (
                <div className="mt-4 space-y-3">
                  <div className="p-3 rounded-sm bg-muted">
                    <p className="text-xs text-muted-foreground mb-1">Protocolo</p>
                    <p className="font-mono font-semibold">{selectedOccurrence.protocol}</p>
                  </div>
                  <div className="p-3 rounded-sm bg-muted">
                    <p className="text-xs text-muted-foreground mb-1">Equipamento</p>
                    <p className="font-medium">{selectedOccurrence.equipment}</p>
                  </div>
                  <div className="p-3 rounded-sm bg-muted">
                    <p className="text-xs text-muted-foreground mb-1">Urgência</p>
                    <Badge className={getUrgencyColor(selectedOccurrence.urgency)}>
                      {selectedOccurrence.urgency}
                    </Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Report Preview */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="card-title-industrial flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Prévia do Relatório
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[600px]">
                {selectedOccurrence ? (
                  <div
                    ref={reportRef}
                    className="pdf-preview m-4"
                    data-testid="report-preview"
                  >
                    {/* PDF Header */}
                    <div className="pdf-header">
                      <div className="flex justify-between items-start">
                        <div>
                          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                            IPIRANGA AI
                          </h1>
                          <p className="text-sm text-slate-600">
                            Inteligência Operacional do Tratamento de Caldo
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-500 uppercase tracking-wider">
                            Relatório de Ocorrência
                          </p>
                          <p className="text-lg font-mono font-bold text-slate-900">
                            {selectedOccurrence.protocol}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Info Section */}
                    <div className="pdf-section">
                      <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-3 border-b pb-2">
                        Informações Gerais
                      </h2>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-slate-500">Setor</p>
                          <p className="font-medium text-slate-900">Tratamento de Caldo</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Equipamento</p>
                          <p className="font-medium text-slate-900">
                            {selectedOccurrence.equipment}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Tipo de Ocorrência</p>
                          <p className="font-medium text-slate-900 capitalize">
                            {selectedOccurrence.occurrence_type.replace("_", " ")}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Urgência</p>
                          <p className="font-medium text-slate-900 capitalize">
                            {selectedOccurrence.urgency}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Data/Hora</p>
                          <p className="font-medium text-slate-900">
                            {formatDate(selectedOccurrence.timestamp)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Operador</p>
                          <p className="font-medium text-slate-900">
                            {selectedOccurrence.operator_name}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Description Section */}
                    <div className="pdf-section">
                      <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-3 border-b pb-2">
                        Descrição da Ocorrência
                      </h2>
                      <p className="text-slate-900 leading-relaxed">
                        {selectedOccurrence.description}
                      </p>
                    </div>

                    {/* Parameters Snapshot */}
                    {selectedOccurrence.parameters_snapshot && (
                      <div className="pdf-section">
                        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-3 border-b pb-2">
                          Parâmetros no Momento da Ocorrência
                        </h2>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="p-2 bg-slate-50 rounded">
                            <p className="text-xs text-slate-500">pH</p>
                            <p className="font-mono font-semibold">
                              {selectedOccurrence.parameters_snapshot.ph?.toFixed(1) || "N/A"}
                            </p>
                          </div>
                          <div className="p-2 bg-slate-50 rounded">
                            <p className="text-xs text-slate-500">Brix</p>
                            <p className="font-mono font-semibold">
                              {selectedOccurrence.parameters_snapshot.brix?.toFixed(1) || "N/A"}°Bx
                            </p>
                          </div>
                          <div className="p-2 bg-slate-50 rounded">
                            <p className="text-xs text-slate-500">Pol</p>
                            <p className="font-mono font-semibold">
                              {selectedOccurrence.parameters_snapshot.pol?.toFixed(1) || "N/A"}%
                            </p>
                          </div>
                          <div className="p-2 bg-slate-50 rounded">
                            <p className="text-xs text-slate-500">Turbidez</p>
                            <p className="font-mono font-semibold">
                              {selectedOccurrence.parameters_snapshot.turbidity?.toFixed(0) || "N/A"} NTU
                            </p>
                          </div>
                          <div className="p-2 bg-slate-50 rounded">
                            <p className="text-xs text-slate-500">Temperatura</p>
                            <p className="font-mono font-semibold">
                              {selectedOccurrence.parameters_snapshot.temperature?.toFixed(1) || "N/A"}°C
                            </p>
                          </div>
                          <div className="p-2 bg-slate-50 rounded">
                            <p className="text-xs text-slate-500">Vazão</p>
                            <p className="font-mono font-semibold">
                              {selectedOccurrence.parameters_snapshot.flow?.toFixed(1) || "N/A"} m³/h
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Photo */}
                    {selectedOccurrence.photo_url && (
                      <div className="pdf-section">
                        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-3 border-b pb-2">
                          Registro Fotográfico
                        </h2>
                        <img
                          src={selectedOccurrence.photo_url}
                          alt="Foto da ocorrência"
                          className="max-w-full h-auto max-h-48 rounded border"
                        />
                      </div>
                    )}

                    {/* Signatures */}
                    <div className="pdf-signature-line grid grid-cols-2 gap-8">
                      <div className="text-center">
                        <div className="border-b border-slate-400 mb-2 pb-8"></div>
                        <p className="text-sm text-slate-600">Assinatura do Operador</p>
                        <p className="text-xs text-slate-500">{selectedOccurrence.operator_name}</p>
                      </div>
                      <div className="text-center">
                        <div className="border-b border-slate-400 mb-2 pb-8"></div>
                        <p className="text-sm text-slate-600">Assinatura do Supervisor</p>
                        <p className="text-xs text-slate-500">Nome: ________________</p>
                      </div>
                    </div>

                    {/* QR Code */}
                    <div className="mt-8 flex justify-between items-end">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">QR Code de Rastreio</p>
                        <QRCodeSVG
                          value={`IPIRANGA-AI:${selectedOccurrence.protocol}`}
                          size={80}
                        />
                      </div>
                      <div className="text-right text-xs text-slate-500">
                        <p>Documento gerado automaticamente</p>
                        <p>IPIRANGA AI v1.0.0</p>
                        <p>{new Date().toLocaleString("pt-BR")}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full py-12 text-muted-foreground">
                    <FileText className="w-12 h-12 mb-4 opacity-50" />
                    <p>Selecione uma ocorrência para visualizar o relatório</p>
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
