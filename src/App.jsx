import { useState, useEffect, useRef } from "react";
import { useAuth } from "./contexts/AuthContext";
import AuthPage from "./components/AuthPage";
import OnboardingView from "./components/OnboardingView";
import UserProfileView from "./components/UserProfileView";
import AreaChartDemo from "./components/ui/demo";
import CRMView from "./components/ui/crm-view";
import MessagesView from "./components/ui/messages-view";
import ProspectingView from "./components/ui/prospecting-view";
import ProjectsView from "./components/ui/projects-view";
import CalendarView from "./components/ui/calendar-view";
import DocsView from "./components/ui/docs-view";
import DeliverablesView from "./components/ui/deliverables-view";
import ClientPortalView from "./components/ui/client-portal-view";
import AutomationsView from "./components/ui/automations-view";
import FinancialsView from "./components/ui/financials-view";
import SettingsView from "./components/ui/settings-view";
import { supabase } from './lib/supabase';

const salesData = [
  { month:"Jan",profit:3200,expense:1800 },{ month:"Feb",profit:4100,expense:2200 },
  { month:"Mar",profit:5800,expense:2600 },{ month:"Apr",profit:4600,expense:3100 },
  { month:"May",profit:7200,expense:2800 },{ month:"Jun",profit:9200,expense:2600 },
  { month:"Jul",profit:6800,expense:3200 },{ month:"Aug",profit:5400,expense:2400 },
  { month:"Sep",profit:4200,expense:1900 },{ month:"Oct",profit:3800,expense:2100 },
  { month:"Nov",profit:5100,expense:2800 },{ month:"Dec",profit:6400,expense:3400 },
];
const scheduleItems = [
  { time:"09:30 AM",date:"Wed, 11 Jan",title:"Business Analytics Press",who:"David McGuaire and 20+ more",done:true },
  { time:"10:35 AM",date:"Wed, 11 Jan",title:"Business Sprint",who:"Jonas Kahnwald and 5+ more",done:false },
  { time:"1:15 PM",date:"Wed, 11 Jan",title:"Customer Review Meeting",who:"Natashia Bahroff and 6+ more",done:false },
  { time:"2:45 AM",date:"Wed, 11 Jan",title:"Daily Office Meeting",who:"Alexa Martha and 32+ more",done:false },
  { time:"09:30 AM",date:"Thu, 12 Jan",title:"Sales Strategy Meeting",who:"Frederinn Kowalski and 12+ more",done:false },
];
const calDays=[8,9,10,11,12,13,14];
const dayN=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const mx=Math.max(...salesData.map(d=>d.profit));
const VOLT="#ccfd01",VOLTD="#b8e300";

