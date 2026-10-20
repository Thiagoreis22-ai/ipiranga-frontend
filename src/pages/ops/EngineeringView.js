import React, { useState } from "react";
import axios from "axios";
import { ClipboardCheck, Database, PlusCircle, ShieldAlert } from "lucide-react";

const API = process.env.REACT_APP_BACKEND_URL;
const equipmentKinds = ["TANQUE","BOMBA","VALVULA","DECANTADOR","TROCADOR","FILTRO","TURBINA","OUTRO"];
const tagKinds = ["NIVEL","VAZAO","TEMPERATURA","PH","BRIX","PRESSAO","DENSIDADE","POSICAO","ENERGIA","OUTRO"];
const sections = [
  ["areas","Área de processo"],["equipment","Equipamento"],["tags","Tag industrial"],["loops","Malha de controle"]
];

const initial = {
  areas: { code:"",name:"",description:"" },
  equipment: { code:"",name:"",area_id:"",category:"TANQUE",description:"" },
  tags: { code:"",name:"",area_id:"",equipment_id:"",kind:"NIVEL",unit:"",source_tag:"",
    warning_low:"",warning_high:"",critical_low:"",critical_high:"" },
  loops: { code:"",name:"",area_id:"",pv_tag_id:"",sp_tag_id:"",mv_tag_id:"",
    requested_mode:"MANUAL",notes:"" }
};

function Input({ label, value, onChange, type="text", children, required=false, placeholder="" }) {
  return <div className="ind-field"><label>{label}</label>
    {children ? <select className="ind-select" value={value ?? ""} required={required} onChange={e=>onChange(e.target.value)}>{children}</select> :
      <input className="ind-input" value={value ?? ""} type={type} step={type==="number"?"any":undefined}
        required={required} maxLength={180} placeholder={placeholder} onChange={e=>onChange(e.target.value)} />}
  </div>;
}

