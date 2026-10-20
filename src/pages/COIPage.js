
import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Activity, AlertTriangle, ArrowDownToLine, Database, RefreshCcw, ShieldAlert, Waves } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, CartesianGrid, Tooltip, XAxis, YAxis, BarChart, Bar } from "recharts";

const BASE = process.env.REACT_APP_BACKEND_URL || "";
const windows = [{ label: "1 hora", value: 1 }, { label: "8 horas", value: 8 }, { label: "24 horas", value: 24 }, { label: "7 dias", value: 168 }];
const fmtTime = (date) => {
  if (!date) return "Sem registro";
  const d = new Date(date);
  return Number.isNaN(d.getTime()) ? "Data inválida" : d.toLocaleString("pt-BR");
};
const Panel = ({ title, children, className = "" }) => <section className={`rounded-md border border-border bg-card p-4 sm:p-5 ${className}`}><h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">{title}</h2>{children}</section>;
const Empty = ({ children }) => <div className="flex min-h-[170px] items-center justify-center border border-dashed border-border p-6 text-center text-sm text-muted-foreground">{children}</div>;
const countLabel = (value) => typeof value === "number" ? value.toLocaleString("pt-BR") : "—";
const qualityOk = (q) => ["GOOD", "OK", "VALID"].includes(String(q || "").toUpperCase());

