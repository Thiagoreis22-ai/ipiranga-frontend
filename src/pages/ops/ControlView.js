import React, { useState } from "react";
import axios from "axios";
import { ShieldAlert, Lock, SlidersHorizontal, ArrowRight, ClipboardCheck } from "lucide-react";
import { TrendChart } from "./OperationsCharts";

const API=process.env.REACT_APP_BACKEND_URL;
const options=[
  {id:"MANUAL",title:"MANUAL",text:"Operador responsável. A aplicação não escreve comandos físicos."},
  {id:"SUPERVISORIO",title:"SUPERVISÓRIO",text:"Análise e recomendações. Aplicação física bloqueada."},
  {id:"AUTOMATICO",title:"AUTOMÁTICO",text:"Modo pretendido para comissionamento futuro. Não executa ações nesta versão."}
];
function fmt(v,unit=""){
  if(v===null || v===undefined || !Number.isFinite(Number(v)))return "SEM DADO";
  return `${Number(v).toLocaleString("pt-BR",{maximumFractionDigits:3})} ${unit}`;
}

function LoopCard({loop,catalog,telemetry,role,refresh}){
  const tags=catalog.tags||[];
  const pv=tags.find(t=>t.id===loop.pv_tag_id);
  const sp=tags.find(t=>t.id===loop.sp_tag_id);
  const mv=tags.find(t=>t.id===loop.mv_tag_id);
  const [mode,setMode]=useState(loop.requested_mode||"MANUAL");
  const [reason,setReason]=useState("");
  const [error,setError]=useState("");
  const [message,setMessage]=useState("");
  const [saving,setSaving]=useState(false);
  const canPlan=["admin","supervisor"].includes(role);
  const value=tag=>tag?telemetry[tag.id]:null;
  const valid=tag=>value(tag)?.valid_now===true;
  const render=tag=><strong className="ind-value">{valid(tag)?fmt(value(tag).value,tag.unit):"SEM DADO ATUAL"}</strong>;
  const update=async()=>{
    setError("");setMessage("");
    if(reason.trim().length<10){setError("Informe uma justificativa de pelo menos 10 caracteres.");return;}
    const approved=window.confirm("Confirmar apenas o REGISTRO do modo pretendido? Esta operação NÃO altera o PLC nem ativa controle automático.");
    if(!approved)return;
    setSaving(true);
    try{
      const response=await axios.post(`${API}/api/ops/loops/${encodeURIComponent(loop.id)}/requested-mode`,{
        requested_mode:mode,justification:reason.trim()
      },{timeout:12000});
      setMessage(response.data.message||"Registro atualizado. Nenhum comando físico foi executado.");
      setReason("");
      await refresh();
    }catch(e){setError(e.response?.data?.detail||"Falha ao registrar o modo no servidor.");}
    finally{setSaving(false);}
  };
  return <article className="ind-panel ind-block">
    <div className="ind-section-head">
      <div>
        <div className="ind-eyebrow">{loop.code}</div>
        <h2>{loop.name}</h2>
      </div>
      <span className="ind-pill warn"><Lock size={12}/> NÃO COMISSIONADO · ESCRITA BLOQUEADA</span>
    </div>
    <div className="ind-metrics">
      {[["PV",pv],["SP",sp],["MV",mv]].map(([label,tag])=>
        <div className="ind-metric" key={label}>
          <label>{label} {tag?.code&&`· ${tag.code}`}</label>
          {render(tag)}
          <p className="ind-small">{tag?valid(tag)?"Leitura real, atual":"Sem leitura válida":"Tag não vinculada"}</p>
        </div>
      )}
    </div>
    <div className="ind-divider"/>
    <h3 className="ind-panel-title"><SlidersHorizontal size={14} style={{display:"inline",marginRight:7}}/>
      Configuração do modo pretendido
    </h3>
    <div className="ind-mode-grid">
      {options.map(item=><button type="button" className={`ind-mode-option ${mode===item.id?"active":""}`}
        key={item.id} onClick={()=>setMode(item.id)} disabled={!canPlan}>
        <strong>{item.title}</strong><span>{item.text}</span>
      </button>)}
    </div>
    <div className="ind-inline" style={{marginTop:13}}>
      <span className="ind-pill">CADASTRO: {loop.requested_mode||"MANUAL"}</span>
      <ArrowRight size={16}/>
      <span className="ind-pill danger">MODO EFETIVO: NÃO COMISSIONADO</span>
    </div>
    {canPlan ? <>
      <div className="ind-field" style={{marginTop:15}}>
        <label>Justificativa técnica obrigatória para registrar mudança</label>
        <textarea className="ind-textarea" value={reason} onChange={e=>setReason(e.target.value)} placeholder="Explique por que a engenharia deseja esse modo. Não será enviado comando ao equipamento."/>
      </div>
      <button type="button" className="ind-button" onClick={update} disabled={saving||mode===loop.requested_mode} style={{marginTop:10}}>
        {saving?"Registrando...":"Registrar modo pretendido"}
      </button>
    </>:<p className="ind-small">Somente supervisão/administrador pode registrar planos de modo de controle.</p>}
    {error && <p className="ind-error" role="alert">{error}</p>}
    {message && <p className="ind-pill ok" role="status"><ClipboardCheck size={14}/>{message}</p>}
    {pv && <div className="ind-block">
      <h3 className="ind-panel-title">Tendência real da variável controlada · 8h</h3>
      <TrendChart tag={pv} hours={8} compact/>
    </div>}
  </article>;
}
export default function ControlView({catalog,telemetry,role,refresh}){
  const loops=catalog.loops||[];
  return <div className="ind-block">
    <div className="ind-section-head">
      <div><h2>Controle de processo · Manual / Supervisório / Automático</h2>
      <p>Malhas configuradas e tendências PV / SP / MV; escrita em equipamentos desabilitada.</p></div>
      <span className="ind-pill danger"><Lock size={14}/> 0 COMANDOS FÍSICOS HABILITADOS</span>
    </div>
    <div className="ind-info ind-alert"><ShieldAlert size={14} style={{display:"inline",marginRight:7}}/>
      IMPORTANTE: os seletores abaixo registram somente o modo pretendido no banco. Não ativam PID/IA,
      não mudam setpoints no PLC e não devem ser usados como substitutos das IHMs.
      A habilitação real exige integração, intertravamentos, análise de risco e aprovação da engenharia.
    </div>
    {loops.length ? loops.map(loop=>
      <LoopCard key={loop.id} loop={loop} catalog={catalog} telemetry={telemetry} role={role} refresh={refresh} />)
      : <div className="ind-empty ind-block">Nenhuma malha industrial cadastrada. Cadastre áreas, tags reais e uma malha em Engenharia.</div>}
  </div>;
}
