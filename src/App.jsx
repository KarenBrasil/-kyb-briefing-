import { useState, useEffect, useRef, useCallback } from "react";
import { getClient, upsertClient, listClients, saveSnapshot, listSnapshots, deleteSnapshot, getMeta, saveMeta } from "./lib/db";

const THEMES = {
  light: {
    bg:          "#FAF7F4",
    bgWarm:      "#F4EEE6",
    surface:     "#FFFFFF",
    surfaceAlt:  "#FDF9F5",
    border:      "#EAE0D4",
    borderMid:   "#D8C9B8",
    rose:        "#D95C72",
    roseDark:    "#B83F56",
    roseSoft:    "#F0A8B5",
    roseDim:     "rgba(217,92,114,0.10)",
    gold:        "#C08A2E",
    goldLight:   "#D9A84E",
    goldDim:     "rgba(192,138,46,0.10)",
    nude:        "#C9A882",
    nudeDim:     "rgba(201,168,130,0.16)",
    text:        "#281A12",
    textMid:     "#5E3D2E",
    textMuted:   "#9A7060",
    textDim:     "#BFA898",
    green:       "#4A8F66",
    greenDim:    "rgba(74,143,102,0.11)",
    shadow:      "rgba(40,26,18,0.07)",
  },
  dark: {
    bg:          "#12100E",
    bgWarm:      "#1A1612",
    surface:     "#1F1B17",
    surfaceAlt:  "#261F19",
    border:      "#2E2520",
    borderMid:   "#3A302A",
    rose:        "#E8637A",
    roseDark:    "#C94860",
    roseSoft:    "#7A3040",
    roseDim:     "rgba(232,99,122,0.12)",
    gold:        "#D4A44A",
    goldLight:   "#E8C070",
    goldDim:     "rgba(212,164,74,0.12)",
    nude:        "#8C6E54",
    nudeDim:     "rgba(140,110,84,0.18)",
    text:        "#F5EDE6",
    textMid:     "#C4A898",
    textMuted:   "#8A7060",
    textDim:     "#5A4A40",
    green:       "#5EAA7E",
    greenDim:    "rgba(94,170,126,0.13)",
    shadow:      "rgba(0,0,0,0.30)",
  },
};

const makeCSS = (t) => `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=Outfit:wght@300;400;500;600;700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
html{scroll-behavior:smooth;}
body{background:${t.bg};color:${t.text};font-family:'Outfit',sans-serif;-webkit-font-smoothing:antialiased;transition:background .3s,color .3s;}
::-webkit-scrollbar{width:4px;}
::-webkit-scrollbar-track{background:${t.bgWarm};}
::-webkit-scrollbar-thumb{background:${t.borderMid};border-radius:99px;}
textarea,input,select{font-family:'Outfit',sans-serif;transition:background .3s,border-color .2s;}
.pf{font-family:'Playfair Display',serif;}
@keyframes up{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
.a0{animation:up .45s both}
.a1{animation:up .45s .07s both}
.a2{animation:up .45s .14s both}
.a3{animation:up .45s .21s both}
.rec-anim{animation:pulse 1s infinite}
input::placeholder,textarea::placeholder{color:${t.textDim};}
`;