export default function COIPage() {
  const [overview, setOverview] = useState(null);
  const [tags, setTags] = useState([]);
  const [alarms, setAlarms] = useState([]);
  const [loops, setLoops] = useState([]);
  const [tag, setTag] = useState("");
  const [hours, setHours] = useState(8);
  const [readings, setReadings] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [historyError, setHistoryError] = useState("");
  const fetchOverview = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const results = await Promise.all([
        axios.get(`${BASE}/api/industrial/overview`, { timeout: 12000 }),
        axios.get(`${BASE}/api/industrial/tags`, { timeout: 12000 }),
        axios.get(`${BASE}/api/industrial/alarms`, { timeout: 12000 }),
        axios.get(`${BASE}/api/industrial/loops`, { timeout: 12000 })
      ]);
      setOverview(results[0].data);
      setTags(Array.isArray(results[1].data?.items) ? results[1].data.items : []);
      setAlarms(Array.isArray(results[2].data?.items) ? results[2].data.items : []);
      setLoops(Array.isArray(results[3].data?.items) ? results[3].data.items : []);
    } catch (err) {
      setError("Falha ao consultar o backend industrial. Dados e conexão não confirmados.");
      setOverview(null);
      setTags([]);
      setLoops([]);
      setAlarms([]);
    } finally {
      setBusy(false);
    }
  }, []);
  useEffect(() => {
    fetchOverview();
    const t = window.setInterval(fetchOverview, 30000);
    return () => clearInterval(t);
  }, [fetchOverview]);

  const normalizedTags = useMemo(() => tags.map(t => ({
    id: String(t.tag_id || t.id || t.tag || t.name || ""),
    label: String(t.description || t.name || t.tag || t.tag_id || t.id || ""),
    unit: t.unit || ""
  })).filter(t => t.id), [tags]);

  useEffect(() => {
    if (!normalizedTags.some(t => t.id === tag)) setTag(normalizedTags[0]?.id || "");
  }, [tag, normalizedTags]);

  useEffect(() => {
    let live = true;
    if (!tag) { setReadings([]); setHistoryError(""); return () => { live = false; }; }
    const load = async () => {
      try {
        const r = await axios.get(`${BASE}/api/industrial/history`, {
          params: { tag_id: tag, hours, limit: 1000 }, timeout: 12000
        });
        if (live) { setReadings(Array.isArray(r.data?.items) ? r.data.items : []); setHistoryError(""); }
      } catch (e) {
        if (live) { setReadings([]); setHistoryError("Não foi possível carregar o histórico desta tag."); }
      }
    };
    setReadings([]);
    load();
    const t = window.setInterval(load, 30000);
    return () => { live = false; window.clearInterval(t); };
  }, [tag, hours]);

  const usable = useMemo(() => readings.filter(p =>
    Number.isFinite(p.value) && p.timestamp && !Number.isNaN(new Date(p.timestamp).getTime()) && qualityOk(p.quality)
  ), [readings]);
  const chartData = useMemo(() => usable.map(p => ({
    t: new Date(p.timestamp).getTime(), value: p.value,
    label: fmtTime(p.timestamp), quality: p.quality
  })), [usable]);
  const statistics = useMemo(() => {
    if (!usable.length) return null;
    const values = usable.map(p => p.value);
    return { min: Math.min(...values), max: Math.max(...values),
      avg: values.reduce((sum, v) => sum + v, 0) / values.length,
      last: usable[usable.length - 1]
    };
  }, [usable]);
  const histogram = useMemo(() => {
    if (usable.length < 2) return [];
    const vs = usable.map(p => p.value), min = Math.min(...vs), max = Math.max(...vs);
    if (min === max) return [{ interval: String(min), quantidade: vs.length }];
    const width = (max - min) / 8;
    const bins = Array.from({ length: 8 }, (_, index) => ({
      interval: (min + index * width).toFixed(1), quantidade: 0
    }));
    vs.forEach(v => { bins[Math.min(7, Math.floor((v - min) / width))].quantidade += 1; });
    return bins;
  }, [usable]);
  const activeTag = normalizedTags.find(t => t.id === tag);
  const downloadCSV = () => {
    if (!readings.length) return;
    const safe = s => `"${String(s ?? "").replace(/"/g, '""').replace(/^[=+@-]/, "'$&')}"`;
    const rows = [["Tag", "Data", "Valor", "Unidade", "Qualidade", "Origem"],
      ...readings.map(p => [tag, p.timestamp, p.value, p.unit, p.quality, p.source])];
    const csv = rows.map(row => row.map(safe).join(";")).join("\r\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url; link.download = "coi-historico.csv"; link.click(); URL.revokeObjectURL(url);
  };
  return <main className="mx-auto max-w-[1600px] space-y-4 pb-12">
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[.22em] text-muted-foreground">Usina Ipiranga · Agroindustrial · Açúcar e Álcool</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">COI — Centro de Operações Integrado</h1>
        <p className="mt-1 text-sm text-muted-foreground">Supervisão e tendências do banco industrial · Somente leitura · Sem dados simulados</p>
      </div>
      <button disabled={busy} onClick={fetchOverview} className="inline-flex items-center gap-2 rounded border border-border px-3 py-2 text-sm hover:bg-muted disabled:opacity-50"><RefreshCcw size={16}/> Atualizar</button>
    </div>
    <div role="status" className="flex gap-2 rounded border border-amber-500/40 bg-amber-500/5 p-3 text-sm text-amber-700 dark:text-amber-300">
      <ShieldAlert className="shrink-0" size={20}/>
      <span>Integração PLC/SCADA não homologada. Controle manual e automático não habilitados nesta plataforma. Nenhum comando é enviado à planta.</span>
    </div>
    {error && <div role="alert" className="rounded border border-red-500/40 p-3 text-sm text-red-600">{error}</div>}
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {[
        ["Tags cadastradas", overview?.registered_tags, Database],
        ["Leituras registradas", overview?.recorded_readings, Activity],
        ["Malhas cadastradas", overview?.registered_control_loops, Waves],
        ["Alarmes ativos registrados", overview?.active_alarms, AlertTriangle]
      ].map(([label, value, Icon]) => <div className="rounded border border-border bg-card p-4" key={label}>
        <div className="flex items-center justify-between text-xs text-muted-foreground"><span>{label}</span><Icon size={16}/></div>
        <p className="mt-3 text-2xl font-semibold tabular-nums">{overview ? countLabel(value) : "—"}</p>
      </div>)}
    </div>
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
      <Panel title="Tendência da variável" className="xl:col-span-2">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <select aria-label="Tag industrial" value={tag} onChange={e=>setTag(e.target.value)} className="max-w-full rounded border border-border bg-background px-3 py-2 text-sm">
            {!normalizedTags.length && <option value="">Sem tags cadastradas</option>}
            {normalizedTags.map(t=><option key={t.id} value={t.id}>{t.label || t.id} ({t.id})</option>)}
          </select>
          <select aria-label="Período do histórico" value={hours} onChange={e=>setHours(Number(e.target.value))} className="rounded border border-border bg-background px-3 py-2 text-sm">
            {windows.map(w=><option key={w.value} value={w.value}>{w.label}</option>)}
          </select>
          <button className="inline-flex items-center gap-2 rounded border border-border px-3 py-2 text-sm disabled:opacity-50" onClick={downloadCSV} disabled={!readings.length}><ArrowDownToLine size={15}/> CSV</button>
        </div>
        {historyError && <p role="alert" className="mb-4 text-sm text-red-600">{historyError}</p>}
        {chartData.length ? <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{top:8,right:18,bottom:8,left:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.12}/>
              <XAxis dataKey="t" type="number" domain={["dataMin","dataMax"]} scale="time" tickFormatter={v=>new Date(v).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})} tick={{fontSize:11}}/>
              <YAxis domain={["auto","auto"]} width={56} tick={{fontSize:11}}/>
              <Tooltip labelFormatter={v=>fmtTime(v)} formatter={v=>[v,activeTag?.unit || "Valor"]}/>
              <Line dataKey="value" stroke="#58a6c9" type="linear" dot={chartData.length < 20} isAnimationActive={false} strokeWidth={2}/>
            </LineChart>
          </ResponsiveContainer>
        </div> : <Empty>Nenhuma leitura real válida para esta tag no período selecionado.</Empty>}
        <p className="mt-3 text-xs text-muted-foreground">Gráficos só incluem amostras com qualidade GOOD, OK ou VALID. Leituras inválidas não são substituídas.</p>
      </Panel>
      <Panel title="Detalhes da variável">
        {statistics ? <dl className="space-y-3 text-sm">
          {[["Último valor válido",statistics.last.value],["Mínimo",statistics.min],["Máximo",statistics.max],["Média",statistics.avg]].map(([k,v])=>
            <div className="flex justify-between gap-4 border-b border-border pb-2" key={k}><dt className="text-muted-foreground">{k}</dt><dd className="font-semibold tabular-nums">{Number(v).toLocaleString("pt-BR",{maximumFractionDigits:3})} {activeTag?.unit || ""}</dd></div>)}
          <div><dt className="text-muted-foreground">Última medição válida</dt><dd className="mt-1">{fmtTime(statistics.last.timestamp)}</dd></div>
          <div><dt className="text-muted-foreground">Amostras válidas</dt><dd className="mt-1">{usable.length}</dd></div>
        </dl> : <Empty>Sem amostras válidas. Não é possível calcular indicadores.</Empty>}
      </Panel>
      <Panel title="Distribuição das leituras" className="xl:col-span-2">
        {histogram.length ? <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={histogram}><CartesianGrid strokeDasharray="3 3" opacity={0.12}/><XAxis dataKey="interval" tick={{fontSize:11}}/><YAxis allowDecimals={false} tick={{fontSize:11}}/><Tooltip/><Bar dataKey="quantidade" fill="#5c93a5" isAnimationActive={false}/></BarChart>
          </ResponsiveContainer>
        </div> : <Empty>Distribuição disponível quando houver pelo menos duas leituras reais válidas.</Empty>}
      </Panel>
      <Panel title="Malhas de controle">
        {!loops.length ? <Empty>Nenhuma malha cadastrada pela engenharia.</Empty> :
          <div className="max-h-64 divide-y divide-border overflow-y-auto">{loops.map((l,i)=><div key={l.id || i} className="flex justify-between gap-4 py-3 text-sm">
            <div><p className="font-medium">{l.name || l.id || "Sem nome"}</p><p className="text-xs text-muted-foreground">{l.area || "Área não definida"}</p></div>
            <span className="text-right text-xs text-muted-foreground">{l.mode || "NÃO CONFIGURADO"}<br/>Escrita bloqueada</span>
          </div>)}</div>}
        <p className="mt-3 text-xs text-muted-foreground">Modos manual, supervisório e automático exigem homologação OT. Aqui são apenas consultados.</p>
      </Panel>
      <Panel title="Alarmes industriais" className="xl:col-span-3">
        {!alarms.length ? <Empty>Nenhum registro de alarme industrial disponível. Isso não confirma ausência de falhas na planta.</Empty> :
          <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="text-xs text-muted-foreground"><tr><th className="p-2">Data</th><th className="p-2">Tag</th><th className="p-2">Prioridade</th><th className="p-2">Situação</th><th className="p-2">Descrição</th></tr></thead><tbody>{alarms.map((a,i)=><tr key={a.id || i} className="border-t border-border"><td className="p-2">{fmtTime(a.timestamp)}</td><td className="p-2">{a.tag_id || "—"}</td><td className="p-2">{a.priority || "—"}</td><td className="p-2">{a.state || "—"}</td><td className="p-2">{a.message || "—"}</td></tr>)}</tbody></table></div>}
      </Panel>
    </div>
    <p className="text-xs text-muted-foreground">IPIRANGA INDUSTRIAL INTELLIGENCE · Ambiente web. Dados não disponíveis permanecem indisponíveis. A plataforma não substitui SCADA, PLC, SIS ou intertravamentos industriais.</p>
  </main>;
}