const notifications = [
  { id:1, app:"Calendar", color:VOLT, textColor:"#0a0a0a", title:"Business Analytics Press", body:"Starting in 15 minutes · Conference Room B", time:"2m ago",
    icon:<svg width="16" height="16" fill="none" viewBox="0 0 16 16"><rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.2"/><path d="M2 6.5H14" stroke="currentColor" strokeWidth="1.2"/><path d="M5 1.5V4M11 1.5V4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg> },
  { id:2, app:"Calendar", color:VOLT, textColor:"#0a0a0a", title:"Business Sprint", body:"Starts at 10:35 AM · Jonas Kahnwald invited you", time:"5m ago",
    icon:<svg width="16" height="16" fill="none" viewBox="0 0 16 16"><rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.2"/><path d="M2 6.5H14" stroke="currentColor" strokeWidth="1.2"/><path d="M5 1.5V4M11 1.5V4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg> },
  { id:3, app:"Mail", color:"#5AC8FA", textColor:"#fff", title:"New proposal from Acme Corp", body:"Hi Anthony, please review the attached proposal for Q2...", time:"18m ago",
    icon:<svg width="16" height="16" fill="none" viewBox="0 0 16 16"><rect x="1.5" y="3.5" width="13" height="9" rx="2" stroke="currentColor" strokeWidth="1.2"/><path d="M1.5 5.5L8 9.5L14.5 5.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg> },
  { id:4, app:"Mail", color:"#5AC8FA", textColor:"#fff", title:"Invoice #4821 paid", body:"Payment of $12,450.00 confirmed by Stripe", time:"1h ago",
    icon:<svg width="16" height="16" fill="none" viewBox="0 0 16 16"><rect x="1.5" y="3.5" width="13" height="9" rx="2" stroke="currentColor" strokeWidth="1.2"/><path d="M1.5 5.5L8 9.5L14.5 5.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg> },
  { id:5, app:"Analytics", color:"#FFB340", textColor:"#fff", title:"Weekly report ready", body:"Your business overview for Jan 2–8 is available", time:"2h ago",
    icon:<svg width="16" height="16" fill="none" viewBox="0 0 16 16"><path d="M2 12L5.5 8L8.5 10.5L14 4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  { id:6, app:"System", color:"#FF6259", textColor:"#fff", title:"Storage almost full", body:"You've used 92% of your cloud storage. Manage files to free up space.", time:"3h ago",
    icon:<svg width="16" height="16" fill="none" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.2"/><path d="M8 5V8.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><circle cx="8" cy="11" r="0.6" fill="currentColor"/></svg> },
];

const pal={
  volt:{base:VOLT,dark:VOLTD,glow:"rgba(204,253,1,0.15)",grad:`linear-gradient(135deg,${VOLT},${VOLTD})`},
  coral:{base:"#FF6259",glow:"rgba(255,98,89,0.15)",grad:"linear-gradient(135deg,#FF6259,#E8453C)"},
  amber:{base:"#FFB340",glow:"rgba(255,179,64,0.15)",grad:"linear-gradient(135deg,#FFB340,#F5A623)"},
  teal:{base:"#5AC8FA",glow:"rgba(90,200,250,0.15)",grad:"linear-gradient(135deg,#5AC8FA,#40B4E5)"},
};
const statDefs=[
  {ic:"cust",label:"Total Customers",val:"21,978",ch:"+15%",up:true,p:pal.volt},
  {ic:"actCust",label:"Active Customers",val:"10,369",ch:"-9%",up:false,p:pal.teal},
  {ic:"dollar",label:"Profit Total",val:"$64,981.97",ch:"+7.2%",up:true,p:pal.amber},
  {ic:"expense",label:"Expense Total",val:"$18,158.21",ch:"-2%",up:false,p:pal.coral},
];
const cardGrads={
  light:[
    `linear-gradient(135deg,rgba(204,253,1,0.08) 0%,rgba(255,255,255,0.85) 60%)`,
    `linear-gradient(135deg,rgba(90,200,250,0.06) 0%,rgba(255,255,255,0.85) 60%)`,
    `linear-gradient(135deg,rgba(255,179,64,0.06) 0%,rgba(255,255,255,0.85) 60%)`,
    `linear-gradient(135deg,rgba(255,98,89,0.06) 0%,rgba(255,255,255,0.85) 60%)`,
  ],
  dark:[
    `linear-gradient(135deg,rgba(204,253,1,0.07) 0%,rgba(255,255,255,0.025) 60%)`,
    `linear-gradient(135deg,rgba(90,200,250,0.07) 0%,rgba(255,255,255,0.025) 60%)`,
    `linear-gradient(135deg,rgba(255,179,64,0.07) 0%,rgba(255,255,255,0.025) 60%)`,
    `linear-gradient(135deg,rgba(255,98,89,0.07) 0%,rgba(255,255,255,0.025) 60%)`,
  ],
};

const T={
  light:{
    shell:"#F2EFE9",sidebar:"rgba(255,255,255,0.78)",sidebarBorder:"rgba(0,0,0,0.05)",
    sidebarShadow:"0 8px 40px rgba(0,0,0,0.06),0 1px 3px rgba(0,0,0,0.03)",
    card:"rgba(255,255,255,0.82)",cardBorder:"rgba(0,0,0,0.05)",
    cardShadow:"0 1px 3px rgba(0,0,0,0.03),0 4px 16px rgba(0,0,0,0.025)",
    text:"#1a1a1f",sub:"#6b7280",muted:"#b0b5bf",
    accent:VOLTD,accentText:"#1a1a1f",accentGrad:`linear-gradient(135deg,${VOLT},${VOLTD})`,
    accentGlow:`0 3px 14px rgba(204,253,1,0.3)`,
    gridLine:"rgba(0,0,0,0.05)",expenseLine:"#FFB340",expenseLineSub:"rgba(255,179,64,0.08)",
    input:"rgba(0,0,0,0.03)",inputBorder:"rgba(0,0,0,0.06)",divider:"rgba(0,0,0,0.045)",
    chk:"rgba(0,0,0,0.14)",tipBg:"rgba(255,255,255,0.97)",tipBorder:"rgba(0,0,0,0.06)",
    tipShadow:"0 4px 24px rgba(0,0,0,0.08)",ringTrack:"rgba(0,0,0,0.06)",red:"#FF3B30",
    notifBg:"rgba(245,243,238,0.85)",notifCard:"rgba(255,255,255,0.7)",
    notifShadow:"0 12px 48px rgba(0,0,0,0.12),0 2px 6px rgba(0,0,0,0.04)",
    notifCardBorder:"rgba(0,0,0,0.06)",
  },
  dark:{
    shell:"#08080a",sidebar:"rgba(18,18,22,0.7)",sidebarBorder:"rgba(255,255,255,0.06)",
    sidebarShadow:"0 8px 40px rgba(0,0,0,0.45),0 0 80px rgba(204,253,1,0.015)",
    card:"rgba(255,255,255,0.03)",cardBorder:"rgba(255,255,255,0.055)",
    cardShadow:"0 1px 3px rgba(0,0,0,0.25),0 4px 16px rgba(0,0,0,0.15)",
    text:"#f0f0f5",sub:"#8b8fa3",muted:"#3f4150",
    accent:VOLT,accentText:"#0a0a0a",accentGrad:`linear-gradient(135deg,${VOLT},${VOLTD})`,
    accentGlow:`0 3px 18px rgba(204,253,1,0.18)`,
    gridLine:"rgba(255,255,255,0.04)",expenseLine:"#FFB340",expenseLineSub:"rgba(255,179,64,0.06)",
    input:"rgba(255,255,255,0.04)",inputBorder:"rgba(255,255,255,0.07)",divider:"rgba(255,255,255,0.04)",
    chk:"rgba(255,255,255,0.14)",tipBg:"rgba(22,22,28,0.97)",tipBorder:"rgba(255,255,255,0.08)",
    tipShadow:"0 4px 24px rgba(0,0,0,0.3)",ringTrack:"rgba(255,255,255,0.06)",red:"#FF453A",
    notifBg:"rgba(20,20,24,0.8)",notifCard:"rgba(255,255,255,0.06)",
    notifShadow:"0 12px 48px rgba(0,0,0,0.5),0 2px 6px rgba(0,0,0,0.3)",
    notifCardBorder:"rgba(255,255,255,0.08)",
  },
};

const IC={
  grid:<svg width="18" height="18" fill="none" viewBox="0 0 18 18"><rect x="1.5" y="1.5" width="5.5" height="5.5" rx="2" stroke="currentColor" strokeWidth="1.4"/><rect x="11" y="1.5" width="5.5" height="5.5" rx="2" stroke="currentColor" strokeWidth="1.4"/><rect x="1.5" y="11" width="5.5" height="5.5" rx="2" stroke="currentColor" strokeWidth="1.4"/><rect x="11" y="11" width="5.5" height="5.5" rx="2" stroke="currentColor" strokeWidth="1.4"/></svg>,
  chart:<svg width="18" height="18" fill="none" viewBox="0 0 18 18"><path d="M2 14L6.5 9L10 12L16 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  compass:<svg width="18" height="18" fill="none" viewBox="0 0 18 18"><circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.4"/><path d="M12 6L10.5 10.5L6 12L7.5 7.5L12 6Z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round"/></svg>,
  users:<svg width="18" height="18" fill="none" viewBox="0 0 18 18"><circle cx="7" cy="6" r="2.8" stroke="currentColor" strokeWidth="1.4"/><path d="M1.5 16C1.5 13 3.8 11 7 11C10.2 11 12.5 13 12.5 16" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><circle cx="13" cy="6.5" r="1.8" stroke="currentColor" strokeWidth="1.1"/><path d="M14 11C16 11.5 17 13 17 15" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/></svg>,
  mail:<svg width="18" height="18" fill="none" viewBox="0 0 18 18"><rect x="2" y="4" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.4"/><path d="M2 6L9 10L16 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
  star:<svg width="18" height="18" fill="none" viewBox="0 0 18 18"><path d="M9 2L11 7H16L12 10L13.5 15L9 12L4.5 15L6 10L2 7H7L9 2Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg>,
  cog:<svg width="18" height="18" fill="none" viewBox="0 0 18 18"><circle cx="9" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.4"/><path d="M9 1.5V3M9 15V16.5M16.5 9H15M3 9H1.5M14.3 3.7L13.2 4.8M4.8 13.2L3.7 14.3M14.3 14.3L13.2 13.2M4.8 4.8L3.7 3.7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>,
  help:<svg width="18" height="18" fill="none" viewBox="0 0 18 18"><circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.4"/><path d="M7 7C7 5.9 7.9 5 9 5C10.1 5 11 5.9 11 7C11 8 9.5 8 9.5 9.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><circle cx="9.5" cy="12" r="0.5" fill="currentColor"/></svg>,
  search:<svg width="15" height="15" fill="none" viewBox="0 0 15 15"><circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.4"/><path d="M10 10L13.5 13.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
  phone:<svg width="18" height="18" fill="none" viewBox="0 0 18 18"><path d="M2 3C2 2.4 2.4 2 3 2H6L7.5 6L5.5 7.2C6.5 9.5 8.5 11.3 10.5 12.2L11.7 10L16 11.5V15C16 15.6 15.6 16 15 16C8 16 2 10 2 3Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg>,
  bell:<svg width="18" height="18" fill="none" viewBox="0 0 18 18"><path d="M9 2C6.5 2 5 4 5 6.5V10.5L3.5 13H14.5L13 10.5V6.5C13 4 11.5 2 9 2Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/><path d="M7.5 13C7.5 14.1 8.2 15 9 15C9.8 15 10.5 14.1 10.5 13" stroke="currentColor" strokeWidth="1.2"/></svg>,
  chevL:<svg width="14" height="14" fill="none" viewBox="0 0 14 14"><path d="M9 3L5 7L9 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  chevR:<svg width="14" height="14" fill="none" viewBox="0 0 14 14"><path d="M5 3L9 7L5 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  dots:<svg width="16" height="16" fill="none" viewBox="0 0 16 16"><circle cx="3.5" cy="8" r="1" fill="currentColor"/><circle cx="8" cy="8" r="1" fill="currentColor"/><circle cx="12.5" cy="8" r="1" fill="currentColor"/></svg>,
  arrow:<svg width="14" height="14" fill="none" viewBox="0 0 14 14"><path d="M3 7H11M11 7L8 4M11 7L8 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  tUp:<svg width="12" height="12" fill="none" viewBox="0 0 13 13"><path d="M2 9.5L5.5 5.5L7.5 7.5L11 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M8.5 4H11V6.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  tDn:<svg width="12" height="12" fill="none" viewBox="0 0 13 13"><path d="M2 4L5.5 8L7.5 6L11 9.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M8.5 9.5H11V7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  cust:<svg width="16" height="16" fill="none" viewBox="0 0 18 18"><path d="M13 15V13.5C13 12.1 11.9 11 10.5 11H7.5C6.1 11 5 12.1 5 13.5V15" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><circle cx="9" cy="6.5" r="2.8" stroke="currentColor" strokeWidth="1.3"/></svg>,
  actCust:<svg width="16" height="16" fill="none" viewBox="0 0 18 18"><circle cx="6.5" cy="6.5" r="2.5" stroke="currentColor" strokeWidth="1.3"/><path d="M2 15C2 12.5 4 11 6.5 11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><circle cx="12" cy="6.5" r="2.5" stroke="currentColor" strokeWidth="1.3"/><path d="M16 15C16 12.5 14 11 12 11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  dollar:<svg width="16" height="16" fill="none" viewBox="0 0 18 18"><circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.3"/><path d="M9 4.5V13.5M11.5 7C11.5 6 10.4 5.2 9 5.2C7.6 5.2 6.5 6 6.5 7C6.5 8 7.6 8.8 9 8.8C10.4 8.8 11.5 9.6 11.5 10.6C11.5 11.6 10.4 12.4 9 12.4C7.6 12.4 6.5 11.6 6.5 10.6" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/></svg>,
  expense:<svg width="16" height="16" fill="none" viewBox="0 0 18 18"><rect x="2.5" y="4.5" width="13" height="9" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M2.5 8H15.5" stroke="currentColor" strokeWidth="1.3"/><path d="M5.5 11.5H8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  x:<svg width="10" height="10" fill="none" viewBox="0 0 10 10"><path d="M2 2L8 8M8 2L2 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
  package:<svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><path stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12"/></svg>,
  zap:<svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
};

const navM=[{ic:"grid",label:"Dashboard"},{ic:"compass",label:"Prospecting"},{ic:"users",label:"CRM"},{ic:"chart",label:"Projects"},{ic:"bell",label:"Calendar"},{ic:"zap",label:"Automations"},{ic:"dollar",label:"Financials"}];
const navS=[{ic:"star",label:"Docs"},{ic:"mail",label:"Messages"},{ic:"cog",label:"Settings"}];

function useWidth(){const[w,setW]=useState(typeof window!=='undefined'?window.innerWidth:1200);useEffect(()=>{const u=()=>setW(window.innerWidth);window.addEventListener("resize",u);return()=>window.removeEventListener("resize",u)},[]);return w;}

function Toggle({dark,flip}){
  return(
    <button onClick={flip} style={{position:"relative",width:54,height:28,borderRadius:14,border:"none",
      background:dark?"linear-gradient(135deg,#1a1a22,#2a2a32)":"linear-gradient(135deg,#f0ebe3,#e5dfd5)",
      cursor:"pointer",padding:0,transition:"all 0.5s cubic-bezier(.4,0,.2,1)",overflow:"hidden",flexShrink:0}}>
      <div style={{position:"absolute",inset:0,borderRadius:14,
        background:dark?`radial-gradient(circle at 75% 50%,rgba(204,253,1,0.1),transparent 60%)`:"radial-gradient(circle at 25% 50%,rgba(255,179,64,0.2),transparent 60%)",
        transition:"all 0.5s"}}/>
      <div style={{position:"absolute",top:3,left:dark?28:3,width:22,height:22,borderRadius:11,
        background:dark?pal.volt.grad:pal.amber.grad,transition:"all 0.5s cubic-bezier(.4,0,.2,1)",
        display:"flex",alignItems:"center",justifyContent:"center",
        boxShadow:dark?`0 2px 10px rgba(204,253,1,0.35)`:"0 2px 10px rgba(255,179,64,0.45)",
        color:dark?"#0a0a0a":"#fff"}}>
        <svg width="12" height="12" fill="none" viewBox="0 0 16 16" style={{color:"inherit"}}>
          {dark?<path d="M13.5 9.5C12.5 11.5 10.5 13 8 13C4.7 13 2 10.3 2 7C2 4.5 3.5 2.5 5.5 1.5C4.5 3 4.5 5.5 6 7.5C7.5 9.5 10 10.5 13.5 9.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
            :<g><circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.4"/><path d="M8 1.5V3M8 13V14.5M14.5 8H13M3 8H1.5M12.6 3.4L11.5 4.5M4.5 11.5L3.4 12.6M12.6 12.6L11.5 11.5M4.5 4.5L3.4 3.4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></g>}
        </svg>
      </div>
    </button>
  );
}

// ── iOS-Style Notification Panel ──
function NotifPanel({open,onClose,t,dark}){
  const ref=useRef();
  const[dismissed,setDismissed]=useState([]);
  useEffect(()=>{
    if(!open){setDismissed([]);return;}
    const h=(e)=>{if(ref.current&&!ref.current.contains(e.target))onClose();};
    document.addEventListener("mousedown",h);return()=>document.removeEventListener("mousedown",h);
  },[open,onClose]);
  if(!open)return null;
  const visible=notifications.filter(n=>!dismissed.includes(n.id));
  return(
    <div ref={ref} style={{
      position:"absolute",top:48,right:0,width:360,
      background:t.notifBg,backdropFilter:"blur(50px) saturate(1.8)",
      borderRadius:22,border:`1px solid ${t.cardBorder}`,
      boxShadow:t.notifShadow,zIndex:100,
      maxHeight:480,overflowY:"auto",overflowX:"hidden",
      animation:"notifIn 0.3s cubic-bezier(.2,0,.2,1)",
    }}>
      {/* Header */}
      <div style={{position:"sticky",top:0,zIndex:2,
        background:t.notifBg,backdropFilter:"blur(50px)",
        padding:"14px 18px 10px",borderBottom:`1px solid ${t.divider}`,
        display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span style={{fontSize:18,fontWeight:700,color:t.text,letterSpacing:-0.3}}>Notifications</span>
        <button onClick={onClose} style={{
          width:28,height:28,borderRadius:"50%",
          background:dark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.06)",
          display:"flex",alignItems:"center",justifyContent:"center",
          color:t.sub,border:"none",cursor:"pointer"}}>{IC.x}</button>
      </div>

      {/* Notification list — iOS style */}
      <div style={{padding:"8px 10px 12px",display:"flex",flexDirection:"column",gap:6}}>
        {visible.length===0&&(
          <div style={{textAlign:"center",padding:"30px 0",color:t.muted,fontSize:14}}>No new notifications</div>
        )}
        {visible.map((n,i)=>(
          <div key={n.id} style={{
            background:t.notifCard,
            backdropFilter:"blur(30px) saturate(1.5)",
            border:`1px solid ${t.notifCardBorder}`,
            borderRadius:16,padding:"12px 14px",
            position:"relative",
            animation:`notifSlide 0.25s ease ${i*0.04}s backwards`,
            transition:"all 0.3s ease",
          }}>
            {/* Dismiss X */}
            <button onClick={()=>setDismissed(p=>[...p,n.id])} style={{
              position:"absolute",top:8,right:8,width:20,height:20,borderRadius:"50%",
              background:dark?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.04)",
              display:"flex",alignItems:"center",justifyContent:"center",
              color:t.muted,border:"none",cursor:"pointer",opacity:0.6,
            }}>{IC.x}</button>

            <div style={{display:"flex",gap:11,alignItems:"flex-start"}}>
              {/* App icon — iOS rounded square */}
              <div style={{
                width:36,height:36,borderRadius:9,background:n.color,flexShrink:0,
                display:"flex",alignItems:"center",justifyContent:"center",
                color:n.textColor,
                boxShadow:`0 2px 8px ${n.color}33`,
              }}>{n.icon}</div>

              <div style={{flex:1,minWidth:0,paddingRight:16}}>
                {/* App name + time */}
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
                  <span style={{fontSize:12,fontWeight:600,color:t.sub,letterSpacing:0.1}}>{n.app}</span>
                  <span style={{fontSize:11,color:t.muted,fontWeight:400}}>{n.time}</span>
                </div>
                {/* Title */}
                <div style={{fontSize:13,fontWeight:600,color:t.text,lineHeight:1.3,
                  overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{n.title}</div>
                {/* Body */}
                <div style={{fontSize:12,color:t.sub,marginTop:2,lineHeight:1.35,
                  display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{n.body}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SalesChart({t,dark,hBar,setHBar,compact}){
  const chartH=compact?160:200;const pad={top:10,bottom:28};const innerH=chartH-pad.top-pad.bottom;
  const barW=compact?18:28;const gap=compact?6:12;const totalW=salesData.length*(barW+gap)-gap;const scale=mx*1.1;
  const linePoints=salesData.map((d,i)=>{const x=i*(barW+gap)+barW/2;const y=pad.top+innerH-(d.expense/scale)*innerH;return`${x},${y}`;}).join(" ");
  const areaPoints=`0,${pad.top+innerH} ${linePoints} ${(salesData.length-1)*(barW+gap)+barW/2},${pad.top+innerH}`;
  return(
    <div style={{position:"relative",width:"100%",overflowX:"auto",overflowY:"visible"}}>
      <div style={{position:"absolute",left:0,top:pad.top,height:innerH,display:"flex",flexDirection:"column",justifyContent:"space-between",pointerEvents:"none",width:30}}>
        {[10,5,0].map((v,i)=>(<span key={i} style={{fontSize:10,color:t.muted,fontWeight:400,fontVariantNumeric:"tabular-nums"}}>{v}K</span>))}
      </div>
      <div style={{marginLeft:34,position:"relative"}}>
        <svg width="100%" height={chartH} viewBox={`0 0 ${totalW} ${chartH}`} preserveAspectRatio="none" style={{display:"block"}}>
          {[0,.25,.5,.75,1].map((p,i)=>(<line key={i} x1="0" y1={pad.top+innerH*(1-p)} x2={totalW} y2={pad.top+innerH*(1-p)} stroke={t.gridLine} strokeWidth="1"/>))}
          <polygon points={areaPoints} fill={t.expenseLineSub}/>
          <polyline points={linePoints} fill="none" stroke={t.expenseLine} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.7"/>
          {salesData.map((d,i)=>{const x=i*(barW+gap)+barW/2,y=pad.top+innerH-(d.expense/scale)*innerH;
            return<circle key={i} cx={x} cy={y} r={hBar===i?4:2.5} fill={t.expenseLine} opacity={hBar===i?1:0.7} style={{transition:"all 0.25s"}}/>;
          })}
          {salesData.map((d,i)=>{const x=i*(barW+gap),h=(d.profit/scale)*innerH,y=pad.top+innerH-h,isH=hBar===i;
            return(<g key={i}><defs><linearGradient id={`b${i}${dark?'d':'l'}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={VOLT} stopOpacity={isH?1:0.45}/><stop offset="100%" stopColor={VOLTD} stopOpacity={isH?0.85:0.2}/>
            </linearGradient></defs>
            <rect x={x} y={y} width={barW} height={h} rx={7} fill={`url(#b${i}${dark?'d':'l'})`}
              style={{transition:"all 0.3s cubic-bezier(.4,0,.2,1)",cursor:"pointer"}} onMouseEnter={()=>setHBar(i)} onMouseLeave={()=>setHBar(null)}/>
            {isH&&<rect x={x} y={y} width={barW} height={h} rx={7} fill="none" stroke={VOLT} strokeWidth="1.5" opacity="0.4"/>}</g>);
          })}
          {salesData.map((d,i)=>(<text key={i} x={i*(barW+gap)+barW/2} y={chartH-4} textAnchor="middle"
            style={{fontSize:compact?9:11,fill:hBar===i?t.text:t.muted,fontFamily:"inherit",fontWeight:hBar===i?600:400}}>{d.month}</text>))}
        </svg>
        {hBar!==null&&(
          <div style={{position:"absolute",left:hBar*(barW+gap)+barW/2,top:-8,transform:"translateX(-50%)",
            background:t.tipBg,border:`1px solid ${t.tipBorder}`,borderRadius:12,padding:"8px 14px",
            zIndex:10,backdropFilter:"blur(20px) saturate(1.5)",boxShadow:t.tipShadow,
            display:"flex",flexDirection:"column",gap:4,minWidth:100,pointerEvents:"none"}}>
            <div style={{fontSize:11,fontWeight:600,color:t.text,marginBottom:2}}>{salesData[hBar].month} 2023</div>
            {[{l:"Profit",v:salesData[hBar].profit,c:VOLT},{l:"Expense",v:salesData[hBar].expense,c:pal.amber.base}].map((r,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:16}}>
                <div style={{display:"flex",alignItems:"center",gap:5}}><div style={{width:6,height:6,borderRadius:"50%",background:r.c}}/><span style={{fontSize:11,color:t.sub}}>{r.l}</span></div>
                <span style={{fontSize:12,fontWeight:600,color:t.text,fontVariantNumeric:"tabular-nums"}}>${(r.v/1000).toFixed(1)}K</span>
              </div>))}
          </div>)}
      </div>
    </div>
  );
}

function DonutRing({pct,color,size=72,strokeW=7,t}){
  const r=(size-strokeW)/2,circ=2*Math.PI*r,offset=circ*(1-pct/100);
  return(<svg width={size} height={size} style={{transform:"rotate(-90deg)",flexShrink:0}}>
    <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={t.ringTrack} strokeWidth={strokeW}/>
    <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={strokeW}
      strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" style={{transition:"stroke-dashoffset 1s ease"}}/>
  </svg>);
}


function BusinessOverview({ t, dark, mobile, compact, mode, notifOpen, setNotifOpen, w, userName, userEmail, sidebarOpen }) {
  const ease="all 0.45s cubic-bezier(.4,0,.2,1)";
  const card=(ex={})=>({background:t.card,border:`1px solid ${t.cardBorder}`,borderRadius:20,boxShadow:t.cardShadow,transition:ease,backdropFilter:"blur(24px) saturate(1.6)",...ex});
  
  const [dbSalesData, setDbSalesData] = useState(salesData);
  const [dbSchedule, setDbSchedule] = useState(scheduleItems);
  const [dbStats, setDbStats] = useState(statDefs);

  useEffect(() => {
    async function loadDashboard() {
      // 1. Load Calendar Events for the next few items
      const { data: events } = await supabase.from('calendar_events')
        .select('*')
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })
        .limit(5);

      if (events && events.length > 0) {
        setDbSchedule(events.map(e => {
          const d = new Date(e.start_time);
          return {
            time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            date: d.toLocaleDateString([], { weekday: 'short', day: '2-digit', month: 'short' }),
            title: e.title,
            who: e.type.charAt(0).toUpperCase() + e.type.slice(1),
            done: false
          };
        }));
      }

      // 2. Load Stats: Prospects (Total Customers)
      const { count: prospectCount } = await supabase.from('prospects')
        .select('*', { count: 'exact', head: true });
        
      const { data: projects } = await supabase.from('projects').select('*');
      const activeProjects = projects ? projects.filter(p => !['done','cancelled'].includes(p.status)).length : 0;

      // 3. Load Financials
      const { data: txs } = await supabase.from('transactions').select('*');
      let totalExpense = 0;
      let totalProfit = 0;
      if (txs) {
        txs.forEach(t => {
          if (t.type === 'expense') totalExpense += t.amount;
          if (t.type === 'income') totalProfit += t.amount;
        });
      }

      setDbStats([
        {ic:"cust",label:"Total CRM Contacts",val:prospectCount?.toString() || "0",ch:"+0%",up:true,p:pal.volt},
        {ic:"actCust",label:"Active Projects",val:activeProjects.toString(),ch:"+0%",up:true,p:pal.teal},
        {ic:"dollar",label:"Profit Total",val:`$${totalProfit.toLocaleString()}`,ch:"+0%",up:true,p:pal.amber},
        {ic:"expense",label:"Expense Total",val:`$${totalExpense.toLocaleString()}`,ch:"-0%",up:false,p:pal.coral},
      ]);
    }
    loadDashboard();
  }, []);

  return (
    <>


        <header style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",padding:mobile?"4px 2px 0":"8px 4px 0",flexShrink:0,gap:8}}>
          <div style={{minWidth:0,flex:1,marginLeft:mobile&&!sidebarOpen?48:0}}>
            <h1 style={{fontSize:mobile?22:28,fontWeight:700,letterSpacing:-0.6}}>Hello, {(typeof userName === 'string' && userName) || 'there'}!</h1>
            <p style={{fontSize:mobile?12:14,color:t.sub,marginTop:3,fontWeight:400}}>Here's your overview of your business!</p>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
            <button style={{width:38,height:38,borderRadius:"50%",border:`1px solid ${t.cardBorder}`,background:t.card,backdropFilter:"blur(20px)",display:"flex",alignItems:"center",justifyContent:"center",color:t.sub,cursor:"pointer",transition:ease,boxShadow:t.cardShadow}}>
              {IC.phone}</button>
            <div style={{position:"relative"}}>
              <button onClick={()=>setNotifOpen(!notifOpen)} style={{
                width:38,height:38,borderRadius:"50%",border:`1px solid ${t.cardBorder}`,
                background:notifOpen?(dark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.05)"):t.card,
                backdropFilter:"blur(20px)",display:"flex",alignItems:"center",justifyContent:"center",
                color:notifOpen?t.accent:t.sub,cursor:"pointer",transition:ease,boxShadow:t.cardShadow}}>
                {IC.bell}
                <div style={{position:"absolute",top:6,right:7,width:8,height:8,borderRadius:4,background:pal.coral.base,border:`2px solid ${t.shell}`}}/>
              </button>
              <NotifPanel open={notifOpen} onClose={()=>setNotifOpen(false)} t={t} dark={dark}/>
            </div>
            {!mobile&&(
              <div style={{display:"flex",alignItems:"center",gap:10,marginLeft:4,paddingLeft:14,borderLeft:`1px solid ${t.divider}`}}>
                <div style={{width:38,height:38,borderRadius:"50%",background:t.accentGrad,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:600,color:t.accentText,boxShadow:t.accentGlow}}>{(userName || 'U')[0].toUpperCase()}</div>
                <div><div style={{fontSize:13,fontWeight:600}}>{userName || 'User'}</div><div style={{fontSize:11,color:t.sub}}>{userEmail || ''}</div></div>
              </div>)}
          </div>
        </header>

        {/* Stats */}
        <div style={{display:"grid",gridTemplateColumns:mobile?"1fr 1fr":compact?"repeat(2,1fr)":"repeat(4,1fr)",gap:compact?10:12,flexShrink:0}}>
          {dbStats.map((s,i)=>(
            <div key={i} style={{background:cardGrads[mode][i],border:`1px solid ${t.cardBorder}`,borderRadius:20,boxShadow:t.cardShadow,
              padding:compact?"14px":"16px 18px",transition:ease,backdropFilter:"blur(24px) saturate(1.6)",
              position:"relative",overflow:"hidden",animation:`fadeUp 0.45s ease ${i*.06}s backwards`,minWidth:0}}>
              <div style={{position:"absolute",top:-30,left:-30,width:100,height:100,borderRadius:"50%",filter:"blur(40px)",background:s.p.base,opacity:dark?0.06:0.04,pointerEvents:"none"}}/>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",position:"relative"}}>
                <span style={{fontSize:compact?11:12.5,color:t.sub,fontWeight:400,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",minWidth:0}}>{s.label}</span>
                <div style={{width:compact?30:34,height:compact?30:34,borderRadius:"50%",background:s.p.glow,display:"flex",alignItems:"center",justifyContent:"center",color:s.p.base,flexShrink:0}}>{IC[s.ic]}</div>
              </div>
              <div style={{fontSize:compact?20:26,fontWeight:700,marginTop:6,letterSpacing:-0.5,position:"relative"}}>{s.val}</div>
              <div style={{display:"flex",alignItems:"center",gap:4,marginTop:7,position:"relative",flexWrap:"wrap"}}>
                <span style={{color:s.up?pal.volt.base:pal.coral.base,display:"flex"}}>{s.up?IC.tUp:IC.tDn}</span>
                <span style={{fontSize:12,fontWeight:500,color:s.up?pal.volt.base:pal.coral.base}}>{s.ch}</span>
                {!compact&&<span style={{fontSize:11,color:t.sub}}>from last month</span>}
              </div>
            </div>))}
        </div>

        {/* Middle */}
        <div style={{display:"grid",gridTemplateColumns:compact?"1fr":"1fr 350px",gap:12,flexShrink:0,minWidth:0}}>
          <div style={{...card({padding:compact?"16px 14px":"20px 22px",minWidth:0,overflow:"hidden"}),animation:"fadeUp 0.45s ease 0.25s backwards"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:compact?14:20,gap:8}}>
              <div>
                <h3 style={{fontSize:15,fontWeight:600}}>Sales Overview</h3>
                <div style={{display:"flex",alignItems:"center",gap:14,marginTop:6}}>
                  {[{c:VOLT,l:"Profit"},{c:pal.amber.base,l:"Expense"}].map((lg,i)=>(
                    <div key={i} style={{display:"flex",alignItems:"center",gap:5}}>
                      <div style={{width:7,height:7,borderRadius:"50%",background:lg.c}}/><span style={{fontSize:11.5,color:t.sub}}>{lg.l}</span>
                    </div>))}
                </div>
              </div>
              <div style={{background:t.input,border:`1px solid ${t.inputBorder}`,borderRadius:8,padding:"5px 12px",color:t.sub,fontSize:12,flexShrink:0}}>Month ▾</div>
            </div>
            <AreaChartDemo />
          </div>

          <div style={{display:"flex",flexDirection:"column",gap:12,minWidth:0}}>
            <div style={{...card({padding:"15px 17px"}),animation:"fadeUp 0.45s ease 0.3s backwards"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <h3 style={{fontSize:15,fontWeight:600}}>January 2023</h3>
                <div style={{display:"flex",gap:4}}>
                  {[IC.chevL,IC.chevR].map((ic,i)=>(<button key={i} style={{width:28,height:28,borderRadius:"50%",border:`1px solid ${t.inputBorder}`,background:"transparent",display:"flex",alignItems:"center",justifyContent:"center",color:t.sub,cursor:"pointer"}}>{ic}</button>))}
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,textAlign:"center"}}>
                {dayN.map(d=>(<span key={d} style={{fontSize:11,color:t.muted,fontWeight:500,padding:"3px 0"}}>{d}</span>))}
                {calDays.map(d=>(<div key={d} style={{fontSize:14,fontWeight:d===11?600:400,color:d===11?t.accentText:t.sub,
                  padding:"7px 0",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",
                  background:d===11?t.accentGrad:"transparent",boxShadow:d===11?t.accentGlow:"none",transition:ease,aspectRatio:"1"}}>{d}</div>))}
              </div>
            </div>

            <div style={{...card({padding:"15px 17px",flex:1,overflowY:"auto",minHeight:180}),animation:"fadeUp 0.45s ease 0.35s backwards"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <h3 style={{fontSize:15,fontWeight:600}}>Upcoming Schedule</h3>
                <button style={{color:t.muted,background:"none",border:"none",cursor:"pointer"}}>{IC.dots}</button>
              </div>
              {dbSchedule.length === 0 && <div style={{fontSize:13,color:t.sub,marginTop:20,textAlign:'center'}}>No upcoming events</div>}
              {dbSchedule.map((item,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:i<dbSchedule.length-1?`1px solid ${t.divider}`:"none",minWidth:0}}>
                  <div style={{width:22,height:22,borderRadius:"50%",flexShrink:0,border:item.done?"none":`1.5px solid ${t.chk}`,background:item.done?pal.volt.grad:"transparent",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:item.done?`0 2px 8px ${pal.volt.glow}`:"none"}}>
                    {item.done&&<svg width="11" height="11" fill="none" viewBox="0 0 11 11"><path d="M2.5 5.5L4.5 7.5L8.5 3.5" stroke="#0a0a0a" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </div>
                  <div style={{minWidth:58,flexShrink:0}}>
                    <div style={{fontSize:10,color:t.muted}}>{item.date}</div>
                    <div style={{fontSize:12,fontWeight:500,color:t.sub,fontVariantNumeric:"tabular-nums"}}>{item.time}</div>
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.title}</div>
                    <div style={{fontSize:11,color:t.muted,marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.who}</div>
                  </div>
                </div>))}
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div style={{...card({padding:compact?"16px 18px":"20px 24px",flexShrink:0}),animation:"fadeUp 0.45s ease 0.4s backwards"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
            <h3 style={{fontSize:15,fontWeight:600}}>Device Usage</h3>
            <button style={{color:t.muted,background:"none",border:"none",cursor:"pointer"}}>{IC.dots}</button>
          </div>
          <div style={{display:"flex",gap:mobile?20:40,alignItems:"center",flexWrap:mobile?"wrap":"nowrap"}}>
            <div style={{position:"relative",width:100,height:100,flexShrink:0}}>
              <div style={{position:"absolute",top:0,left:0}}><DonutRing pct={62.88} color={VOLT} size={100} strokeW={9} t={t}/></div>
              <div style={{position:"absolute",top:14,left:14}}><DonutRing pct={31.12} color={pal.teal.base} size={72} strokeW={9} t={t}/></div>
            </div>
            <div style={{display:"flex",gap:mobile?24:48,flex:1}}>
              {[{l:"Mobile Users",v:"62.88%",c:VOLT},{l:"Desktop Users",v:"31.12%",c:pal.teal.base}].map((u,i)=>(
                <div key={i} style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
                    <div style={{width:8,height:8,borderRadius:"50%",background:u.c,flexShrink:0}}/>
                    <span style={{fontSize:13,color:t.sub,fontWeight:400}}>{u.l}</span>
                  </div>
                  <div style={{fontSize:mobile?24:30,fontWeight:700,letterSpacing:-0.5,fontVariantNumeric:"tabular-nums"}}>{u.v}</div>
                  <div style={{fontSize:12,color:t.muted,marginTop:4}}>-15% from last month</div>
                </div>))}
            </div>
          </div>
        </div>
        <div style={{height:4,flexShrink:0}}/>
      
    </>
  );
}

export default function Dashboard(){
  const { user, profile, loading, signOut, updateProfile } = useAuth();

  // Show loading spinner while checking session
  if (loading) {
    return (
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',width:'100vw',height:'100vh',background:'#08080a',color:'#ccfd01',fontFamily:"-apple-system,'SF Pro Display',system-ui,sans-serif"}}>
        <div style={{textAlign:'center'}}>
          <div style={{width:48,height:48,borderRadius:14,background:'linear-gradient(135deg,#ccfd01,#b8e300)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,fontWeight:800,color:'#0a0a0a',margin:'0 auto 16px',boxShadow:'0 3px 18px rgba(204,253,1,0.18)'}}>N</div>
          <div style={{fontSize:14,color:'#8b8fa3'}}>Loading...</div>
        </div>
      </div>
    );
  }

  // Show auth page if not logged in
  if (!user) return <AuthPage />;

  // Show onboarding for new users who haven't completed it
  if (profile !== null && !profile?.onboarding_complete) return <OnboardingView />;

  const userName = profile?.full_name || user?.user_metadata?.full_name || '';
  const userEmail = user?.email || '';

  const[dark,setDark]=useState(true);
  const VOLTD = '#c3ef00'; // slightly darker

  // We can render Client Portal directly as a full screen modal mock if user clicks a button 
  const [showPortal, setShowPortal] = useState(false);

  const[showProfile,setShowProfile]=useState(false);
  const[hBar,setHBar]=useState(null);
  const[nav,setNav]=useState(0);
  const[navSec,setNavSec]=useState(0);
  const[notifOpen,setNotifOpen]=useState(false);
  const[sidebarOpen,setSidebarOpen]=useState(true);
  const w=useWidth();
  const t=T[dark?"dark":"light"];
  const mode=dark?"dark":"light";
  const ease="all 0.45s cubic-bezier(.4,0,.2,1)";
  const compact=w<1100;
  const mobile=w<768;

  useEffect(()=>{setSidebarOpen(!mobile);},[mobile]);

  const card=(ex={})=>({background:t.card,border:`1px solid ${t.cardBorder}`,borderRadius:20,boxShadow:t.cardShadow,transition:ease,backdropFilter:"blur(24px) saturate(1.6)",...ex});

  return(
    <div className={dark ? "dark" : ""} style={{display:"flex",width:"100%",height:"100vh",background:t.shell,color:t.text,
      fontFamily:"-apple-system,'SF Pro Display','SF Pro Text','Helvetica Neue',system-ui,sans-serif",
      transition:ease,WebkitFontSmoothing:"antialiased",padding:mobile?8:14,gap:mobile?8:14,overflow:"hidden"}}>

      {/* ═══ SIDEBAR ═══ */}
      {mobile&&!sidebarOpen&&(
        <button onClick={()=>setSidebarOpen(true)} style={{position:"fixed",top:18,left:18,zIndex:200,width:40,height:40,borderRadius:"50%",
          background:t.accentGrad,boxShadow:t.accentGlow,border:"none",cursor:"pointer",
          display:"flex",alignItems:"center",justifyContent:"center",color:t.accentText}}>{IC.grid}</button>
      )}
      {(sidebarOpen||!mobile)&&(
        <aside style={{
          width:mobile?280:compact?210:244,borderRadius:24,
          background:t.sidebar,border:`1px solid ${t.sidebarBorder}`,boxShadow:t.sidebarShadow,
          backdropFilter:"blur(40px) saturate(1.8)",display:"flex",flexDirection:"column",justifyContent:"space-between",
          padding:"18px 14px",flexShrink:0,transition:ease,
          height:mobile?"calc(100vh - 16px)":"calc(100vh - 28px)",overflow:"hidden",
          position:mobile?"fixed":"relative",top:mobile?8:undefined,left:mobile?8:undefined,zIndex:mobile?300:1}}>
          <div style={{position:"absolute",top:-50,right:-50,width:160,height:160,borderRadius:"50%",filter:"blur(65px)",opacity:dark?0.05:0.035,background:VOLT,pointerEvents:"none"}}/>
          <div style={{position:"absolute",bottom:-35,left:-35,width:120,height:120,borderRadius:"50%",filter:"blur(55px)",opacity:dark?0.04:0.025,background:pal.amber.base,pointerEvents:"none"}}/>
          <div style={{position:"relative",zIndex:1}}>
            <div style={{display:"flex",alignItems:"center",gap:10,padding:"2px 4px 18px"}}>
              <div style={{width:34,height:34,borderRadius:11,background:t.accentGrad,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,color:t.accentText,boxShadow:t.accentGlow}}>N</div>
              <span style={{fontSize:17,fontWeight:600,letterSpacing:-0.3}}>Nomaad</span>
              <div style={{marginLeft:"auto",display:"flex",gap:6,alignItems:"center"}}>
                <Toggle dark={dark} flip={()=>setDark(!dark)}/>
                {mobile&&<button onClick={()=>setSidebarOpen(false)} style={{width:28,height:28,borderRadius:"50%",background:t.input,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:t.sub}}>{IC.x}</button>}
              </div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 11px",borderRadius:12,background:t.input,color:t.sub,transition:ease,marginBottom:6}}>
              {IC.search}<span style={{fontSize:13,fontWeight:400}}>Search here...</span>
              {!mobile&&<span style={{marginLeft:"auto",fontSize:10,color:t.muted,padding:"2px 6px",borderRadius:5,background:t.input,fontWeight:500,border:`1px solid ${t.inputBorder}`}}>⌘K</span>}
            </div>
            {[{title:"MAIN MENU",items:navM,sec:0},{title:"SETTINGS",items:navS,sec:1}].map(s=>(
              <div key={s.sec} style={{marginTop:10}}>
                <div style={{fontSize:10,fontWeight:600,color:t.muted,letterSpacing:1.2,padding:"8px 10px 5px"}}>{s.title}</div>
                {s.items.map((item,i)=>{const on=s.sec===navSec&&nav===i;return(
                  <button key={i} onClick={()=>{setNavSec(s.sec);setNav(i);mobile&&setSidebarOpen(false);}} style={{
                    display:"flex",alignItems:"center",gap:10,padding:"9px 11px",borderRadius:12,width:"100%",
                    fontSize:13,fontWeight:on?600:400,color:on?t.accentText:t.sub,
                    background:on?t.accentGrad:"transparent",boxShadow:on?t.accentGlow:"none",
                    border:"none",cursor:"pointer",fontFamily:"inherit",transition:ease,textAlign:"left"
                  }}>{IC[item.ic]}<span>{item.label}</span></button>);})}
              </div>))}
          </div>
          {/* ── User profile button ── */}
          <button onClick={()=>setShowProfile(true)} style={{
            display:"flex",alignItems:"center",gap:10,padding:"10px 12px",
            borderRadius:16,width:"100%",background:dark?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.03)",
            border:`1px solid ${t.cardBorder}`,cursor:"pointer",fontFamily:"inherit",
            transition:ease,marginTop:12,textAlign:"left",
          }}>
            {/* Avatar */}
            <div style={{position:"relative",flexShrink:0}}>
              <div style={{
                width:36,height:36,borderRadius:"50%",flexShrink:0,
                background:profile?.avatar_url?`url(${profile.avatar_url}) center/cover`:`linear-gradient(135deg,${VOLT},#b8e300)`,
                display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:13,fontWeight:800,color:"#0a0a0a",
              }}>
                {!profile?.avatar_url&&(userName?.[0]?.toUpperCase()||"N")}
              </div>
              {/* Availability dot */}
              <div style={{
                position:"absolute",bottom:1,right:1,width:9,height:9,borderRadius:"50%",
                background:profile?.availability==="busy"?"#FFB340":profile?.availability==="away"?"#8b8fa3":"#34C759",
                border:`1.5px solid ${dark?"#0f0f12":"#f0ede8"}`,
              }}/>
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13,fontWeight:600,color:t.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                {userName||"Your Profile"}
              </div>
              <div style={{fontSize:11,color:t.muted,marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                {profile?.business_name||userEmail}
              </div>
            </div>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" style={{color:t.muted,flexShrink:0}}>
              <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </aside>
      )}
      {mobile&&sidebarOpen&&<div onClick={()=>setSidebarOpen(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:250}}/>}

      {/* ═══ MAIN ═══ */}
      <main style={{flex:1,display:"flex",flexDirection:"column",gap:12,
        height:mobile?"calc(100vh - 16px)":"calc(100vh - 28px)",
        overflowY:"auto",overflowX:"hidden",minWidth:0}}>
        {navSec === 0 && nav === 0 && <BusinessOverview t={t} dark={dark} mobile={mobile} compact={compact} mode={mode} notifOpen={notifOpen} setNotifOpen={setNotifOpen} w={w} userName={userName} userEmail={userEmail} sidebarOpen={sidebarOpen} />}
        {navSec === 0 && nav === 1 && <ProspectingView t={t} dark={dark} mobile={mobile} compact={compact} />}
        {navSec === 0 && nav === 2 && <CRMView t={t} dark={dark} mobile={mobile} compact={compact} mode={mode} notifOpen={notifOpen} setNotifOpen={setNotifOpen} w={w} IC={IC} pal={pal} VOLT={VOLT} VOLTD={VOLTD} />}
        {navSec === 0 && nav === 3 && <ProjectsView t={t} dark={dark} mobile={mobile} compact={compact} onLaunchPortal={() => setShowPortal(true)} />}
        {navSec === 0 && nav === 4 && <CalendarView t={t} dark={dark} mobile={mobile} compact={compact} />}
        {navSec === 0 && nav === 5 && <AutomationsView t={t} dark={dark} mobile={mobile} compact={compact} />}
        {navSec === 0 && nav === 6 && <FinancialsView t={t} dark={dark} mobile={mobile} compact={compact} mode={mode} IC={IC} pal={pal} VOLT={VOLT} VOLTD={VOLTD} />}
        
        {navSec === 1 && nav === 0 && <DocsView t={t} dark={dark} mobile={mobile} compact={compact} />}
        {navSec === 1 && nav === 1 && <MessagesView t={t} dark={dark} mobile={mobile} compact={compact} mode={mode} IC={IC} />}
        {navSec === 1 && nav === 2 && <SettingsView t={t} dark={dark} mobile={mobile} compact={compact} />}
      </main>

      {showPortal && <ClientPortalView onClose={() => setShowPortal(false)} dark={dark} />}
      {showProfile && <UserProfileView t={t} dark={dark} onClose={()=>setShowProfile(false)} user={user} profile={profile} updateProfile={updateProfile} signOut={signOut} />}

      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes notifIn{from{opacity:0;transform:translateY(-8px) scale(0.96)}to{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes notifSlide{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
        *,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
        html,body,#root{height:100%;overflow:hidden;background:${t.shell}}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:${dark?"#2a2a32":"#d1cdc6"};border-radius:4px}
        button{cursor:pointer}
      `}</style>
    </div>
  );
}
