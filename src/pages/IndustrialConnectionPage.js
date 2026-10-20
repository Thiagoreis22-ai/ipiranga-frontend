import React, { useEffect, useState } from "react";
import axios from "axios";
import { Activity, ShieldCheck, ServerOff, RefreshCcw } from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const labels = [
  ["integration_status", "Conexão PLC / SCADA"],
  ["telemetry_status", "Telemetria"],
  ["ai_analysis_status", "Análise por IA"],
];

function translate(value) {
  if (value === "NOT_CONFIGURED") return "NÃO CONFIGURADO";
  if (value === "NO_REAL_DATA") return "SEM DADOS REAIS";
  if (value === "ONLINE") return "ONLINE";
  if (value === null || value === undefined) return "NÃO INFORMADO";
  return String(value);
}

export default function IndustrialConnectionPage() {
  const [status, setStatus] = useState(null);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function refresh() {
    setLoading(true);
    setError("");
    try {
      const [state, catalog] = await Promise.all([
        axios.get(`${API_URL}/api/industrial/status`, { timeout: 10000 }),
        axios.get(`${API_URL}/api/industrial/tags`, { timeout: 10000 }),
      ]);
      setStatus(state.data);
      setTags(Array.isArray(catalog.data?.items) ? catalog.data.items : []);
    } catch (e) {
      setStatus(null);
      setTags([]);
      setError("Não foi possível consultar a API industrial. Verifique o servidor e a comunicação.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    const timer = window.setInterval(refresh, 30000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-2 pb-10">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Usina Ipiranga Agroindustrial · Açúcar e Álcool
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Conexão industrial</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Monitoramento real. Não existem valores artificiais nesta tela.
          </p>
        </div>
        <button type="button" onClick={refresh} disabled={loading}
          className="inline-flex items-center gap-2 rounded border border-border px-4 py-2 text-sm hover:bg-muted disabled:opacity-50">
          <RefreshCcw size={15} aria-hidden="true" /> Atualizar
        </button>
      </header>

      {error && (
        <section role="alert" className="rounded border border-red-500/40 bg-red-500/5 p-4 text-sm text-red-700 dark:text-red-300">
          <ServerOff className="mb-2" size={22} aria-hidden="true" />
          {error}
        </section>
      )}
      {!error && loading && !status && <p role="status">Consultando o servidor...</p>}

      {status && (
        <>
          <section className="rounded border border-amber-500/30 bg-amber-500/5 p-5">
            <div className="flex items-start gap-3">
              <Activity size={22} className="mt-0.5 text-amber-600" aria-hidden="true" />
              <div>
                <h2 className="font-semibold">Aguardando conexão industrial autorizada</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  O sistema não possui conexão confirmada com CLP/SCADA nesta fase.
                  Nenhum setpoint ou equipamento pode ser comandado pela plataforma.
                </p>
              </div>
            </div>
          </section>
          <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {labels.map(([key, label]) => (
              <div className="rounded border border-border bg-card p-4" key={key}>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
                <div className="mt-2 text-lg font-medium">{translate(status[key])}</div>
              </div>
            ))}
          </section>
          <section className="rounded border border-border bg-card p-5">
            <h2 className="mb-3 text-base font-semibold">Equipamentos e tags cadastrados</h2>
            {tags.length ? (
              <ul className="divide-y divide-border">
                {tags.map((tag, index) => (
                  <li key={tag.id || tag.name || index} className="py-2 text-sm">
                    {tag.name || tag.tag || "Tag sem identificação"}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nenhuma tag industrial cadastrada. A engenharia deverá mapear as tags reais da planta.
              </p>
            )}
          </section>
          <footer className="flex items-start gap-2 text-xs text-muted-foreground">
            <ShieldCheck size={16} aria-hidden="true" />
            <p>Controle automático e escrita em PLC permanecem desabilitados. A integração exige revisão de engenharia e segurança OT.</p>
          </footer>
        </>
      )}
    </main>
  );
}