export default function EngineeringView({catalog, refresh, isAdmin}) {
  const [active,setActive] = useState("areas");
  const [values,setValues] = useState({...initial.areas});
  const [saving,setSaving] = useState(false);
  const [message,setMessage] = useState("");
  const [error,setError] = useState("");
  const areas = catalog.areas || [];
  const equipment = catalog.equipment || [];
  const tags = catalog.tags || [];
  const field = (key,value) => setValues(old=>({...old,[key]:value}));
  const choose = id => {setActive(id);setValues({...initial[id]});setMessage("");setError("");};
  const areaEq = equipment.filter(item=>item.area_id === values.area_id);
  const areaTags = tags.filter(item=>item.area_id === values.area_id);
  const normalize = () => {
    const doc={...values};
    if(active==="tags"){
      for(const name of ["warning_low","warning_high","critical_low","critical_high"]){
        doc[name]=doc[name] === "" ? null : Number(doc[name]);
      }
      if(!doc.equipment_id)doc.equipment_id=null;
    }
    if(active==="loops"){
      if(!doc.sp_tag_id)doc.sp_tag_id=null;
      if(!doc.mv_tag_id)doc.mv_tag_id=null;
    }
    return doc;
  };
  const save = async e=>{
    e.preventDefault();
    setError("");setMessage("");setSaving(true);
    try {
      await axios.post(`${API}/api/ops/${active}`,normalize(),{timeout:12000});
      setMessage("Cadastro gravado no banco de dados com sucesso.");
      setValues({...initial[active]});
      await refresh();
    } catch(err){
      const detail=err.response?.data?.detail;
      setError(typeof detail==="string"?detail:"Não foi possível salvar. Confira os campos, a conexão e as permissões.");
    } finally{setSaving(false);}
  };

  return <div className="ind-block">
    <div className="ind-section-head">
      <div><h2>Engenharia e cadastro industrial</h2><p>Cadastre apenas equipamentos, áreas e tags realmente existentes. Sem dados fictícios.</p></div>
    </div>
    <div className="ind-info ind-alert">
      <ShieldAlert size={15} style={{display:"inline",marginRight:8}} />
      Nesta fase o cadastro é apenas para supervisão e histórico. Cadastrar tags ou malhas NÃO ativa conexão com CLPs, nem habilita escrita no processo.
    </div>
    <div className="ind-grid four ind-block">
      <div className="ind-kpi"><div className="ind-kpi-label">Áreas</div><div className="ind-kpi-number">{areas.length}</div><div className="ind-kpi-foot">cadastradas</div></div>
      <div className="ind-kpi"><div className="ind-kpi-label">Equipamentos</div><div className="ind-kpi-number">{equipment.length}</div><div className="ind-kpi-foot">cadastrados</div></div>
      <div className="ind-kpi"><div className="ind-kpi-label">Tags</div><div className="ind-kpi-number">{tags.length}</div><div className="ind-kpi-foot">cadastradas</div></div>
      <div className="ind-kpi"><div className="ind-kpi-label">Malhas</div><div className="ind-kpi-number">{(catalog.loops||[]).length}</div><div className="ind-kpi-foot">ainda não comissionadas</div></div>
    </div>
    {!isAdmin && <div className="ind-empty ind-block">Somente administradores podem cadastrar a estrutura industrial. Consulte os equipamentos e tags já existentes nas demais abas.</div>}
    {isAdmin && <>
      <div className="ind-inline ind-block">
        {sections.map(([id,name])=><button key={id} type="button" className={`ind-tab ${active===id?"active":""}`} onClick={()=>choose(id)}>{name}</button>)}
      </div>
      <section className="ind-panel ind-block">
        <h3 className="ind-panel-title"><PlusCircle size={15} style={{display:"inline",marginRight:8}}/> Cadastrar {sections.find(x=>x[0]===active)?.[1]}</h3>
        <form onSubmit={save} className="ind-form">
          <Input label="Código técnico *" required value={values.code} onChange={v=>field("code",v)} placeholder="Ex: AREA_TRATAMENTO"/>
          <Input label="Nome / descrição curta *" required value={values.name} onChange={v=>field("name",v)} placeholder="Nome utilizado pela engenharia"/>
          {active!=="areas" && <Input label="Área vinculada *" required value={values.area_id} onChange={v=>{
            setValues(old=>({...old,area_id:v,equipment_id:"",pv_tag_id:"",sp_tag_id:"",mv_tag_id:""}));
          }}>
            <option value="">Selecione uma área cadastrada</option>
            {areas.map(a=><option key={a.id} value={a.id}>{a.code} · {a.name}</option>)}
          </Input>}
          {active==="equipment" && <Input label="Categoria" value={values.category} onChange={v=>field("category",v)}>
            {equipmentKinds.map(k=><option key={k} value={k}>{k}</option>)}
          </Input>}
          {active==="tags" && <>
            <Input label="Equipamento (opcional)" value={values.equipment_id} onChange={v=>field("equipment_id",v)}>
              <option value="">Sem equipamento específico</option>
              {areaEq.map(item=><option key={item.id} value={item.id}>{item.code} · {item.name}</option>)}
            </Input>
            <Input label="Tipo de variável" value={values.kind} onChange={v=>field("kind",v)}>
              {tagKinds.map(k=><option key={k} value={k}>{k}</option>)}
            </Input>
            <Input label="Unidade" value={values.unit} onChange={v=>field("unit",v)} placeholder="%, °C, m³/h..."/>
            <Input label="Nome real no CLP / gateway" value={values.source_tag} onChange={v=>field("source_tag",v)} placeholder="Definido pela automação"/>
            {["warning_low","warning_high","critical_low","critical_high"].map((k)=>
              <Input key={k} type="number" label={{
                warning_low:"Atenção — mínimo",warning_high:"Atenção — máximo",
                critical_low:"Crítico — mínimo",critical_high:"Crítico — máximo"
              }[k]} value={values[k]} onChange={v=>field(k,v)}/>)}
          </>}
          {active==="loops" && <>
            <Input label="PV · tag de processo *" required value={values.pv_tag_id} onChange={v=>field("pv_tag_id",v)}>
              <option value="">Selecione a tag de PV</option>
              {areaTags.map(t=><option key={t.id} value={t.id}>{t.code} · {t.name}</option>)}
            </Input>
            <Input label="SP · tag de setpoint" value={values.sp_tag_id} onChange={v=>field("sp_tag_id",v)}>
              <option value="">Não cadastrada</option>
              {areaTags.map(t=><option key={t.id} value={t.id}>{t.code} · {t.name}</option>)}
            </Input>
            <Input label="MV · saída da malha" value={values.mv_tag_id} onChange={v=>field("mv_tag_id",v)}>
              <option value="">Não cadastrada</option>
              {areaTags.map(t=><option key={t.id} value={t.id}>{t.code} · {t.name}</option>)}
            </Input>
            <div className="ind-field full">
              <label>Modo pretendido inicial (não aplicado ao PLC)</label>
              <select className="ind-select" value={values.requested_mode} onChange={e=>field("requested_mode",e.target.value)}>
                <option value="MANUAL">Manual</option>
                <option value="SUPERVISORIO">Supervisório</option>
                <option value="AUTOMATICO">Automático — planejamento</option>
              </select>
            </div>
          </>}
          {(active==="areas" || active==="equipment" || active==="loops") && <div className="ind-field full">
            <label>{active==="loops"?"Observações técnicas":"Descrição"}</label>
            <textarea className="ind-textarea" value={values.description ?? values.notes ?? ""}
              onChange={e=>field(active==="loops"?"notes":"description",e.target.value)} />
          </div>}
          {error && <div role="alert" className="ind-error ind-field full">{error}</div>}
          {message && <p role="status" className="ind-pill ok ind-field full"><ClipboardCheck size={15}/>{message}</p>}
          <div className="ind-field full">
            <button className="ind-button" disabled={saving} type="submit">{saving?"Salvando no servidor...":"Gravar cadastro real"}</button>
          </div>
        </form>
      </section>
    </>}
    <section className="ind-panel ind-block">
      <h3 className="ind-panel-title"><Database size={15} style={{display:"inline",marginRight:7}}/> Catálogo de tags registradas</h3>
      {tags.length? <div className="ind-table-scroll"><table className="ind-table"><thead><tr>
        <th>TAG</th><th>Descrição</th><th>Grandeza</th><th>Unidade</th><th>Área</th><th>Origem cadastrada</th>
      </tr></thead><tbody>{tags.map(t=><tr key={t.id}>
        <td><code>{t.code}</code></td><td>{t.name}</td><td>{t.kind}</td><td>{t.unit||"—"}</td>
        <td>{areas.find(a=>a.id===t.area_id)?.name||"—"}</td><td>{t.source_tag||"Não informada"}</td>
      </tr>)}</tbody></table></div> : <div className="ind-empty">Ainda não há tags reais cadastradas pela engenharia.</div>}
    </section>
  </div>;
}
