import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Activity, Factory, ChartNoAxesCombined, Gauge, Database, SlidersHorizontal,
  BellRing, BrainCircuit, Wrench, ScrollText, RefreshCcw, LockKeyhole,
  Layers, Network, ShieldAlert, CircleAlert, Radar, ClipboardList
} from "lucide-react";
import { BarChart, Bar, ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import { useAuth } from "../contexts/AuthContext";
import { AlarmBars, TrendChart } from "./ops/OperationsCharts";
import EngineeringView from "./ops/EngineeringView";
import ControlView from "./ops/ControlView";
import AIView from "./ops/AIView";
import "./ops/industrial.css";

const API=process.env.REACT_APP_BACKEND_URL || "";
const emptyCatalog={areas:[],equipment:[],tags:[],loops:[]};
const tabs=[
  ["coi","COI · Visão geral",Factory],
  ["trends","Gráficos e tendências",ChartNoAxesCombined],
  ["tanks","Tanques e níveis",Gauge],
  ["equipment","Equipamentos",Wrench],
  ["control","Manual / Automático",SlidersHorizontal],
  ["alarms","Alarmes",BellRing],
  ["engineering","Engenharia",Database],
  ["ai","Inteligência artificial",BrainCircuit],
  ["audit","Auditoria",ScrollText]
];
const formatNumber = value => Number(value).toLocaleString("pt-BR",{maximumFractionDigits:2});
const dateBR = value => {
  if(!value)return "—";
  const time=new Date(value);
  if(!Number.isFinite(time.getTime()))return "—";
  return time.toLocaleString("pt-BR",{timeZone:"America/Sao_Paulo"});
};
function Placeholder({children}){return <div className="ind-empty">{children}</div>}
function Badge({children,tone=""}){return <span className={`ind-pill ${tone}`}>{children}</span>}
function Metric({title,value,subtitle}){
  return <div className="ind-kpi"><div className="ind-kpi-label">{title}</div>
    <div className="ind-kpi-number">{value ?? "—"}</div><div className="ind-kpi-foot">{subtitle}</div></div>;
}
function RealReading({tag,telemetry,compact=false}){
  const reading=tag&&telemetry[tag.id];
  if(!tag)return <span className="ind-dim">TAG NÃO CADASTRADA</span>;
  if(!reading||!reading.valid_now)return <span className="ind-pill warn">SEM DADO ATUAL</span>;
  return <span className={compact?"ind-mono":"ind-value"}>
    {formatNumber(reading.value)} {tag.unit||""}
  </span>;
}
function SectorBars({catalog}){
  const rows=(catalog.areas||[]).map(area=>({
    name:area.code,
    equipment:(catalog.equipment||[]).filter(eq=>eq.area_id===area.id).length,
    tags:(catalog.tags||[]).filter(t=>t.area_id===area.id).length
  }));
  if(!rows.length)return <Placeholder>Nenhuma área cadastrada para gerar o gráfico de inventário.</Placeholder>;
  return <div style={{width:"100%",height:240}}>
    <ResponsiveContainer>
      <BarChart data={rows} margin={{left:-17,right:15,top:10,bottom:3}}>
        <CartesianGrid stroke="#293b49" vertical={false} strokeDasharray="3 6"/>
        <XAxis dataKey="name" tick={{fill:"#a5bac5",fontSize:10}} interval={0}/>
        <YAxis allowDecimals={false} tick={{fill:"#a5bac5",fontSize:10}}/>
        <Tooltip contentStyle={{background:"#172431",color:"#f4f8fb",border:"1px solid #486071"}}/>
        <Bar name="Equipamentos cadastrados" dataKey="equipment" fill="#5c9e9d" isAnimationActive={false}/>
        <Bar name="Tags cadastradas" dataKey="tags" fill="#a4afc1" isAnimationActive={false}/>
      </BarChart>
    </ResponsiveContainer>
  </div>;
}
function Overview({catalog,overview,telemetry,alarms,status,refresh,openSector}){
  const tags=catalog.tags||[];
  const selected=tags.slice(0,4);
  const areas=catalog.areas||[];
  const alarmOpen=(alarms||[]).filter(a=>a.state==="OPEN");
  return <div>
    <div className="ind-section-head">
      <div><h2>Centro Integrado de Operações</h2>
      <p>Dados reais cadastrados e telemetria recebida; nenhuma medição demonstrativa.</p></div>
      <Badge tone="warn"><LockKeyhole size={13}/> CONTROLE FÍSICO BLOQUEADO</Badge>
    </div>
    <div className="ind-grid four">
      <Metric title="Áreas cadastradas" value={overview?.counts?.industrial_areas ?? "—"} subtitle="cadastro real de engenharia"/>
      <Metric title="Equipamentos" value={overview?.counts?.industrial_equipment ?? "—"} subtitle="inventário cadastrado"/>
      <Metric title="Tags atualizadas" value={overview?.tags_with_current_data ?? "—"} subtitle={`de ${overview?.counts?.industrial_tags ?? "—"} tags cadastradas`}/>
      <Metric title="Alarmes em aberto" value={overview ? Object.values(overview.open_alarms||{}).reduce((a,b)=>a+b,0) : "—"} subtitle="gerados por medições válidas"/>
    </div>
    <section className="ind-block">
      <div className="ind-section-head"><h2>Áreas de processo</h2><span className="ind-small">Selecione uma área para visualizar equipamentos</span></div>
      {areas.length?
        <div className="ind-cards">
          {areas.map(area=><button type="button" key={area.id} onClick={()=>openSector(area.id)}
            className="ind-equip" style={{textAlign:"left",cursor:"pointer"}}>
            <div className="ind-equip-head"><span className="ind-eyebrow">{area.code}</span><Layers size={16}/></div>
            <h3 style={{marginTop:11}}>{area.name}</h3>
            <p>{catalog.equipment.filter(eq=>eq.area_id===area.id).length} equipamentos · {tags.filter(t=>t.area_id===area.id).length} tags</p>
          </button>)}
        </div> : <Placeholder>Sem áreas cadastradas. A engenharia deve incluir os setores reais da unidade.</Placeholder>}
    </section>
    <div className="ind-grid two ind-block">
      <section className="ind-panel"><h3 className="ind-panel-title">Distribuição por área · equipamentos e tags</h3>
        <SectorBars catalog={catalog}/>
      </section>
      <section className="ind-panel"><h3 className="ind-panel-title">Alarmes industriais por prioridade</h3>
        <AlarmBars alarms={alarmOpen}/>
        <div className="ind-small">Contagem somente de eventos gerados por tags cadastradas.</div>
      </section>
    </div>
    <section className="ind-block">
      <div className="ind-section-head"><h2>Tendências operacionais · histórico real</h2><p>Primeiras tags cadastradas; abra Gráficos para escolher outras variáveis</p></div>
      <div className="ind-grid two">
        {[0,1,2,3].map(i=><section className="ind-panel" key={i}>
          <h3 className="ind-panel-title">TENDÊNCIA {String(i+1).padStart(2,"0")}</h3>
          <TrendChart tag={selected[i]} hours={8} compact/>
        </section>)}
      </div>
    </section>
    <section className="ind-panel ind-block">
      <h3 className="ind-panel-title">Qualidade e origem da telemetria</h3>
      <div className="ind-grid three">
        <div className="ind-metric"><label>Última amostra recebida</label><strong className="ind-mono">{dateBR(status?.last_reading_at)}</strong></div>
        <div className="ind-metric"><label>Tags sem dado atual</label><strong className="ind-value">{overview?.tags_without_current_data ?? "—"}</strong></div>
        <div className="ind-metric"><label>PLC verificado</label><strong className="ind-pill warn">NÃO CONFIRMADO</strong></div>
      </div>
      <button className="ind-button ind-button-quiet" onClick={refresh} style={{marginTop:15}}>Atualizar leituras</button>
    </section>
  </div>;
}
function Trends({catalog}){
  const [hours,setHours]=useState(24);
  const [chosen,setChosen]=useState(["","","",""]);
  const tags=catalog.tags||[];
  return <div>
    <div className="ind-section-head"><div><h2>Historiador e tendências</h2>
      <p>Consulte até quatro séries independentes, com limites de atenção e exportação CSV.</p></div>
      <div className="ind-field"><label>Intervalo</label>
        <select value={hours} className="ind-select" onChange={e=>setHours(Number(e.target.value))}>
          <option value={1}>Última hora</option><option value={8}>8 horas</option>
          <option value={24}>24 horas</option><option value={168}>7 dias</option><option value={720}>30 dias</option>
        </select></div>
    </div>
    <div className="ind-grid two">
      {[0,1,2,3].map(index=>{
        const tagId=chosen[index]||tags[index]?.id||"";
        const tag=tags.find(t=>t.id===tagId);
        return <section className="ind-panel" key={index}>
          <div className="ind-field" style={{marginBottom:13}}>
            <label>Gráfico {index+1} · variável real</label>
            <select value={tagId} className="ind-select" onChange={e=>
              setChosen(old=>old.map((v,i)=>i===index?e.target.value:(v||tags[i]?.id||"")) )}>
              <option value="">Selecione uma tag cadastrada</option>
              {tags.map(t=><option key={t.id} value={t.id}>{t.code} · {t.name}</option>)}
            </select>
          </div>
          <TrendChart tag={tag} hours={hours}/>
        </section>;
      })}
    </div>
    <div className="ind-info ind-block">Cada gráfico é consultado separadamente com sua unidade de engenharia. Pontos de qualidade BAD/UNCERTAIN não são traçados como medidas válidas. Não há interpolação artificial.</div>
  </div>;
}
function Tanks({catalog,telemetry}){
  const tanks=(catalog.equipment||[]).filter(e=>e.category==="TANQUE");
  return <div>
    <div className="ind-section-head"><div><h2>Tanques, níveis e volumes</h2>
      <p>Somente tanques e sensores realmente cadastrados; escalas respeitam a unidade da tag.</p></div></div>
    {tanks.length? <div className="ind-cards">
      {tanks.map(tank=>{
        const related=(catalog.tags||[]).filter(t=>t.equipment_id===tank.id);
        const level=related.find(t=>t.kind==="NIVEL");
        const reading=level?telemetry[level.id]:null;
        const numeric=level?.unit==="%" && reading?.valid_now && Number.isFinite(Number(reading.value)) && reading.value>=0 && reading.value<=100;
        return <article className="ind-equip" key={tank.id}>
          <div className="ind-equip-head"><span className="ind-eyebrow">{tank.code}</span><Badge tone={numeric?"ok":"warn"}>{numeric?"DADO VÁLIDO":"SEM NÍVEL VÁLIDO"}</Badge></div>
          <h3 style={{marginTop:10}}>{tank.name}</h3>
          <div className="ind-tank">
            <div className="ind-tank-vessel"><div className="ind-tank-liquid" style={{height:numeric?`${reading.value}%`:"0%"}}/>
              <div className="ind-tank-grid"/></div>
            <div>
              <div className="ind-small">{level?level.code:"Tag de nível ausente"}</div>
              <RealReading tag={level} telemetry={telemetry}/>
              <p className="ind-small">Leitura: {dateBR(reading?.observed_at)}</p>
            </div>
          </div>
          <div className="ind-divider"/>
          {related.length?related.map(tag=><p key={tag.id} className="ind-small">{tag.code} · {tag.kind}: <RealReading tag={tag} telemetry={telemetry} compact/></p>):<p>Cadastre as tags reais desse tanque para acompanhar variáveis.</p>}
        </article>;
      })}
    </div>:<Placeholder>Nenhum tanque real cadastrado. A engenharia precisa cadastrar tanques e respectivas tags.</Placeholder>}
  </div>;
}
function Equipment({catalog,telemetry,selectedArea,setSelectedArea}){
  const [search,setSearch]=useState("");
  const [category,setCategory]=useState("");
  const equipment=(catalog.equipment||[]).filter(item=>
    (!selectedArea||item.area_id===selectedArea)&&(!category||item.category===category)&&
    (`${item.name} ${item.code}`.toLowerCase().includes(search.toLowerCase())));
  return <div>
    <div className="ind-section-head"><div><h2>Inventário de equipamentos</h2><p>Filtro por setor, categoria e identificação real.</p></div></div>
    <div className="ind-grid three" style={{marginBottom:15}}>
      <div className="ind-field"><label>Área</label><select className="ind-select" value={selectedArea} onChange={e=>setSelectedArea(e.target.value)}>
        <option value="">Todas as áreas</option>{catalog.areas.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></div>
      <div className="ind-field"><label>Categoria</label><select className="ind-select" value={category} onChange={e=>setCategory(e.target.value)}>
        <option value="">Todas as categorias</option>{["TANQUE","BOMBA","VALVULA","DECANTADOR","TROCADOR","FILTRO","TURBINA","OUTRO"].map(k=><option key={k}>{k}</option>)}</select></div>
      <div className="ind-field"><label>Pesquisar código ou nome</label>
        <input className="ind-input" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar equipamento"/></div>
    </div>
    {equipment.length?<div className="ind-cards">
      {equipment.map(item=>{
        const related=catalog.tags.filter(t=>t.equipment_id===item.id);
        return <article className="ind-equip" key={item.id}>
          <div className="ind-equip-head"><span className="ind-eyebrow">{item.code}</span><Badge>{item.category}</Badge></div>
          <h3 style={{marginTop:10}}>{item.name}</h3>
          <p>{catalog.areas.find(a=>a.id===item.area_id)?.name||"Área não localizada"}</p>
          <div className="ind-divider"/>
          {related.length?related.map(tag=><div key={tag.id} className="ind-inline" style={{justifyContent:"space-between",marginBottom:8}}>
            <code className="ind-mono">{tag.code}</code><RealReading tag={tag} telemetry={telemetry} compact/>
          </div>):<p>Nenhuma tag cadastrada para este equipamento.</p>}
        </article>;
      })}
    </div>:<Placeholder>Nenhum equipamento corresponde aos filtros ou não há cadastros.</Placeholder>}
  </div>;
}
function Alarms({alarms,role,refresh}){
  const [state,setState]=useState("OPEN");
  const [busy,setBusy]=useState("");
  const [error,setError]=useState("");
  const canAck=["admin","supervisor"].includes(role);
  const shown=alarms.filter(a=>state==="ALL"||a.state===state);
  const ack=async alarm=>{
    if(!window.confirm(`Reconhecer alarme de ${alarm.tag_code}? Isso registra ciência, não altera o processo.`))return;
    setBusy(alarm.id);setError("");
    try{await axios.post(`${API}/api/ops/alarms/${encodeURIComponent(alarm.id)}/ack`,{},{timeout:12000});await refresh();}
    catch(e){setError(e.response?.data?.detail||"Não foi possível reconhecer o alarme.");}
    finally{setBusy("");}
  };
  return <div>
    <div className="ind-section-head"><div><h2>Alarmes e eventos</h2><p>Disparados exclusivamente por limites cadastrados e medições reais com qualidade GOOD.</p></div>
      <div className="ind-field"><label>Estado</label><select value={state} className="ind-select" onChange={e=>setState(e.target.value)}>
        <option value="OPEN">Em aberto</option><option value="CLEARED">Normalizados</option><option value="ALL">Todos recebidos</option>
      </select></div>
    </div>
    <div className="ind-info ind-alert">Reconhecer um alarme registra ciência do usuário. Não encerra a ocorrência, não modifica setpoint e não substitui o sistema de alarmes do PLC/SCADA.</div>
    {error&&<p role="alert" className="ind-error">{error}</p>}
    {shown.length?<div className="ind-table-scroll ind-block"><table className="ind-table"><thead><tr>
      <th>Estado</th><th>Prioridade</th><th>TAG</th><th>Último valor</th><th>Último registro</th><th>Reconhecimento</th><th>Ação</th>
    </tr></thead><tbody>{shown.map(a=><tr key={a.id}>
      <td><Badge tone={a.state==="OPEN"?"warn":"ok"}>{a.state==="OPEN"?"ABERTO":"NORMALIZADO"}</Badge></td>
      <td><Badge tone={a.severity==="CRITICO"?"danger":"warn"}>{a.severity}</Badge></td>
      <td><code>{a.tag_code}</code><div className="ind-small">{a.direction==="HIGH"?"Acima do limite":"Abaixo do limite"}</div></td>
      <td>{formatNumber(a.last_value)} {a.unit}</td>
      <td>{dateBR(a.last_seen_at)}</td>
      <td>{a.acknowledged_at?dateBR(a.acknowledged_at):"Não reconhecido"}</td>
      <td>{canAck&&!a.acknowledged_at?<button className="ind-button ind-button-quiet" disabled={busy===a.id} onClick={()=>ack(a)}>Reconhecer</button>:"—"}</td>
    </tr>)}</tbody></table></div>:<Placeholder>Nenhum alarme real encontrado neste estado.</Placeholder>}
  </div>;
}
function Audit({role}){
  const allowed=["admin","supervisor"].includes(role);
  const [rows,setRows]=useState([]);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const refresh=useCallback(async()=>{
    if(!allowed)return;
    setLoading(true);setError("");
    try{const r=await axios.get(`${API}/api/ops/audit`,{timeout:10000});setRows(r.data.items||[]);}
    catch(e){setError(e.response?.data?.detail||"Falha ao ler a auditoria.");}
    finally{setLoading(false);}
  },[allowed]);
  useEffect(()=>{refresh();},[refresh]);
  if(!allowed)return <Placeholder>Auditoria restrita aos perfis supervisor e administrador.</Placeholder>;
  return <section className="ind-block">
    <div className="ind-section-head"><h2>Auditoria técnica · eventos de engenharia</h2>
      <button type="button" className="ind-button ind-button-quiet" onClick={refresh}>Atualizar</button></div>
    <p className="ind-section-intro">Cadastros, pedidos de modo e reconhecimento de alarmes são registrados com data, usuário e detalhes.</p>
    {loading&&<p className="ind-small">Carregando...</p>}
    {error&&<p className="ind-error">{error}</p>}
    {rows.length?<div className="ind-table-scroll"><table className="ind-table"><thead><tr>
      <th>Data</th><th>Usuário</th><th>Ação</th><th>Entidade</th><th>Detalhes</th>
    </tr></thead><tbody>{rows.map((r,i)=><tr key={r.id||i}>
      <td>{dateBR(r.timestamp)}</td><td>{r.actor_name||"Não identificado"}</td><td><code>{r.action}</code></td>
      <td><code>{r.entity}</code></td><td className="ind-wrap">{JSON.stringify(r.details||{})}</td>
    </tr>)}</tbody></table></div>:<Placeholder>Nenhum evento de auditoria encontrado.</Placeholder>}
  </section>;
}
export default function OperationsCenterPage(){
  const {user}=useAuth();
  const [tab,setTab]=useState("coi");
  const [selectedArea,setSelectedArea]=useState("");
  const [catalog,setCatalog]=useState(emptyCatalog);
  const [telemetry,setTelemetry]=useState({});
  const [overview,setOverview]=useState(null);
  const [status,setStatus]=useState(null);
  const [alarms,setAlarms]=useState([]);
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(true);
  const [refreshedAt,setRefreshedAt]=useState("");
  const [liveChannel,setLiveChannel]=useState("AGUARDANDO");
  const [livePacketAt,setLivePacketAt]=useState("");

  const refresh=useCallback(async()=>{
    const resources=["/api/ops/status","/api/ops/catalog","/api/ops/telemetry","/api/ops/overview","/api/ops/alarms"];
    const names=["status","catalog","telemetry","overview","alarms"];
    const out=await Promise.allSettled(resources.map(path=>axios.get(`${API}${path}`,{timeout:14000})));
    const values={}; const failed=[];
    out.forEach((v,i)=>{
      if(v.status==="fulfilled") values[names[i]]=v.value.data;
      else failed.push(names[i]);
    });
    setStatus(values.status||null);
    setCatalog(values.catalog||emptyCatalog);
    setTelemetry(values.telemetry?.readings||{});
    setOverview(values.overview||null);
    setAlarms(values.alarms?.items||[]);
    setRefreshedAt(new Date().toISOString());
    setError(failed.length?`Falha ao consultar: ${failed.join(", ")}. Confira a API, autenticação e rede. Dados indisponíveis não foram substituídos.`:"");
    setLoading(false);
  },[]);
  useEffect(()=>{
    refresh();
    const timer=window.setInterval(()=>{
      if(document.visibilityState==="visible")refresh();
    },30000);
    return()=>window.clearInterval(timer);
  },[refresh]);

  useEffect(()=>{
    const token=window.localStorage.getItem("ipiranga_token");
    if(!token || !window.WebSocket){setLiveChannel("INDISPONIVEL");return;}
    let closed=false;
    let timer=null;
    let socket=null;
    let attempts=0;
    const connect=()=>{
      if(closed)return;
      const rawBase=API || window.location.origin;
      const base=rawBase.endsWith("/") ? rawBase.slice(0,-1) : rawBase;
      const url=base.replace(/^http/i,"ws")+"/api/ops/ws";
      setLiveChannel("CONECTANDO");
      try{socket=new WebSocket(url);}catch(_){setLiveChannel("INDISPONIVEL");return;}
      socket.onopen=()=>{
        if(closed)return;
        socket.send(JSON.stringify({token}));
      };
      socket.onmessage=event=>{
        try{
          const packet=JSON.parse(event.data);
          if(packet.type!=="industrial_telemetry"||!packet.readings)return;
          attempts=0;
          setTelemetry(old=>({...old,...packet.readings}));
          setLivePacketAt(packet.observed_server_time||"");
          setLiveChannel("ATIVO");
        }catch(_){setLiveChannel("FORMATO INVALIDO");}
      };
      socket.onclose=event=>{
        if(closed)return;
        setLiveChannel("OFFLINE");
        if(event.code===1008)return;
        attempts=Math.min(5,attempts+1);
        timer=window.setTimeout(connect,Math.min(30000,1000*(2**attempts)));
      };
      socket.onerror=()=>setLiveChannel("OFFLINE");
    };
    connect();
    return()=>{closed=true;if(timer)window.clearTimeout(timer);socket?.close();};
  },[]);

  const openSector=id=>{setSelectedArea(id);setTab("equipment");};
  const live=Boolean(status?.telemetry_state==="RECENT_REAL_DATA");
  const pageTitle=tabs.find(t=>t[0]===tab)?.[1]||"COI";

  return <div className="ind-shell" data-testid="ipiranga-operacoes">
    <header className="ind-topbar">
      <div>
        <div className="ind-eyebrow">USINA IPIRANGA · AGROINDUSTRIAL · AÇÚCAR E ÁLCOOL</div>
        <h1 className="ind-title">Centro de Operações Inteligente</h1>
        <p className="ind-subtitle">Supervisão de processo · Engenharia industrial · Histórico · IA analítica</p>
      </div>
      <div className="ind-righthead">
        <div className="ind-pills">
          <Badge tone={live?"ok":"warn"}><Activity size={12}/>{live?"TELEMETRIA RECENTE":"AGUARDANDO DADOS REAIS"}</Badge>
          <Badge tone={liveChannel==="ATIVO"?"ok":"warn"}><Radar size={12}/> WEB: {liveChannel}</Badge>
          <Badge tone="warn"><Network size={12}/> PLC NÃO VERIFICADO</Badge>
          <Badge tone="danger"><LockKeyhole size={12}/> ESCRITA BLOQUEADA</Badge>
        </div>
        <div className="ind-inline">
          <span className="ind-small">Atualizado: {dateBR(livePacketAt||refreshedAt)}</span>
          <button className="ind-button ind-button-quiet" type="button" onClick={refresh}><RefreshCcw size={13} style={{display:"inline",marginRight:6}}/>Atualizar</button>
        </div>
      </div>
    </header>
    {error&&<div role="alert" className="ind-error" style={{marginTop:15}}><CircleAlert size={14} style={{display:"inline",marginRight:8}}/>{error}</div>}
    {loading&&<p role="status" className="ind-small">Consultando a plataforma industrial...</p>}
    <nav className="ind-tabs" aria-label="Módulos da operação">
      {tabs.map(([id,label,Icon])=><button type="button" key={id} onClick={()=>setTab(id)}
        className={`ind-tab ${tab===id?"active":""}`} aria-current={tab===id?"page":undefined}>
        <Icon size={14} style={{display:"inline",marginRight:7,verticalAlign:"middle"}}/>{label}
      </button>)}
    </nav>
    {tab==="coi"&&<Overview catalog={catalog} overview={overview} telemetry={telemetry}
      alarms={alarms} status={status} refresh={refresh} openSector={openSector}/>}
    {tab==="trends"&&<Trends catalog={catalog}/>}
    {tab==="tanks"&&<Tanks catalog={catalog} telemetry={telemetry}/>}
    {tab==="equipment"&&<Equipment catalog={catalog} telemetry={telemetry} selectedArea={selectedArea} setSelectedArea={setSelectedArea}/>}
    {tab==="control"&&<ControlView catalog={catalog} telemetry={telemetry} role={user?.role} refresh={refresh}/>}
    {tab==="alarms"&&<Alarms alarms={alarms} role={user?.role} refresh={refresh}/>}
    {tab==="engineering"&&<EngineeringView catalog={catalog} isAdmin={user?.role==="admin"} refresh={refresh}/>}
    {tab==="ai"&&<AIView catalog={catalog} status={status} role={user?.role}/>}
    {tab==="audit"&&<Audit role={user?.role}/>}
    <footer className="ind-divider ind-small" style={{paddingTop:15}}>
      USINA IPIRANGA · Plataforma industrial WEB · Página: {pageTitle} · Sem simulações nem dados de processo inventados ·
      Nenhuma função de comando físico foi habilitada nesta versão.
    </footer>
  </div>;
}
