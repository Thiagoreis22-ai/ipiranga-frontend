import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, BarChart, Bar, Legend
} from "recharts";

const API = process.env.REACT_APP_BACKEND_URL;

const dateLabel = (stamp) => stamp ? new Date(stamp).toLocaleString("pt-BR", {
  timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit",
  hour: "2-digit", minute: "2-digit", second: "2-digit"
}) : "—";

const compactTime = (stamp) => stamp ? new Date(stamp).toLocaleTimeString("pt-BR", {
  timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit"
}) : "—";

export function DownloadCsv({ tag, points }) {
  const download = () => {
    const rows = [["tag", "data_hora_iso", "valor", "unidade", "qualidade"], ...points.map(p => [
      tag.code, p.observed_at, p.value, tag.unit || "", p.quality
    ])];
    const csv = "\uFEFF" + rows.map(row => row.map(v => `"${String(v ?? "").replaceAll('"','""')}"`).join(";")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `historico_${tag.code}_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };
  return <button type="button" onClick={download} disabled={!points.length} className="ind-button ind-button-quiet">
    Exportar CSV
  </button>;
}

export function TrendChart({ tag, hours = 24, compact = false, refreshKey = 0 }) {
  const [data, setData] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [truncated, setTruncated] = useState(false);
  const load = useCallback(async (cancelled) => {
    if (!tag) {
      setData([]);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await axios.get(`${API}/api/ops/trends/${encodeURIComponent(tag.id)}`, {
        params: { hours }, timeout: 12000
      });
      if (cancelled()) return;
      const rows = (result.data.points || []).map(p => ({
        ...p, plot: p.quality === "GOOD" ? p.value : null,
        unix: Date.parse(p.observed_at)
      }));
      setData(rows);
      setTruncated(Boolean(result.data.truncated));
    } catch (err) {
      if (!cancelled()) {
        setData([]);
        setError(err.response?.data?.detail || "Não foi possível consultar o histórico.");
      }
    } finally {
      if (!cancelled()) setLoading(false);
    }
  }, [tag?.id, hours, refreshKey]);

  useEffect(() => {
    let unmounted = false;
    load(() => unmounted);
    return () => { unmounted = true; };
  }, [load]);

  if (!tag) return <div className="ind-empty ind-chart-empty">Selecione uma tag real cadastrada para ver a tendência.</div>;
  return (
    <div className="ind-trend">
      <div className="ind-chart-head">
        <div>
          <b>{tag.code}</b><span className="ind-dim"> · {tag.name} {tag.unit && `(${tag.unit})`}</span>
        </div>
        <DownloadCsv tag={tag} points={data} />
      </div>
      {loading && <p className="ind-small">Consultando histórico real...</p>}
      {error && <p role="alert" className="ind-error">{error}</p>}
      {!loading && !error && !data.some(p => p.quality === "GOOD") && (
        <div className="ind-empty ind-chart-empty">Nenhuma medição real válida no período selecionado.</div>
      )}
      {!loading && !error && data.some(p => p.quality === "GOOD") && (
        <div style={{ height: compact ? 205 : 310, width: "100%" }}>
          <ResponsiveContainer>
            <LineChart data={data} margin={{ top: 10, right: 12, bottom: 3, left: 1 }}>
              <CartesianGrid stroke="#273443" strokeDasharray="3 6" vertical={false} />
              <XAxis dataKey="unix" tick={{ fontSize: 10, fill: "#a4b2bf" }} tickFormatter={v => compactTime(v)} type="number" domain={["dataMin","dataMax"]} scale="time" />
              <YAxis domain={["auto","auto"]} width={54} tick={{ fontSize: 10, fill: "#a4b2bf" }} />
              <Tooltip labelFormatter={v => dateLabel(v)} formatter={(value) => [`${value} ${tag.unit || ""}`, "PV real"]} contentStyle={{ background: "#121d29", color:"#f4f8fa", border:"1px solid #344657", borderRadius:4 }} />
              {tag.warning_high !== null && tag.warning_high !== undefined && <ReferenceLine y={tag.warning_high} stroke="#d8ab59" strokeDasharray="4 3" />}
              {tag.warning_low !== null && tag.warning_low !== undefined && <ReferenceLine y={tag.warning_low} stroke="#d8ab59" strokeDasharray="4 3" />}
              <Line type="linear" dataKey="plot" name="PV" stroke="#74bcad" dot={false} strokeWidth={2} isAnimationActive={false} connectNulls={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      {truncated && <p className="ind-small ind-warning">A consulta atingiu o limite de 1.500 pontos. Reduza o período para consultar o histórico integral.</p>}
      <div className="ind-chart-foot">Medições provenientes do gateway autenticado · {hours}h · Dados com qualidade GOOD</div>
    </div>
  );
}

export function AlarmBars({ alarms = [] }) {
  const counts = ["CRITICO", "ATENCAO"].map(severity => ({
    severity: severity === "CRITICO" ? "Crítico" : "Atenção",
    count: alarms.filter(a => a.severity === severity && a.state === "OPEN").length
  }));
  if (!alarms.some(a => a.state === "OPEN")) return <div className="ind-empty">Nenhum alarme industrial aberto registrado.</div>;
  return (
    <div style={{ height: 205 }}>
      <ResponsiveContainer>
        <BarChart data={counts} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
          <CartesianGrid stroke="#273443" vertical={false} />
          <XAxis dataKey="severity" tick={{ fontSize: 11, fill: "#a4b2bf" }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#a4b2bf" }} />
          <Tooltip contentStyle={{ background: "#121d29", color:"#f4f8fa", border:"1px solid #344657" }} />
          <Bar dataKey="count" name="Alarmes reais" fill="#d1a363" radius={[2,2,0,0]} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