const Ic = ({ d, size = 16, color = "currentColor", sw = 1.8, fill = "none" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const ico = {
  check:   "M20 6L9 17l-5-5",
  copy:    "M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z",
  wa:      "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z",
  lock:    "M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2zM7 11V7a5 5 0 0110 0v4",
  sun:     "M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42M12 5a7 7 0 100 14A7 7 0 0012 5z",
  moon:    "M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z",
  user:    "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z",
  bolt:    "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
  chev:    "M6 9l6 6 6-6",
  chevR:   "M9 18l6-6-6-6",
  edit:    "M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z",
  save:    "M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2zM17 21v-8H7v8M7 3v5h8",
  close:   "M18 6L6 18M6 6l12 12",
  link:    "M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71",
  music:   "M9 18V5l12-2v13M9 18a3 3 0 11-6 0 3 3 0 016 0zm12-2a3 3 0 11-6 0 3 3 0 016 0z",
  upload:  "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12",
  eye:     "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 100 6 3 3 0 000-6z",
  logout:  "M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9",
  client:  "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75",
  history: "M12 8v4l3 3M3.05 11a9 9 0 109.9-8.95M3 3v5h5",
  trash:   "M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6",
  plus:    "M12 5v14M5 12h14",
  refresh: "M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15",
};

const SECTIONS = [
  {
    id: "voce", icon: "✦", colorKey: "rose",
    title: "Quem é Você",
    sub: "Essência, trajetória e diferenciais",
    questions: [
      { id: "q1", label: "Seu nome e o que você faz?", hint: "Ex: Sou médica dermatologista especializada em pele negra..." },
      { id: "q2", label: "Há quanto tempo atua nessa área?", hint: "Conte um pouco da sua trajetória..." },
      { id: "q3", label: "Qual resultado concreto você entrega ao cliente?", hint: "O que muda na vida de quem te contrata?" },
      { id: "q4", label: "O que te diferencia dos outros da sua área?", hint: "Método, estilo, experiência única..." },
    ],
  },
  {
    id: "publico", icon: "◎", colorKey: "gold",
    title: "Seu Público",
    sub: "Para quem você quer falar no Instagram",
    questions: [
      { id: "q5", label: "Quem é a pessoa que você quer atrair?", hint: "Idade, profissão, estilo de vida, sonhos e dores..." },
      { id: "q6", label: "Qual a maior dor ou dúvida que esse público tem?", hint: "O que tira o sono do seu cliente ideal?" },
      { id: "q7", label: "Como seu cliente te encontra hoje?", hint: "Indicação, busca no Google, redes sociais, eventos?" },
    ],
  },
  {
    id: "posicionamento", icon: "◈", colorKey: "rose",
    title: "Posicionamento",
    sub: "Como quer ser percebido online",
    questions: [
      { id: "q8", label: "Em uma frase: o que quer que as pessoas pensem ao te ver?", hint: "Ex: 'A especialista mais confiável de...' / 'A referência em...'" },
      { id: "q9", label: "Qual o tom da sua comunicação?", hint: "Técnico, leve, inspirador, próximo, direto ao ponto?" },
      { id: "q10", label: "Algum perfil ou marca que você admira a comunicação?", hint: "Links ou nomes — o que te inspira no jeito de comunicar?" },
    ],
  },
  {
    id: "conteudo", icon: "◐", colorKey: "nude",
    title: "Estratégia de Conteúdo",
    sub: "O que vamos criar juntas",
    questions: [
      { id: "q11", label: "Quais assuntos você domina e quer falar?", hint: "Temas com que você tem facilidade e autoridade..." },
      { id: "q12", label: "Prefere aparecer nos vídeos ou ficar nos bastidores?", hint: "Câmera aberta, voz em off, carrossel, texto... O que te deixa à vontade?" },
      { id: "q13", label: "Tem algum formato que definitivamente não quer fazer?", hint: "O que não combina com você ou não quer produzir?" },
      { id: "q14", label: "Quantas vezes por semana consegue produzir conteúdo?", hint: "Seja honesta — isso define nosso planejamento real..." },
    ],
  },
  {
    id: "instagram", icon: "◇", colorKey: "green",
    title: "Instagram & Metas",
    sub: "Onde estamos e para onde vamos",
    questions: [
      { id: "q15", label: "Qual é o @ do seu Instagram?", hint: "Vou analisar antes da nossa conversa estratégica..." },
      { id: "q16", label: "Qual o maior desafio no Instagram hoje?", hint: "Engajamento, consistência, crescimento, direção...?" },
      { id: "q17", label: "Qual meta quer alcançar nos próximos 3 meses?", hint: "Seguidores, vendas, autoridade, leads — o que importa pra você?" },
    ],
  },
  {
    id: "captacao", icon: "◉", colorKey: "gold",
    title: "Captação Presencial",
    sub: "Produção de foto e vídeo (mesma cidade)",
    questions: [
      { id: "q18", label: "Tem interesse em produção presencial de conteúdo?", hint: "Ensaio de marca, gravação de reels, dia de produção..." },
      { id: "q19", label: "Qual cidade você está?", hint: "Verificamos a viabilidade de captação presencial..." },
      { id: "q20", label: "Tem algum espaço em mente para as gravações?", hint: "Consultório, estúdio, café favorito, ar livre...?" },
    ],
  },
];

const CHECKLIST = [
  { id: "c1",  text: "Proposta enviada e aprovada" },
  { id: "c2",  text: "Contrato assinado" },
  { id: "c3",  text: "Pagamento da primeira parcela confirmado" },
  { id: "c4",  text: "Briefing preenchido pelo cliente" },
  { id: "c5",  text: "Análise de perfil realizada" },
  { id: "c6",  text: "Reunião de kickoff agendada" },
  { id: "c7",  text: "Acessos ao Instagram concedidos" },
  { id: "c8",  text: "Planejamento do primeiro mês entregue" },
  { id: "c9",  text: "Identidade visual do feed alinhada" },
  { id: "c10", text: "Primeiro lote de conteúdo aprovado" },
  { id: "c11", text: "Cliente adicionado ao grupo de acompanhamento" },
  { id: "c12", text: "Data de início de publicação definida" },
];

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || "kyblab2025";
const ADMIN_PHONE    = import.meta.env.VITE_ADMIN_PHONE || "5585999999999";

function fmtDate(ts) {
  return new Date(ts).toLocaleString("pt-BR", { day:"2-digit", month:"2-digit", year:"numeric", hour:"2-digit", minute:"2-digit" });
}
function countFilled(ans) {
  const total = SECTIONS.reduce((a,s)=>a+s.questions.length,0);
  const done  = Object.values(ans||{}).filter(v=>v&&v.trim()).length;
  return { total, done, pct: total ? Math.round((done/total)*100) : 0 };
}
function clientKey(name) { return name.toLowerCase().replace(/\s+/g,"-").replace(/[^a-z0-9-]/g,""); }

function Pill({ children, color }) {
  return <span style={{background:`${color}18`,color,border:`1px solid ${color}30`,borderRadius:99,padding:"3px 10px",fontSize:10,fontWeight:700,letterSpacing:".08em",textTransform:"uppercase"}}>{children}</span>;
}

function Btn({ children, onClick, variant="primary", icon, size="md", disabled, full, t }) {
  const sz = {sm:{p:"6px 13px",fs:11}, md:{p:"9px 18px",fs:13}, lg:{p:"12px 26px",fs:14}}[size];
  const v = {
    primary: {bg:t.rose,         color:"#fff",        border:"none"},
    gold:    {bg:t.gold,         color:"#fff",        border:"none"},
    ghost:   {bg:"transparent",  color:t.textMuted,   border:`1px solid ${t.border}`},
    nude:    {bg:t.nudeDim,      color:t.textMid,     border:`1px solid ${t.borderMid}`},
    green:   {bg:t.greenDim,     color:t.green,       border:`1px solid ${t.green}40`},
    danger:  {bg:"rgba(200,60,60,.12)",color:"#e05555",border:"1px solid rgba(200,60,60,.25)"},
    wa:      {bg:"#25d36615",    color:"#128C7E",     border:"1px solid #25d36640"},
  }[variant]||{};
  return (
    <button onClick={!disabled?onClick:undefined} style={{display:"inline-flex",alignItems:"center",justifyContent:"center",gap:7,cursor:disabled?"not-allowed":"pointer",opacity:disabled?.5:1,borderRadius:9,fontFamily:"'Outfit',sans-serif",fontWeight:600,transition:"all .17s",padding:sz.p,fontSize:sz.fs,width:full?"100%":undefined,...v}}>
      {icon && <Ic d={ico[icon]} size={13} color="currentColor"/>}
      {children}
    </button>
  );
}

function Bar({ pct, color, thin, t }) {
  return (
    <div style={{height:thin?3:5,background:t.bgWarm,borderRadius:99,overflow:"hidden"}}>
      <div style={{height:"100%",width:`${Math.min(pct,100)}%`,background:`linear-gradient(90deg,${color},${color}99)`,borderRadius:99,transition:"width .55s cubic-bezier(.4,0,.2,1)"}}/>
    </div>
  );
}

function Question({ q, value, onChange, t, sectionColor }) {
  const [foc, setFoc] = useState(false);
  const filled = value && value.trim();
  return (
    <div style={{marginBottom:20}}>
      <label style={{display:"block",fontSize:13,fontWeight:500,color:filled?t.text:t.textMid,lineHeight:1.45,marginBottom:7}}>
        {filled && <span style={{color:t.green,marginRight:5,fontSize:11}}>✓</span>}
        {q.label}
      </label>
      <textarea value={value||""} onChange={e=>onChange(e.target.value)} onFocus={()=>setFoc(true)} onBlur={()=>setFoc(false)} placeholder={q.hint} rows={3}
        style={{width:"100%",background:foc?t.surface:t.surfaceAlt,border:`1.5px solid ${foc?sectionColor+"80":filled?t.borderMid:t.border}`,borderRadius:10,padding:"10px 13px",color:t.text,fontSize:13,lineHeight:1.65,resize:"vertical",outline:"none"}}/>
    </div>
  );
}

function SummaryModal({ snap, t, onClose, isAdmin }) {
  const ans = snap.answers || {};
  const lines = SECTIONS.map(s => {
    const filled = s.questions.filter(q=>ans[q.id]);
    if (!filled.length) return "";
    return `${s.icon} ${s.title.toUpperCase()}\n${"─".repeat(30)}\n${filled.map(q=>`• ${q.label}\n${ans[q.id]}`).join("\n\n")}`;
  }).filter(Boolean).join("\n\n");

  const full = `📋 BRIEFING KyB LAB\nCliente: ${snap.clientName||"—"}\nSalvo em: ${fmtDate(snap.saved_at || snap.savedAt)}\n${"═".repeat(38)}\n\n${lines}`;
  const copy = () => navigator.clipboard.writeText(full);
  const wa   = () => window.open(`https://api.whatsapp.com/send?phone=${ADMIN_PHONE}&text=${encodeURIComponent(full.slice(0,4096))}`);

  return (
    <div onClick={e=>e.target===e.currentTarget&&onClose()} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",backdropFilter:"blur(6px)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{background:t.surface,border:`1px solid ${t.border}`,borderRadius:20,width:"100%",maxWidth:660,maxHeight:"88vh",display:"flex",flexDirection:"column",boxShadow:`0 24px 60px ${t.shadow}`}}>
        <div style={{padding:"18px 22px",borderBottom:`1px solid ${t.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <h2 className="pf" style={{fontSize:20,color:t.text}}>Resumo do Briefing</h2>
            <p style={{color:t.rose,fontSize:12,marginTop:2,fontWeight:600}}>{snap.clientName} · {fmtDate(snap.saved_at || snap.savedAt)}</p>
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:t.textMuted}}><Ic d={ico.close} size={17}/></button>
        </div>
        <div style={{overflowY:"auto",flex:1,padding:"20px 22px"}}>
          {SECTIONS.map(s=>{
            const filled = s.questions.filter(q=>ans[q.id]);
            if (!filled.length) return null;
            const sc = t[s.colorKey];
            return (
              <div key={s.id} style={{marginBottom:24}}>
                <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:10}}>
                  <span style={{fontSize:13,color:sc}}>{s.icon}</span>
                  <span style={{fontSize:10,fontWeight:700,color:sc,textTransform:"uppercase",letterSpacing:".1em"}}>{s.title}</span>
                </div>
                {filled.map(q=>(
                  <div key={q.id} style={{marginBottom:12,paddingLeft:13,borderLeft:`2px solid ${sc}30`}}>
                    <p style={{fontSize:11,color:t.textMuted,marginBottom:2,fontWeight:600}}>{q.label}</p>
                    <p style={{fontSize:13,color:t.text,lineHeight:1.65,whiteSpace:"pre-wrap"}}>{ans[q.id]}</p>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
        <div style={{padding:"13px 22px",borderTop:`1px solid ${t.border}`,display:"flex",gap:9,flexWrap:"wrap"}}>
          <Btn onClick={copy} icon="copy" t={t}>Copiar</Btn>
          <Btn onClick={wa} variant="wa" icon="wa" t={t}>WhatsApp</Btn>
          <Btn onClick={onClose} variant="ghost" t={t}>Fechar</Btn>
        </div>
      </div>
    </div>
  );
}

function LoginScreen({ onLogin, t, isDark, toggleDark }) {
  const [mode,    setMode]  = useState("choose");
  const [pass,    setPass]  = useState("");
  const [name,    setName]  = useState("");
  const [err,     setErr]   = useState("");

  const tryAdmin = () => {
    if (pass === ADMIN_PASSWORD) { onLogin("admin", "KyB LAB"); setErr(""); }
    else { setErr("Senha incorreta."); }
  };
  const tryClient = () => {
    if (name.trim().length < 2) { setErr("Digite seu nome completo."); return; }
    onLogin("client", name.trim());
  };

  const inp = { width:"100%", background:t.bgWarm, border:`1.5px solid ${t.border}`, borderRadius:10, padding:"11px 14px", color:t.text, fontSize:14, outline:"none", fontFamily:"'Outfit',sans-serif" };

  return (
    <div style={{minHeight:"100vh",background:t.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20,position:"relative"}}>
      <div style={{position:"fixed",top:-100,right:-80,width:360,height:360,borderRadius:"50%",background:`radial-gradient(circle,${t.roseDim},transparent 70%)`,pointerEvents:"none"}}/>
      <div style={{position:"fixed",bottom:-80,left:-60,width:280,height:280,borderRadius:"50%",background:`radial-gradient(circle,${t.goldDim},transparent 70%)`,pointerEvents:"none"}}/>

      <button onClick={toggleDark} style={{position:"fixed",top:18,right:18,background:t.surface,border:`1px solid ${t.border}`,borderRadius:8,width:34,height:34,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:t.textMuted}}>
        <Ic d={isDark?ico.sun:ico.moon} size={15}/>
      </button>

      <div className="a0" style={{background:t.surface,border:`1px solid ${t.border}`,borderRadius:22,padding:"36px 32px",width:"100%",maxWidth:400,boxShadow:`0 8px 40px ${t.shadow}`}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{width:46,height:46,borderRadius:13,background:`linear-gradient(135deg,${t.rose},${t.gold})`,display:"inline-flex",alignItems:"center",justifyContent:"center",marginBottom:12}}>
            <Ic d={ico.bolt} size={20} color="#fff" fill="#fff" sw={1.5}/>
          </div>
          <h1 className="pf" style={{fontSize:26,color:t.text,fontWeight:400}}>KyB LAB</h1>
          <p style={{color:t.textMuted,fontSize:13,marginTop:4}}>Estratégia de Conteúdo</p>
        </div>

        {mode === "choose" && (
          <div style={{display:"flex",flexDirection:"column",gap:11}}>
            <p style={{textAlign:"center",color:t.textMid,fontSize:13,marginBottom:4}}>Como deseja acessar?</p>
            <button onClick={()=>setMode("admin")} style={{display:"flex",alignItems:"center",gap:13,padding:"15px 18px",background:t.bgWarm,border:`1.5px solid ${t.border}`,borderRadius:13,cursor:"pointer",textAlign:"left",transition:"border-color .2s"}}
              onMouseEnter={e=>e.currentTarget.style.borderColor=t.rose} onMouseLeave={e=>e.currentTarget.style.borderColor=t.border}>
              <div style={{width:38,height:38,borderRadius:10,background:t.roseDim,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <Ic d={ico.lock} size={17} color={t.rose}/>
              </div>
              <div>
                <div style={{fontWeight:700,color:t.text,fontSize:13}}>Sou a KyB LAB</div>
                <div style={{color:t.textMuted,fontSize:11,marginTop:1}}>Acesso administrativo completo</div>
              </div>
            </button>
            <button onClick={()=>setMode("client")} style={{display:"flex",alignItems:"center",gap:13,padding:"15px 18px",background:t.bgWarm,border:`1.5px solid ${t.border}`,borderRadius:13,cursor:"pointer",textAlign:"left",transition:"border-color .2s"}}
              onMouseEnter={e=>e.currentTarget.style.borderColor=t.gold} onMouseLeave={e=>e.currentTarget.style.borderColor=t.border}>
              <div style={{width:38,height:38,borderRadius:10,background:t.goldDim,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <Ic d={ico.user} size={17} color={t.gold}/>
              </div>
              <div>
                <div style={{fontWeight:700,color:t.text,fontSize:13}}>Sou cliente</div>
                <div style={{color:t.textMuted,fontSize:11,marginTop:1}}>Preencher meu briefing</div>
              </div>
            </button>
          </div>
        )}

        {mode === "admin" && (
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <button onClick={()=>setMode("choose")} style={{background:"none",border:"none",cursor:"pointer",color:t.textMuted,fontSize:12,textAlign:"left",display:"flex",alignItems:"center",gap:5,marginBottom:4}}>
              ← voltar
            </button>
            <p style={{color:t.textMid,fontSize:13,fontWeight:600}}>Senha de administração</p>
            <input type="password" placeholder="Digite a senha..." value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&tryAdmin()} style={inp}/>
            {err && <p style={{color:t.rose,fontSize:12}}>{err}</p>}
            <Btn onClick={tryAdmin} full t={t} size="lg">Entrar como Admin</Btn>
          </div>
        )}

        {mode === "client" && (
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <button onClick={()=>setMode("choose")} style={{background:"none",border:"none",cursor:"pointer",color:t.textMuted,fontSize:12,textAlign:"left",display:"flex",alignItems:"center",gap:5,marginBottom:4}}>
              ← voltar
            </button>
            <p style={{color:t.textMid,fontSize:13,fontWeight:600}}>Qual é o seu nome?</p>
            <input placeholder="Seu nome completo..." value={name} onChange={e=>setName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&tryClient()} style={inp}/>
            {err && <p style={{color:t.rose,fontSize:12}}>{err}</p>}
            <Btn onClick={tryClient} variant="gold" full t={t} size="lg">Acessar Briefing</Btn>
          </div>
        )}
      </div>
    </div>
  );
}

function ClientView({ clientName, onLogout, t, isDark, toggleDark }) {
  const [answers,  setAnswers]  = useState({});
  const [open,     setOpen]     = useState({ voce: true });
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [snapList, setSnapList] = useState([]);
  const [viewSnap, setViewSnap] = useState(null);
  const [loading,  setLoading]  = useState(true);

  const clientId = clientKey(clientName);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const client = await getClient(clientId);
        if (client?.answers) setAnswers(client.answers);
        const snaps = await listSnapshots(clientId);
        setSnapList(snaps || []);
      } catch (err) {
        console.error("Erro ao carregar:", err);
      }
      setLoading(false);
    }
    load();
  }, [clientId]);

  useEffect(() => {
    if (loading) return;
    const t = setTimeout(async () => {
      try {
        await upsertClient(clientId, clientName, answers);
      } catch (err) {
        console.error("Erro ao autosalvar:", err);
      }
    }, 800);
    return () => clearTimeout(t);
  }, [answers, loading, clientId, clientName]);

  const setAns = useCallback((id,v) => setAnswers(p=>({...p,[id]:v})), []);
  const toggleSec = id => setOpen(p=>({...p,[id]:!p[id]}));
  const { total, done, pct } = countFilled(answers);

  const handleSave = async () => {
    const filledCount = Object.values(answers).filter(v=>v&&v.trim()).length;
    if (filledCount === 0) { alert("Preencha pelo menos uma resposta antes de salvar."); return; }
    setSaving(true);
    try {
      const ts = Date.now();
      await saveSnapshot(clientId, clientName, {...answers}, ts);
      await upsertClient(clientId, clientName, {});
      setAnswers({});
      setOpen({});
      const snaps = await listSnapshots(clientId);
      setSnapList(snaps || []);
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
    } catch (err) {
      console.error("Erro ao salvar:", err);
      setSaving(false);
    }
  };

  const sendWA = () => {
    const lines = SECTIONS.map(s=>s.questions.filter(q=>answers[q.id]).map(q=>`*${q.label}*\n${answers[q.id]}`).join("\n\n")).join("\n\n");
    const msg = `📋 *Briefing KyB LAB*\n*Cliente:* ${clientName}\n\n${lines}`;
    window.open(`https://api.whatsapp.com/send?phone=${ADMIN_PHONE}&text=${encodeURIComponent(msg.slice(0,4096))}`);
  };

  if (loading) return <div style={{minHeight:"100vh",background:t.bg,display:"flex",alignItems:"center",justifyContent:"center",color:t.textMuted}}>Carregando...</div>;

  return (
    <div style={{minHeight:"100vh",background:t.bg}}>
      <div style={{position:"fixed",top:-80,right:-80,width:340,height:340,borderRadius:"50%",background:`radial-gradient(circle,${t.roseDim},transparent 70%)`,pointerEvents:"none",zIndex:0}}/>

      <header style={{position:"sticky",top:0,zIndex:100,background:`${t.bg}ee`,backdropFilter:"blur(18px)",borderBottom:`1px solid ${t.border}`}}>
        <div style={{maxWidth:760,margin:"0 auto",padding:"0 18px",height:56,display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
          <div style={{display:"flex",alignItems:"center",gap:9}}>
            <div style={{width:30,height:30,borderRadius:8,background:`linear-gradient(135deg,${t.rose},${t.gold})`,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <Ic d={ico.bolt} size={14} color="#fff" fill="#fff" sw={1.5}/>
            </div>
            <div>
              <div style={{fontSize:13,fontWeight:700,color:t.text,lineHeight:1}}>KyB LAB</div>
              <div style={{fontSize:10,color:t.textMuted}}>Briefing de {clientName}</div>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <div style={{display:"flex",alignItems:"center",gap:7,background:t.surface,border:`1px solid ${t.border}`,borderRadius:99,padding:"5px 12px"}}>
              <div style={{width:56,height:3,background:t.bgWarm,borderRadius:99,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${pct}%`,background:`linear-gradient(90deg,${t.rose},${t.gold})`,borderRadius:99,transition:"width .4s"}}/>
              </div>
              <span style={{fontSize:11,color:t.textMuted}}>{pct}%</span>
            </div>
            <button onClick={toggleDark} style={{background:t.surface,border:`1px solid ${t.border}`,borderRadius:7,width:30,height:30,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:t.textMuted}}>
              <Ic d={isDark?ico.sun:ico.moon} size={13}/>
            </button>
            <Btn onClick={onLogout} variant="ghost" icon="logout" size="sm" t={t}>Sair</Btn>
          </div>
        </div>
      </header>

      <main style={{maxWidth:760,margin:"0 auto",padding:"28px 18px 80px"}}>
        <div className="a0" style={{background:`linear-gradient(135deg,${t.surface},${t.surfaceAlt})`,border:`1px solid ${t.border}`,borderRadius:18,padding:"28px 28px 24px",marginBottom:20,position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",right:-30,top:-30,width:200,height:200,opacity:.035}}>
            <svg viewBox="0 0 200 200" fill="none"><circle cx="200" cy="0" r="80" stroke={t.rose} strokeWidth="1"/><circle cx="200" cy="0" r="120" stroke={t.rose} strokeWidth="1"/></svg>
          </div>
          <Pill color={t.rose}>Seu Briefing</Pill>
          <h1 className="pf" style={{fontSize:"clamp(22px,4vw,32px)",color:t.text,fontWeight:400,marginTop:10,marginBottom:8}}>
            Olá, <em style={{color:t.rose}}>{clientName}</em> 👋
          </h1>
          <p style={{color:t.textMid,fontSize:13,lineHeight:1.65,maxWidth:500,marginBottom:18}}>
            Responda com calma — não tem resposta certa ou errada. Quanto mais você compartilhar, mais poderosa fica a estratégia que vamos construir juntas.
          </p>
          <Bar pct={pct} color={t.rose} t={t}/>
          <p style={{fontSize:11,color:t.textDim,marginTop:5}}>{done} de {total} perguntas respondidas</p>
        </div>

        {SECTIONS.map(sec => {
          const sc = t[sec.colorKey];
          const filledCount = sec.questions.filter(q=>answers[q.id]).length;
          const isOpen = !!open[sec.id];
          return (
            <div key={sec.id} style={{marginBottom:8}}>
              <button onClick={()=>toggleSec(sec.id)} style={{width:"100%",background:isOpen?t.surface:t.bg,border:`1px solid ${isOpen?t.borderMid:t.border}`,borderRadius:isOpen?"13px 13px 0 0":13,padding:"14px 18px",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",transition:"all .18s"}}>
                <div style={{display:"flex",alignItems:"center",gap:11}}>
                  <div style={{width:32,height:32,borderRadius:8,background:`${sc}18`,border:`1px solid ${sc}25`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,color:sc,flexShrink:0}}>{sec.icon}</div>
                  <div style={{textAlign:"left"}}>
                    <div style={{fontSize:13,fontWeight:700,color:t.text}}>{sec.title}</div>
                    <div style={{fontSize:11,color:t.textMuted,marginTop:1}}>{sec.sub}</div>
                  </div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:9}}>
                  <span style={{fontSize:11,color:filledCount===sec.questions.length?t.green:t.textDim,fontWeight:600}}>{filledCount}/{sec.questions.length}</span>
                  <Ic d={isOpen?ico.chev:ico.chevR} size={14} color={t.textDim}/>
                </div>
              </button>
              {isOpen && (
                <div style={{background:t.surface,border:`1px solid ${t.borderMid}`,borderTop:"none",borderRadius:"0 0 13px 13px",padding:"22px 18px"}}>
                  <div style={{height:2,background:`linear-gradient(90deg,${sc}50,transparent)`,borderRadius:99,marginBottom:20}}/>
                  {sec.questions.map(q=>(
                    <Question key={q.id} q={q} value={answers[q.id]} onChange={v=>setAns(q.id,v)} t={t} sectionColor={sc}/>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        <div style={{display:"flex",gap:9,marginTop:18,justifyContent:"flex-end",flexWrap:"wrap"}}>
          <Btn onClick={sendWA} variant="wa" icon="wa" t={t}>Enviar para a KyB LAB</Btn>
          <Btn onClick={handleSave} variant="primary" icon={saving?"refresh":saved?"check":"save"} disabled={saving} t={t}>
            {saving?"Salvando...":saved?"✓ Salvo e enviado!":"Salvar Briefing"}
          </Btn>
        </div>

        {snapList.length > 0 && (
          <div style={{marginTop:32}}>
            <h3 style={{fontSize:13,fontWeight:700,color:t.textMuted,textTransform:"uppercase",letterSpacing:".08em",marginBottom:12}}>Histórico de envios</h3>
            <div style={{display:"flex",flexDirection:"column",gap:7}}>
              {snapList.map(snap=>(
                <div key={snap.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:t.surface,border:`1px solid ${t.border}`,borderRadius:11,padding:"12px 16px",gap:12,flexWrap:"wrap"}}>
                  <div style={{display:"flex",alignItems:"center",gap:9}}>
                    <Ic d={ico.history} size={15} color={t.rose}/>
                    <div>
                      <div style={{fontSize:13,fontWeight:600,color:t.text}}>Briefing enviado</div>
                      <div style={{fontSize:11,color:t.textMuted}}>{fmtDate(snap.saved_at)} · {Object.values(snap.answers||{}).filter(v=>v&&v.trim()).length} respostas</div>
                    </div>
                  </div>
                  <Btn onClick={()=>setViewSnap(snap)} variant="nude" size="sm" icon="eye" t={t}>Ver</Btn>
                </div>
              ))}
            </div>
          </div>
        )}

        {saved && (
          <div className="a0" style={{marginTop:16,background:t.greenDim,border:`1px solid ${t.green}40`,borderRadius:12,padding:"14px 18px",display:"flex",alignItems:"center",gap:10}}>
            <Ic d={ico.check} size={16} color={t.green}/>
            <div>
              <div style={{fontSize:13,fontWeight:600,color:t.green}}>Briefing salvo com sucesso!</div>
              <div style={{fontSize:12,color:t.textMuted,marginTop:1}}>Os campos foram limpos. Seu histórico foi registrado abaixo.</div>
            </div>
          </div>
        )}
      </main>

      {viewSnap && <SummaryModal snap={viewSnap} t={t} onClose={()=>setViewSnap(null)}/>}
    </div>
  );
}

function AdminView({ onLogout, t, isDark, toggleDark }) {
  const [tab,       setTab]      = useState("clientes");
  const [clients,   setClients]  = useState([]);
  const [selected,  setSelected] = useState(null);
  const [snapList,  setSnapList] = useState([]);
  const [answers,   setAnswers]  = useState({});
  const [checklist, setChecklist]= useState({});
  const [links,     setLinks]    = useState([]);
  const [files,     setFiles]    = useState([]);
  const [open,      setOpen]     = useState({});
  const [viewSnap,  setViewSnap] = useState(null);
  const [loading,   setLoading]  = useState(false);
  const [playlist,  setPlaylist] = useState("");
  const [plInput,   setPlInput]  = useState("");
  const [plEdit,    setPlEdit]   = useState(false);
  const [newClient, setNewClient]= useState("");
  const [saved,     setSaved]    = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const list = await listClients();
        setClients(list || []);
      } catch (err) {
        console.error("Erro ao listar clientes:", err);
      }
    }
    load();
  }, []);

  const selectClient = async (c) => {
    setLoading(true);
    setSelected(c);
    setOpen({});
    try {
      const client = await getClient(c.client_id);
      setAnswers(client?.answers || {});
      const snaps = await listSnapshots(c.client_id);
      setSnapList(snaps || []);
      if ((!client?.answers || Object.keys(client.answers).length === 0) && snaps?.length > 0) {
        setAnswers(snaps[0].answers || {});
      }
      const meta = await getMeta(c.client_id);
      setChecklist(meta?.checklist || {});
      setLinks(meta?.links || []);
      setPlaylist(meta?.playlist || "");
    } catch (err) {
      console.error("Erro ao carregar cliente:", err);
    }
    setLoading(false);
    setTab("briefing");
  };

  const saveMeta = async () => {
    if (!selected) return;
    try {
      await saveMeta(selected.client_id, checklist, links, playlist);
      setSaved(true);
      setTimeout(()=>setSaved(false),2000);
    } catch (err) {
      console.error("Erro ao salvar meta:", err);
    }
  };

  const addClient = async () => {
    if (!newClient.trim()) return;
    try {
      const id = clientKey(newClient.trim());
      await upsertClient(id, newClient.trim(), {});
      const list = await listClients();
      setClients(list || []);
      setNewClient("");
    } catch (err) {
      console.error("Erro ao adicionar cliente:", err);
    }
  };

  const deleteSnap = async (snap) => {
    if (!confirm("Remover este registro?")) return;
    try {
      await deleteSnapshot(snap.client_id, snap.saved_at);
      const snaps = await listSnapshots(selected.client_id);
      setSnapList(snaps || []);
    } catch (err) {
      console.error("Erro ao deletar snapshot:", err);
    }
  };

  const { total, done, pct } = countFilled(answers);
  const checkDone = CHECKLIST.filter(c=>checklist[c.id]).length;
  const toggleCheck = id => setChecklist(p=>({...p,[id]:!p[id]}));

  const embedUrl = url => {
    if (!url) return "";
    if (url.includes("spotify.com/playlist")) { const id=url.split("/playlist/")[1]?.split("?")[0]; return `https://open.spotify.com/embed/playlist/${id}?utm_source=generator&theme=0`; }
    if (url.includes("youtube.com/playlist")) { const id=url.split("list=")[1]?.split("&")[0]; return `https://www.youtube.com/embed?listType=playlist&list=${id}`; }
    if (url.includes("youtu.be")||url.includes("youtube.com/watch")) { const id=url.includes("youtu.be")?url.split("youtu.be/")[1]:url.split("v=")[1]?.split("&")[0]; return `https://www.youtube.com/embed/${id}`; }
    return url;
  };

  const tabs=[
    {id:"clientes", label:"Clientes",   icon:"client"},
    {id:"briefing", label:"Briefing",   icon:"edit"},
    {id:"checklist",label:"Onboarding", icon:"check"},
    {id:"arquivos", label:"Arquivos",   icon:"link"},
    {id:"playlist", label:"Playlist",   icon:"music"},
    {id:"historico",label:"Histórico",  icon:"history"},
  ];

  return (
    <div style={{minHeight:"100vh",background:t.bg}}>
      <div style={{position:"fixed",top:-80,right:-80,width:320,height:320,borderRadius:"50%",background:`radial-gradient(circle,${t.roseDim},transparent 70%)`,pointerEvents:"none",zIndex:0}}/>

      <header style={{position:"sticky",top:0,zIndex:100,background:`${t.bg}ee`,backdropFilter:"blur(18px)",borderBottom:`1px solid ${t.border}`}}>
        <div style={{maxWidth:1080,margin:"0 auto",padding:"0 18px",height:56,display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
          <div style={{display:"flex",alignItems:"center",gap:9}}>
            <div style={{width:32,height:32,borderRadius:8,background:`linear-gradient(135deg,${t.rose},${t.gold})`,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <Ic d={ico.bolt} size={15} color="#fff" fill="#fff" sw={1.5}/>
            </div>
            <div>
              <div style={{fontSize:13,fontWeight:700,color:t.text,lineHeight:1}}>KyB LAB</div>
              <div style={{fontSize:10,color:t.rose,fontWeight:600}}>Admin</div>
            </div>
            {selected && (
              <>
                <span style={{color:t.textDim,fontSize:14}}>›</span>
                <span style={{fontSize:13,fontWeight:600,color:t.textMid}}>{selected.client_name}</span>
              </>
            )}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <button onClick={toggleDark} style={{background:t.surface,border:`1px solid ${t.border}`,borderRadius:7,width:30,height:30,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:t.textMuted}}>
              <Ic d={isDark?ico.sun:ico.moon} size={13}/>
            </button>
            <Btn onClick={saveMeta} variant="nude" icon={saved?"check":"save"} size="sm" t={t}>{saved?"Salvo!":"Salvar"}</Btn>
            <Btn onClick={onLogout} variant="ghost" icon="logout" size="sm" t={t}>Sair</Btn>
          </div>
        </div>
      </header>

      <div style={{maxWidth:1080,margin:"0 auto",padding:"14px 18px 8px"}}>
        <div style={{display:"flex",gap:3,background:t.surface,border:`1px solid ${t.border}`,borderRadius:13,padding:4,overflowX:"auto",boxShadow:`0 1px 6px ${t.shadow}`}}>
          {tabs.map(tb=>(
            <button key={tb.id} onClick={()=>setTab(tb.id)} style={{display:"inline-flex",alignItems:"center",gap:6,padding:"7px 15px",borderRadius:9,border:"none",cursor:"pointer",fontFamily:"'Outfit',sans-serif",fontSize:12,fontWeight:600,whiteSpace:"nowrap",transition:"all .17s",background:tab===tb.id?`linear-gradient(135deg,${t.rose},${t.roseDark})`:"transparent",color:tab===tb.id?"#fff":t.textMuted}}>
              <Ic d={ico[tb.icon]} size={12} color={tab===tb.id?"#fff":t.textMuted}/>
              {tb.label}
            </button>
          ))}
        </div>
      </div>

      <main style={{maxWidth:1080,margin:"0 auto",padding:"8px 18px 80px"}}>

        {tab==="clientes" && (
          <div className="a0">
            <div style={{background:t.surface,border:`1px solid ${t.border}`,borderRadius:16,padding:22,marginBottom:14,boxShadow:`0 2px 10px ${t.shadow}`}}>
              <h2 className="pf" style={{fontSize:20,color:t.text,marginBottom:4}}>Clientes</h2>
              <p style={{color:t.textMuted,fontSize:12,marginBottom:18}}>Selecione um cliente para ver e gerenciar o briefing.</p>
              <div style={{display:"flex",gap:8,marginBottom:18,flexWrap:"wrap"}}>
                <input value={newClient} onChange={e=>setNewClient(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addClient()} placeholder="Nome do novo cliente..." style={{flex:1,minWidth:180,background:t.bgWarm,border:`1px solid ${t.border}`,borderRadius:9,padding:"9px 13px",color:t.text,fontSize:13,outline:"none"}}/>
                <Btn onClick={addClient} icon="plus" size="sm" t={t}>Adicionar</Btn>
              </div>
              {clients.length===0 && <p style={{color:t.textDim,fontSize:13,textAlign:"center",padding:"24px 0"}}>Nenhum cliente cadastrado ainda.</p>}
              <div style={{display:"flex",flexDirection:"column",gap:7}}>
                {clients.map(c=>{
                  const {pct:cp, done:cd, total:ct} = countFilled(c.answers);
                  return (
                    <button key={c.client_id} onClick={()=>selectClient(c)} style={{display:"flex",alignItems:"center",gap:13,padding:"13px 16px",background:selected?.client_id===c.client_id?t.roseDim:t.surfaceAlt,border:`1.5px solid ${selected?.client_id===c.client_id?t.rose+"50":t.border}`,borderRadius:11,cursor:"pointer",textAlign:"left",transition:"all .17s"}}>
                      <div style={{width:36,height:36,borderRadius:10,background:`linear-gradient(135deg,${t.rose}30,${t.gold}30)`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:16}}>
                        {c.client_name[0].toUpperCase()}
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:13,fontWeight:700,color:t.text}}>{c.client_name}</div>
                        <div style={{fontSize:11,color:t.textMuted,marginTop:1}}>Atualizado: {c.updated_at?fmtDate(c.updated_at):"—"}</div>
                        <div style={{marginTop:5}}><Bar pct={cp} color={t.rose} thin t={t}/></div>
                      </div>
                      <div style={{textAlign:"right",flexShrink:0}}>
                        <div style={{fontSize:13,fontWeight:700,color:cp===100?t.green:t.rose}}>{cp}%</div>
                        <div style={{fontSize:10,color:t.textDim}}>{cd}/{ct}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {tab==="briefing" && (
          <div className="a0">
            {!selected ? (
              <div style={{textAlign:"center",padding:"48px 0",color:t.textMuted,fontSize:13}}>Selecione um cliente na aba <strong>Clientes</strong> para ver o briefing.</div>
            ) : loading ? (
              <div style={{textAlign:"center",padding:"48px 0",color:t.textMuted}}>Carregando...</div>
            ) : (
              <>
                <div style={{background:t.surface,border:`1px solid ${t.border}`,borderRadius:16,padding:"18px 20px",marginBottom:12,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
                  <div>
                    <span style={{fontSize:12,color:t.textMuted}}>Briefing de </span>
                    <span style={{fontSize:14,fontWeight:700,color:t.rose}}>{selected.client_name}</span>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:9}}>
                    <Bar pct={pct} color={t.rose} t={t}/>
                    <span style={{fontSize:12,color:t.textMuted,width:60}}>{done}/{total}</span>
                    <Btn onClick={()=>snapList[0]&&setViewSnap(snapList[0])} variant="nude" icon="eye" size="sm" t={t} disabled={!snapList.length}>Ver último</Btn>
                  </div>
                </div>
                {SECTIONS.map(sec=>{
                  const sc=t[sec.colorKey], fc=sec.questions.filter(q=>answers[q.id]).length, isO=!!open[sec.id];
                  return (
                    <div key={sec.id} style={{marginBottom:7}}>
                      <button onClick={()=>setOpen(p=>({...p,[sec.id]:!p[sec.id]}))} style={{width:"100%",background:isO?t.surface:t.bg,border:`1px solid ${isO?t.borderMid:t.border}`,borderRadius:isO?"12px 12px 0 0":12,padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer"}}>
                        <div style={{display:"flex",alignItems:"center",gap:10}}>
                          <span style={{fontSize:14,color:sc}}>{sec.icon}</span>
                          <span style={{fontSize:13,fontWeight:700,color:t.text}}>{sec.title}</span>
                        </div>
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          <span style={{fontSize:11,color:fc===sec.questions.length?t.green:t.textDim,fontWeight:600}}>{fc}/{sec.questions.length}</span>
                          <Ic d={isO?ico.chev:ico.chevR} size={13} color={t.textDim}/>
                        </div>
                      </button>
                      {isO && (
                        <div style={{background:t.surface,border:`1px solid ${t.borderMid}`,borderTop:"none",borderRadius:"0 0 12px 12px",padding:"18px 16px"}}>
                          {sec.questions.map(q=>(
                            <Question key={q.id} q={q} value={answers[q.id]} onChange={v=>{}} t={t} sectionColor={sc}/>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}

        {tab==="checklist" && (
          <div className="a0" style={{background:t.surface,border:`1px solid ${t.border}`,borderRadius:16,padding:24,boxShadow:`0 2px 10px ${t.shadow}`}}>
            {!selected ? <p style={{color:t.textMuted,fontSize:13,textAlign:"center",padding:"32px 0"}}>Selecione um cliente primeiro.</p> : (
              <>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18,flexWrap:"wrap",gap:10}}>
                  <div>
                    <h2 className="pf" style={{fontSize:20,color:t.text}}>Onboarding</h2>
                    <p style={{color:t.textMuted,fontSize:12,marginTop:2}}>{selected.client_name}</p>
                  </div>
                  <div style={{fontSize:24,fontWeight:800,color:t.green}}>{checkDone}<span style={{fontSize:12,color:t.textDim,fontWeight:400}}>/{CHECKLIST.length}</span></div>
                </div>
                <Bar pct={(checkDone/CHECKLIST.length)*100} color={t.green} t={t}/>
                <div style={{marginTop:16,display:"flex",flexDirection:"column",gap:7}}>
                  {CHECKLIST.map((step,i)=>(
                    <div key={step.id} onClick={()=>toggleCheck(step.id)} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",borderRadius:10,cursor:"pointer",transition:"all .15s",background:checklist[step.id]?t.greenDim:t.surfaceAlt,border:`1px solid ${checklist[step.id]?t.green+"40":t.border}`}}>
                      <div style={{width:20,height:20,borderRadius:5,border:`2px solid ${checklist[step.id]?t.green:t.borderMid}`,background:checklist[step.id]?t.green:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all .15s"}}>
                        {checklist[step.id]&&<Ic d={ico.check} size={10} color="#fff" sw={3}/>}
                      </div>
                      <span style={{fontSize:13,color:checklist[step.id]?t.text:t.textMid,fontWeight:checklist[step.id]?600:400,flex:1}}>{step.text}</span>
                      <span style={{fontSize:10,color:t.textDim}}>{i+1}</span>
                    </div>
                  ))}
                </div>
                <div style={{marginTop:14,display:"flex",justifyContent:"flex-end"}}>
                  <Btn onClick={saveMeta} variant="green" icon={saved?"check":"save"} t={t}>{saved?"Salvo!":"Salvar Checklist"}</Btn>
                </div>
              </>
            )}
          </div>
        )}

        {tab==="arquivos" && (
          <div className="a0">
            {!selected ? <div style={{textAlign:"center",padding:"48px 0",color:t.textMuted,fontSize:13}}>Selecione um cliente primeiro.</div> : (
              <div style={{display:"grid",gap:14,gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))"}}>
                <div style={{background:t.surface,border:`1px solid ${t.border}`,borderRadius:16,padding:22}}>
                  <h3 style={{fontSize:14,fontWeight:700,color:t.text,marginBottom:4}}>Links</h3>
                  <p style={{fontSize:11,color:t.textMuted,marginBottom:14}}>Drive, Notion, referências, portfólio...</p>
                  <LinkArea links={links} setLinks={setLinks} t={t}/>
                  <div style={{marginTop:12}}><Btn onClick={saveMeta} variant="nude" icon="save" size="sm" t={t}>Salvar links</Btn></div>
                </div>
                <div style={{background:t.surface,border:`1px solid ${t.border}`,borderRadius:16,padding:22}}>
                  <h3 style={{fontSize:14,fontWeight:700,color:t.text,marginBottom:4}}>Referências Visuais</h3>
                  <p style={{fontSize:11,color:t.textMuted,marginBottom:14}}>Imagens, PDFs, moodboard</p>
                  <FileArea files={files} setFiles={setFiles} t={t}/>
                </div>
              </div>
            )}
          </div>
        )}

        {tab==="playlist" && (
          <div className="a0" style={{background:t.surface,border:`1px solid ${t.border}`,borderRadius:16,padding:24}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18,flexWrap:"wrap",gap:10}}>
              <div>
                <h2 className="pf" style={{fontSize:20,color:t.text}}>Playlist</h2>
                <p style={{color:t.textMuted,fontSize:12,marginTop:2}}>A trilha sonora da KyB LAB 🎵</p>
              </div>
              <Btn onClick={()=>setPlEdit(s=>!s)} variant="nude" icon="music" size="sm" t={t}>{playlist?"Trocar":"Adicionar"}</Btn>
            </div>
            {plEdit&&(
              <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
                <input value={plInput} onChange={e=>setPlInput(e.target.value)} placeholder="Link Spotify ou YouTube..." style={{flex:1,minWidth:180,background:t.bgWarm,border:`1px solid ${t.border}`,borderRadius:9,padding:"9px 13px",color:t.text,fontSize:13,outline:"none"}}/>
                <Btn onClick={()=>{setPlaylist(plInput);setPlInput("");setPlEdit(false);saveMeta();}} t={t} size="sm">Carregar</Btn>
              </div>
            )}
            {playlist ? (
              <iframe src={embedUrl(playlist)} width="100%" height={360} frameBorder="0" allow="autoplay;clipboard-write;encrypted-media;fullscreen;picture-in-picture" loading="lazy" style={{borderRadius:13,border:`1px solid ${t.border}`}}/>
            ) : (
              <div style={{border:`2px dashed ${t.borderMid}`,borderRadius:13,padding:"52px 20px",textAlign:"center",background:t.surfaceAlt}}>
                <Ic d={ico.music} size={32} color={t.textDim}/>
                <p style={{color:t.textMuted,fontSize:13,marginTop:10}}>Nenhuma playlist conectada</p>
              </div>
            )}
          </div>
        )}

        {tab==="historico" && (
          <div className="a0">
            {!selected ? <div style={{textAlign:"center",padding:"48px 0",color:t.textMuted,fontSize:13}}>Selecione um cliente primeiro.</div> : (
              <div style={{background:t.surface,border:`1px solid ${t.border}`,borderRadius:16,padding:22}}>
                <h2 className="pf" style={{fontSize:20,color:t.text,marginBottom:4}}>Histórico de Briefings</h2>
                <p style={{color:t.textMuted,fontSize:12,marginBottom:18}}>{selected.client_name} · {snapList.length} versão(ões) salva(s)</p>
                {snapList.length===0 ? (
                  <p style={{color:t.textDim,fontSize:13,textAlign:"center",padding:"32px 0"}}>Nenhum briefing salvo ainda.</p>
                ) : (
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    {snapList.map((snap,i)=>(
                      <div key={snap.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:t.surfaceAlt,border:`1px solid ${t.border}`,borderRadius:11,padding:"13px 16px",gap:12,flexWrap:"wrap"}}>
                        <div style={{display:"flex",alignItems:"center",gap:10}}>
                          <div style={{width:32,height:32,borderRadius:8,background:t.roseDim,display:"flex",alignItems:"center",justifyContent:"center"}}>
                            <Ic d={ico.history} size={15} color={t.rose}/>
                          </div>
                          <div>
                            <div style={{fontSize:13,fontWeight:600,color:t.text}}>Versão {snapList.length-i} · {fmtDate(snap.saved_at)}</div>
                            <div style={{fontSize:11,color:t.textMuted,marginTop:1}}>{Object.values(snap.answers||{}).filter(v=>v&&v.trim()).length} respostas preenchidas</div>
                          </div>
                        </div>
                        <div style={{display:"flex",gap:7}}>
                          <Btn onClick={()=>setViewSnap(snap)} variant="nude" size="sm" icon="eye" t={t}>Ver</Btn>
                          <Btn onClick={()=>deleteSnap(snap)} variant="danger" size="sm" icon="trash" t={t}>Del</Btn>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </main>

      {viewSnap && <SummaryModal snap={viewSnap} t={t} onClose={()=>setViewSnap(null)} isAdmin/>}
    </div>
  );
}

function LinkArea({ links, setLinks, t }) {
  const [url, setUrl]=useState(""); const [lbl, setLbl]=useState("");
  const add=()=>{ if(!url.trim())return; setLinks([...links,{id:Date.now(),label:lbl||url,url}]); setUrl(""); setLbl(""); };
  return (
    <div>
      <div style={{display:"flex",gap:7,marginBottom:10,flexWrap:"wrap"}}>
        <input value={lbl} onChange={e=>setLbl(e.target.value)} placeholder="Nome" style={{flex:1,minWidth:80,background:t.bgWarm,border:`1px solid ${t.border}`,borderRadius:8,padding:"7px 11px",color:t.text,fontSize:12,outline:"none"}}/>
        <input value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://..." onKeyDown={e=>e.key==="Enter"&&add()} style={{flex:2,minWidth:120,background:t.bgWarm,border:`1px solid ${t.border}`,borderRadius:8,padding:"7px 11px",color:t.text,fontSize:12,outline:"none"}}/>
        <Btn onClick={add} icon="plus" size="sm" t={t}>Add</Btn>
      </div>
      <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
        {links.map(l=>(
          <div key={l.id} style={{display:"inline-flex",alignItems:"center",gap:6,background:t.roseDim,border:`1px solid ${t.rose}25`,borderRadius:7,padding:"5px 10px"}}>
            <Ic d={ico.link} size={11} color={t.rose}/><a href={l.url} target="_blank" rel="noreferrer" style={{color:t.rose,fontSize:12,textDecoration:"none",fontWeight:500}}>{l.label}</a>
            <button onClick={()=>setLinks(links.filter(x=>x.id!==l.id))} style={{background:"none",border:"none",cursor:"pointer",color:t.textDim,padding:0,fontSize:13,lineHeight:1}}>×</button>
          </div>
        ))}
        {!links.length&&<span style={{color:t.textDim,fontSize:12}}>Nenhum link ainda.</span>}
      </div>
    </div>
  );
}
function FileArea({ files, setFiles, t }) {
  const ref=useRef();
  const handle=e=>{ const list=Array.from(e.target.files||[]); setFiles(p=>[...p,...list.map(f=>({id:Date.now()+Math.random(),name:f.name,type:f.type,url:URL.createObjectURL(f)}))]); };
  return (
    <div>
      <div onClick={()=>ref.current?.click()} onMouseEnter={e=>e.currentTarget.style.borderColor=t.rose+"60"} onMouseLeave={e=>e.currentTarget.style.borderColor=t.borderMid}
        style={{border:`2px dashed ${t.borderMid}`,borderRadius:11,padding:"24px 14px",textAlign:"center",cursor:"pointer",transition:"border-color .2s",background:t.surfaceAlt}}>
        <Ic d={ico.upload} size={20} color={t.textDim}/><br/>
        <span style={{color:t.textMuted,fontSize:12,marginTop:7,display:"block"}}>Clique para enviar</span>
        <input ref={ref} type="file" multiple accept="image/*,.pdf,.pptx,.docx" onChange={handle} style={{display:"none"}}/>
      </div>
      {files.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:7,marginTop:10}}>
        {files.map(f=>(
          <div key={f.id} style={{display:"flex",alignItems:"center",gap:7,background:t.surface,border:`1px solid ${t.border}`,borderRadius:7,padding:"5px 9px",maxWidth:170}}>
            {f.type.startsWith("image/")?<img src={f.url} alt={f.name} style={{width:22,height:22,borderRadius:3,objectFit:"cover"}}/>:<Ic d={ico.save} size={13} color={t.gold}/>}
            <span style={{fontSize:11,color:t.textMuted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{f.name}</span>
            <button onClick={()=>setFiles(files.filter(x=>x.id!==f.id))} style={{background:"none",border:"none",cursor:"pointer",color:t.textDim,padding:0}}>×</button>
          </div>
        ))}
      </div>}
    </div>
  );
}

export default function App() {
  const [isDark,  setIsDark]  = useState(false);
  const [session, setSession] = useState(null);

  const t = THEMES[isDark ? "dark" : "light"];
  const toggleDark = () => setIsDark(d => !d);

  const handleLogin  = (role, name) => setSession({ role, name });
  const handleLogout = () => setSession(null);

  return (
    <>
      <style>{makeCSS(t)}</style>
      {!session && <LoginScreen onLogin={handleLogin} t={t} isDark={isDark} toggleDark={toggleDark}/>}
      {session?.role === "admin"  && <AdminView  onLogout={handleLogout} t={t} isDark={isDark} toggleDark={toggleDark}/>}
      {session?.role === "client" && <ClientView clientName={session.name} onLogout={handleLogout} t={t} isDark={isDark} toggleDark={toggleDark}/>}
    </>
  );
}
