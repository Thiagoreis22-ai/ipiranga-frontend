import React, { useState } from "react";
import axios from "axios";
import { BrainCircuit, ShieldAlert, Info, Bot, Lock } from "lucide-react";
import { TrendChart } from "./OperationsCharts";

const API=process.env.REACT_APP_BACKEND_URL;

export default function AIView({status,catalog,role}){
  const tags=catalog.tags||[];
  const [tagId,setTagId]=useState("");
  const [analysis,setAnalysis]=useState(null);
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(false);
  const configured=Boolean(status?.ai_analysis_configured);
  const chosen=tags.find(t=>t.id===tagId);
  const permitted=["admin","supervisor"].includes(role);
  const analyze=async()=>{
    if(!chosen||!configured||!permitted)return;
    if(!window.confirm("A análise enviará até 30 medições reais desta tag a um provedor externo de IA configurado pela usina. Confirma o compartilhamento autorizado?"))return;
    setAnalysis(null);setError("");setLoading(true);
    try{
      const res=await axios.post(`${API}/api/ops/ai/analyze`,{tag_id:tagId},{timeout:35000});
      setAnalysis(res.data);
    }catch(e){setError(e.response?.data?.detail||"Falha ao conectar com o serviço de análise de IA.");}
    finally{setLoading(false);}
  };
  return <div className="ind-block">
    <div className="ind-section-head">
      <div><h2>Inteligência industrial · Análise técnica</h2>
      <p>Arquitetura para análise de tendências reais, sem respostas fictícias e sem comandos de equipamentos.</p></div>
      <span className={`ind-pill ${configured?"ok":"warn"}`}><BrainCircuit size={14}/>
      {configured?"PROVEDOR DE IA CONFIGURADO":"IA AINDA NÃO CONFIGURADA"}</span>
    </div>
    <div className="ind-grid two">
      <section className="ind-panel">
        <h3 className="ind-panel-title">Módulo analítico</h3>
        <p className="ind-section-intro">A análise utiliza somente leituras históricas reais da tag selecionada.
          É necessário configurar servidor, chave de API e autorização formal para compartilhar dados industriais.</p>
        <div className="ind-field">
          <label>Variável industrial a analisar</label>
          <select className="ind-select" value={tagId} onChange={e=>{setTagId(e.target.value);setAnalysis(null);}}>
            <option value="">Selecione uma tag real</option>
            {tags.map(t=><option key={t.id} value={t.id}>{t.code} · {t.name}</option>)}
          </select>
        </div>
        <button type="button" className="ind-button" style={{marginTop:13}}
          onClick={analyze} disabled={!configured||!permitted||!tagId||loading}>
          <Bot size={14} style={{display:"inline",marginRight:6}}/>
          {loading?"Analisando medições...":"Gerar análise real por IA"}
        </button>
        {!configured && <div className="ind-info ind-alert ind-block">
          <Lock size={15} style={{display:"inline",marginRight:8}}/>
          Provedor não configurado ou envio de dados não autorizado. A IA permanecerá indisponível em vez de inventar análises.
        </div>}
        {!permitted && <p className="ind-small">A execução de análises externas exige perfil supervisor ou administrador.</p>}
        {error && <p className="ind-error" role="alert">{error}</p>}
        {analysis && <div className="ind-panel ind-block" role="status">
          <div className="ind-eyebrow">Resultado real recebido do provedor</div>
          <p className="ind-section-intro" style={{whiteSpace:"pre-wrap",marginTop:12}}>{analysis.analysis}</p>
          <div className="ind-small">Medições analisadas: {analysis.samples_count} · {analysis.generated_at}</div>
        </div>}
      </section>
      <section className="ind-panel">
        <h3 className="ind-panel-title">Tendência de referência</h3>
        {chosen?<TrendChart tag={chosen} hours={8}/>:<div className="ind-empty">Escolha a variável para visualizar as medições reais disponíveis.</div>}
        <div className="ind-info ind-block">
          <Info size={14} style={{display:"inline",marginRight:8}}/>
          Respostas de IA são análises auxiliares, não instruções autorizadas. Toda decisão operacional continua subordinada às normas da usina.
        </div>
      </section>
    </div>
    <div className="ind-info ind-alert ind-block">
      <ShieldAlert size={15} style={{display:"inline",marginRight:7}}/>
      Controle automático por IA, previsão operacional avançada, manutenção preditiva e otimização ainda dependem de modelos validados, conectores industriais e comissionamento. Não serão apresentados como ativos nesta versão.
    </div>
  </div>;
}
