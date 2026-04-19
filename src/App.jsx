import { useState, useEffect, useRef } from "react";
import { useAuth } from "./contexts/AuthContext";
import AuthPage from "./components/AuthPage";
import LandingPage from "./components/LandingPage";
import PublicProfilePage from "./components/PublicProfilePage";
import OnboardingView from "./components/OnboardingView";
import { getHostnameRoute, APP_URL } from "./lib/hostname";
import UserProfileView from "./components/UserProfileView";
import AIFloater from "./components/AIFloater";
import AreaChartDemo from "./components/ui/demo";
import ClientsView from "./components/ui/clients-view";
import ProspectingView from "./components/ui/prospecting-view";
import MessagesView from "./components/ui/messages-view";
import ProjectsView from "./components/ui/projects-view";
import CalendarView from "./components/ui/calendar-view";
import DocsView from "./components/ui/docs-view";
import DeliverablesView from "./components/ui/deliverables-view";
import ClientPortalView from "./components/ui/client-portal-view";
import AutomationsView from "./components/ui/automations-view";
import FinancialsView from "./components/ui/financials-view";
import SettingsView from "./components/ui/settings-view";
import { supabase } from './lib/supabase';
import { getCurrency, formatMoney } from './components/ui/settings-view';
import { Skeleton, SkeletonRow, SkeletonStatCard } from './components/Skeleton';

const VOLT="#ccfd01",VOLTD="#b8e300";

const pal={
  volt:{base:VOLT,dark:VOLTD,glow:"rgba(204,253,1,0.15)",grad:`linear-gradient(135deg,${VOLT},${VOLTD})`},
  coral:{base:"#FF6259",glow:"rgba(255,98,89,0.15)",grad:"linear-gradient(135deg,#FF6259,#E8453C)"},
  amber:{base:"#FFB340",glow:"rgba(255,179,64,0.15)",grad:"linear-gradient(135deg,#FFB340,#F5A623)"},
  teal:{base:"#5AC8FA",glow:"rgba(90,200,250,0.15)",grad:"linear-gradient(135deg,#5AC8FA,#40B4E5)"},
};
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

const navM=[{ic:"grid",label:"Dashboard"},{ic:"compass",label:"Prospecting"},{ic:"users",label:"Clients"},{ic:"chart",label:"Projects"},{ic:"bell",label:"Calendar"},{ic:"zap",label:"Automations"},{ic:"dollar",label:"Financials"}];
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

// ── iOS-Style Notification Panel ── (disabled — awaiting real notifications source)
function NotifPanel_DISABLED({open,onClose,t,dark}){
  const notifications = [];
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

function SalesChart_DISABLED({t,dark,hBar,setHBar,compact}){
  const salesData = []; const mx = 1;
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


// ── Dashboard widget config ────────────────────────────────────────────────────
const DASH_WIDGETS = [
  { id: "stats",    label: "KPI Stats",        icon: "📊" },
  { id: "chart",   label: "Cashflow Chart",    icon: "📈" },
  { id: "upcoming",label: "Upcoming Events",   icon: "📅" },
  { id: "tasks",   label: "Open Tasks",        icon: "✅" },
  { id: "invoices",label: "Recent Invoices",   icon: "🧾" },
];

function getDashPrefs() {
  try {
    const raw = localStorage.getItem("nomaad_dash_widgets");
    if (raw) return JSON.parse(raw);
  } catch {}
  // Default: all on
  return Object.fromEntries(DASH_WIDGETS.map(w => [w.id, true]));
}

function saveDashPrefs(prefs) {
  try { localStorage.setItem("nomaad_dash_widgets", JSON.stringify(prefs)); } catch {}
}

function BusinessOverview({ t, dark, mobile, compact, mode, w, userName, userEmail, sidebarOpen }) {
  const ease="all 0.45s cubic-bezier(.4,0,.2,1)";
  const card=(ex={})=>({background:t.card,border:`1px solid ${t.cardBorder}`,borderRadius:20,boxShadow:t.cardShadow,transition:ease,backdropFilter:"blur(24px) saturate(1.6)",...ex});
  const [showCustomize, setShowCustomize] = useState(false);
  const [widgets, setWidgets] = useState(() => getDashPrefs());

  const toggleWidget = (id) => {
    setWidgets(prev => {
      const next = { ...prev, [id]: !prev[id] };
      saveDashPrefs(next);
      return next;
    });
  };

  const currency = getCurrency();

  const [stats, setStats] = useState([
    {ic:"cust",label:"Clients",val:"—",sub:"active",p:pal.volt},
    {ic:"actCust",label:"Active Projects",val:"—",sub:"in progress",p:pal.teal},
    {ic:"dollar",label:"Unpaid Invoices",val:"—",sub:"awaiting payment",p:pal.amber},
    {ic:"expense",label:"Month Income",val:"—",sub:"received this month",p:pal.coral},
  ]);
  const [events, setEvents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      const todayStart = new Date(); todayStart.setHours(0,0,0,0);
      const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0,0,0,0);
      const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29); thirtyDaysAgo.setHours(0,0,0,0);

      // Each query resolves independently — one failure never blocks the dashboard
      const safe = (p) => p.catch(() => ({ data: null, count: 0 }));

      const [clientsR, projectsR, invoicesR, eventsR, tasksR, txsR] = await Promise.all([
        safe(supabase.from('clients').select('id', { count: 'exact', head: true })),
        safe(supabase.from('projects').select('id,status')),
        safe(supabase.from('invoices').select('id,amount,status,paid_at,issued_at,client_id,number')),
        safe(supabase.from('calendar_events').select('id,title,start_time,type').gte('start_time', todayStart.toISOString()).order('start_time', { ascending: true }).limit(5)),
        safe(supabase.from('tasks').select('id,title,due_date,completed_at').is('completed_at', null).order('due_date', { ascending: true, nullsLast: true }).limit(5)),
        safe(supabase.from('transactions').select('amount,type,date').gte('date', thirtyDaysAgo.toISOString())),
      ]);

      if (!mounted) return;

      const clientCount = clientsR.count || 0;
      const projects = projectsR.data || [];
      const activeProjects = projects.filter(p => !['delivered','invoiced','done','cancelled','archived'].includes(p.status)).length;

      const invs = invoicesR.data || [];
      const unpaid = invs.filter(i => i.status !== 'paid');
      const unpaidTotal = unpaid.reduce((s,i) => s + (Number(i.amount)||0), 0);
      const monthIncome = invs
        .filter(i => i.paid_at && new Date(i.paid_at) >= monthStart)
        .reduce((s,i) => s + (Number(i.amount)||0), 0);

      setStats([
        {ic:"cust",label:"Clients",val:String(clientCount),sub:"on your roster",p:pal.volt},
        {ic:"actCust",label:"Active Projects",val:String(activeProjects),sub:"in progress",p:pal.teal},
        {ic:"dollar",label:"Unpaid Invoices",val:formatMoney(unpaidTotal),sub:`${unpaid.length} awaiting payment`,p:pal.amber},
        {ic:"expense",label:"Month Income",val:formatMoney(monthIncome),sub:"received this month",p:pal.coral},
      ]);
      setEvents(eventsR.data || []);
      setTasks(tasksR.data || []);
      setInvoices(invs.slice(0,4));

      // Build 30-day chart — always renders, just zeros if no transactions
      const buckets = {};
      for (let i = 29; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0,0,0,0);
        buckets[d.toISOString().slice(0,10)] = { date: d, revenue: 0, costs: 0 };
      }
      (txsR.data || []).forEach(tx => {
        const k = new Date(tx.date).toISOString().slice(0,10);
        if (!buckets[k]) return;
        const amt = Number(tx.amount) || 0;
        if (tx.type === 'income') buckets[k].revenue += amt;
        else if (tx.type === 'expense') buckets[k].costs += amt;
      });
      setChartData(Object.values(buckets));

      setLoading(false);
    }
    // Always clear loading even if something throws unexpectedly
    load().catch(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const fmtEvent = (iso) => {
    const d = new Date(iso);
    return {
      date: d.toLocaleDateString([], { weekday: 'short', day: '2-digit', month: 'short' }),
      time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  };

  return (
    <>
      <header style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",padding:mobile?"4px 2px 0":"8px 4px 0",flexShrink:0,gap:8}}>
        <div style={{minWidth:0,flex:1,marginLeft:mobile&&!sidebarOpen?48:0}}>
          <h1 style={{fontSize:mobile?22:28,fontWeight:700,letterSpacing:-0.6}}>Hello, {(typeof userName === 'string' && userName) || 'there'}!</h1>
          <p style={{fontSize:mobile?12:14,color:t.sub,marginTop:3,fontWeight:400}}>Here's your business at a glance.</p>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
          {/* Customize button */}
          <div style={{position:"relative"}}>
            <button
              onClick={() => setShowCustomize(v => !v)}
              style={{
                height:34,padding:"0 12px",borderRadius:17,
                background:showCustomize?(dark?"rgba(204,253,1,0.12)":"rgba(204,253,1,0.15)"):(dark?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.04)"),
                border:`1px solid ${showCustomize?VOLT+"44":(dark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.06)")}`,
                display:"flex",alignItems:"center",gap:6,
                color:showCustomize?VOLT:(dark?"rgba(255,255,255,0.7)":"#6b7280"),
                cursor:"pointer",fontSize:12,fontWeight:600,
                fontFamily:"inherit",transition:"all 0.2s ease",
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14M12 2v2m0 16v2M2 12h2m16 0h2"/>
              </svg>
              Customise
            </button>
            {showCustomize && (
              <div style={{
                position:"absolute",top:"calc(100% + 8px)",right:0,zIndex:999,
                background:dark?"rgba(18,18,22,0.97)":"rgba(255,255,255,0.97)",
                border:`1px solid ${dark?"rgba(255,255,255,0.1)":"rgba(0,0,0,0.08)"}`,
                borderRadius:16,boxShadow:"0 12px 48px rgba(0,0,0,0.2)",
                padding:"14px 16px",minWidth:220,
                backdropFilter:"blur(24px)",
              }}>
                <div style={{fontSize:11,fontWeight:700,color:dark?"rgba(255,255,255,0.4)":"rgba(0,0,0,0.4)",letterSpacing:0.8,textTransform:"uppercase",marginBottom:10}}>
                  Widgets
                </div>
                {DASH_WIDGETS.map(wg => (
                  <div
                    key={wg.id}
                    onClick={() => toggleWidget(wg.id)}
                    style={{
                      display:"flex",alignItems:"center",justifyContent:"space-between",
                      padding:"8px 2px",cursor:"pointer",gap:10,
                      borderBottom:`1px solid ${dark?"rgba(255,255,255,0.05)":"rgba(0,0,0,0.04)"}`,
                    }}
                  >
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <span style={{fontSize:14}}>{wg.icon}</span>
                      <span style={{fontSize:13,fontWeight:500,color:dark?"#f0f0f5":"#1a1a1f"}}>{wg.label}</span>
                    </div>
                    {/* Toggle pill */}
                    <div style={{
                      width:36,height:20,borderRadius:10,
                      background:widgets[wg.id]?VOLT:(dark?"rgba(255,255,255,0.1)":"rgba(0,0,0,0.1)"),
                      position:"relative",transition:"background 0.2s",flexShrink:0,
                    }}>
                      <div style={{
                        position:"absolute",top:2,left:widgets[wg.id]?16:2,
                        width:16,height:16,borderRadius:"50%",
                        background:widgets[wg.id]?"#0a0a0a":"rgba(255,255,255,0.7)",
                        transition:"left 0.2s",
                        boxShadow:"0 1px 4px rgba(0,0,0,0.2)",
                      }}/>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {!mobile&&(
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:38,height:38,borderRadius:"50%",background:t.accentGrad,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:600,color:t.accentText,boxShadow:t.accentGlow}}>{(userName || 'U')[0].toUpperCase()}</div>
              <div><div style={{fontSize:13,fontWeight:600}}>{userName || 'User'}</div><div style={{fontSize:11,color:t.sub}}>{userEmail || ''}</div></div>
            </div>
          )}
        </div>
      </header>

      {/* Stats */}
      {widgets.stats && <div style={{display:"grid",gridTemplateColumns:mobile?"1fr 1fr":compact?"repeat(2,1fr)":"repeat(4,1fr)",gap:compact?10:12,flexShrink:0}}>
        {loading ? Array.from({length:4}).map((_,i)=>(
          <SkeletonStatCard key={i} t={t} dark={dark} />
        )) : stats.map((s,i)=>(
          <div key={i} style={{background:cardGrads[mode][i],border:`1px solid ${t.cardBorder}`,borderRadius:20,boxShadow:t.cardShadow,
            padding:compact?"14px":"16px 18px",transition:ease,backdropFilter:"blur(24px) saturate(1.6)",
            position:"relative",overflow:"hidden",animation:`fadeUp 0.45s ease ${i*.06}s backwards`,minWidth:0}}>
            <div style={{position:"absolute",top:-30,left:-30,width:100,height:100,borderRadius:"50%",filter:"blur(40px)",background:s.p.base,opacity:dark?0.06:0.04,pointerEvents:"none"}}/>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",position:"relative"}}>
              <span style={{fontSize:compact?11:12.5,color:t.sub,fontWeight:400,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",minWidth:0}}>{s.label}</span>
              <div style={{width:compact?30:34,height:compact?30:34,borderRadius:"50%",background:s.p.glow,display:"flex",alignItems:"center",justifyContent:"center",color:s.p.base,flexShrink:0}}>{IC[s.ic]}</div>
            </div>
            <div style={{fontSize:compact?20:26,fontWeight:700,marginTop:6,letterSpacing:-0.5,position:"relative"}}>{s.val}</div>
            <div style={{fontSize:11,color:t.sub,marginTop:7,position:"relative"}}>{s.sub}</div>
          </div>))}
      </div>}

      {/* Cashflow chart */}
      {widgets.chart && <div style={{...card({padding:compact?"16px 14px":"20px 22px",minWidth:0,overflow:"hidden",flexShrink:0}),animation:"fadeUp 0.45s ease 0.2s backwards"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:compact?14:20,gap:8}}>
          <div>
            <h3 style={{fontSize:15,fontWeight:600}}>Cashflow</h3>
            <div style={{display:"flex",alignItems:"center",gap:14,marginTop:6}}>
              {[{c:VOLT,l:"Income"},{c:pal.amber.base,l:"Expenses"}].map((lg,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:5}}>
                  <div style={{width:7,height:7,borderRadius:"50%",background:lg.c}}/><span style={{fontSize:11.5,color:t.sub}}>{lg.l}</span>
                </div>))}
            </div>
          </div>
          <div style={{fontSize:11,color:t.muted}}>Last 30 days</div>
        </div>
        <AreaChartDemo data={chartData} currencySymbol={currency.symbol} />
      </div>}

      {/* Today + Upcoming + Tasks — shown as 1-col if only one is visible */}
      {(widgets.upcoming || widgets.tasks) && <div style={{display:"grid",gridTemplateColumns:compact?"1fr":(widgets.upcoming&&widgets.tasks?"1fr 1fr":"1fr"),gap:12,flexShrink:0,minWidth:0}}>
        {widgets.upcoming && <div style={{...card({padding:"16px 18px",minWidth:0}),animation:"fadeUp 0.45s ease 0.25s backwards"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <h3 style={{fontSize:15,fontWeight:600}}>Upcoming</h3>
            <span style={{fontSize:11,color:t.muted}}>{events.length} scheduled</span>
          </div>
          {loading && Array.from({length:3}).map((_,i)=><SkeletonRow key={i} t={t} last={i===2}/>)}
          {!loading && events.length === 0 && (
            <div style={{fontSize:13,color:t.sub,padding:"20px 0",textAlign:"center"}}>No upcoming events. Add one from Calendar.</div>
          )}
          {events.map((e,i) => {
            const f = fmtEvent(e.start_time);
            return (
              <div key={e.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:i<events.length-1?`1px solid ${t.divider}`:"none",minWidth:0}}>
                <div style={{minWidth:62,flexShrink:0}}>
                  <div style={{fontSize:10,color:t.muted}}>{f.date}</div>
                  <div style={{fontSize:12,fontWeight:500,color:t.sub,fontVariantNumeric:"tabular-nums"}}>{f.time}</div>
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.title}</div>
                  <div style={{fontSize:11,color:t.muted,marginTop:1,textTransform:"capitalize"}}>{e.type || "event"}</div>
                </div>
              </div>
            );
          })}
        </div>}

        {widgets.tasks && <div style={{...card({padding:"16px 18px",minWidth:0}),animation:"fadeUp 0.45s ease 0.3s backwards"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <h3 style={{fontSize:15,fontWeight:600}}>Open Tasks</h3>
            <span style={{fontSize:11,color:t.muted}}>{tasks.length} open</span>
          </div>
          {loading && Array.from({length:3}).map((_,i)=><SkeletonRow key={i} t={t} last={i===2}/>)}
          {!loading && tasks.length === 0 && (
            <div style={{fontSize:13,color:t.sub,padding:"20px 0",textAlign:"center"}}>No open tasks. You're all clear.</div>
          )}
          {tasks.map((task,i) => (
            <div key={task.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:i<tasks.length-1?`1px solid ${t.divider}`:"none",minWidth:0}}>
              <div style={{width:20,height:20,borderRadius:"50%",border:`1.5px solid ${t.chk}`,flexShrink:0}}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{task.title}</div>
                {task.due_date && <div style={{fontSize:11,color:t.muted,marginTop:1}}>Due {new Date(task.due_date).toLocaleDateString([], {day:"2-digit",month:"short"})}</div>}
              </div>
            </div>
          ))}
        </div>}
      </div>}

      {/* Recent Invoices */}
      {widgets.invoices && <div style={{...card({padding:"16px 18px",flexShrink:0}),animation:"fadeUp 0.45s ease 0.4s backwards"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <h3 style={{fontSize:15,fontWeight:600}}>Recent Invoices</h3>
        </div>
        {loading && Array.from({length:3}).map((_,i)=><SkeletonRow key={i} t={t} last={i===2}/>)}
        {!loading && invoices.length === 0 && (
          <div style={{fontSize:13,color:t.sub,padding:"20px 0",textAlign:"center"}}>No invoices yet. Create one from Money.</div>
        )}
        {invoices.map((inv,i) => (
          <div key={inv.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:i<invoices.length-1?`1px solid ${t.divider}`:"none",minWidth:0}}>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13,fontWeight:500}}>{inv.number || `Invoice ${inv.id.slice(0,8)}`}</div>
              <div style={{fontSize:11,color:t.muted,marginTop:1,textTransform:"capitalize"}}>{inv.status || "draft"}</div>
            </div>
            <div style={{fontSize:14,fontWeight:600,fontVariantNumeric:"tabular-nums"}}>{formatMoney(inv.amount)}</div>
          </div>
        ))}
      </div>}
      <div style={{height:4,flexShrink:0}}/>
    </>
  );
}

export default function Dashboard(){
  const { route, username } = getHostnameRoute();

  // username.nomaad.ai — public profile, no auth needed
  if (route === 'profile') return <PublicProfilePage username={username} />;

  // www.nomaad.ai / nomaad.ai — landing page only, CTAs send to app.nomaad.ai
  if (route === 'landing') {
    return <LandingPage onGetStarted={() => { window.location.href = APP_URL; }} />;
  }

  // app.nomaad.ai + localhost — full authenticated app
  return <AppShell />;
}

function AppShell() {
  const { user, profile, loading, signOut, updateProfile } = useAuth();
  const [showAuth, setShowAuth] = useState(false);

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

  // Not logged in — show auth directly (no landing page on app subdomain)
  if (!user) return <AuthPage />;

  // New users who haven't completed onboarding
  if (profile !== null && !profile?.onboarding_complete) return <OnboardingView />;

  return <PlatformApp user={user} profile={profile} signOut={signOut} updateProfile={updateProfile} />;
}

// ─── Authenticated platform shell ─────────────────────────────────────────────
// Separate component so all hooks always run (fixes Rules of Hooks violation)

function PlatformApp({ user, profile, signOut, updateProfile }) {
  const userName = profile?.full_name || user?.user_metadata?.full_name || '';
  const userEmail = user?.email || '';

  const[dark,setDark]=useState(true);
  const VOLTD = '#c3ef00';

  const [showPortal, setShowPortal] = useState(false);
  const[showProfile,setShowProfile]=useState(false);
  const[nav,setNav]=useState(0);
  const[navSec,setNavSec]=useState(0);
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
        {showProfile ? (
          <UserProfileView t={t} dark={dark} onClose={()=>setShowProfile(false)} user={user} profile={profile} updateProfile={updateProfile} signOut={signOut} />
        ) : (<>
          {navSec === 0 && nav === 0 && <BusinessOverview t={t} dark={dark} mobile={mobile} compact={compact} mode={mode} w={w} userName={userName} userEmail={userEmail} sidebarOpen={sidebarOpen} />}
          {navSec === 0 && nav === 1 && <ProspectingView t={t} dark={dark} mobile={mobile} compact={compact} />}
          {navSec === 0 && nav === 2 && <ClientsView t={t} dark={dark} mobile={mobile} compact={compact} />}
          {navSec === 0 && nav === 3 && <ProjectsView t={t} dark={dark} mobile={mobile} compact={compact} onLaunchPortal={() => setShowPortal(true)} />}
          {navSec === 0 && nav === 4 && <CalendarView t={t} dark={dark} mobile={mobile} compact={compact} />}
          {navSec === 0 && nav === 5 && <AutomationsView t={t} dark={dark} mobile={mobile} compact={compact} />}
          {navSec === 0 && nav === 6 && <FinancialsView t={t} dark={dark} mobile={mobile} compact={compact} mode={mode} IC={IC} pal={pal} VOLT={VOLT} VOLTD={VOLTD} />}

          {navSec === 1 && nav === 0 && <DocsView t={t} dark={dark} mobile={mobile} compact={compact} />}
          {navSec === 1 && nav === 1 && <MessagesView t={t} dark={dark} mobile={mobile} compact={compact} mode={mode} IC={IC} />}
          {navSec === 1 && nav === 2 && <SettingsView t={t} dark={dark} mobile={mobile} compact={compact} />}
        </>)}
      </main>

      {showPortal && <ClientPortalView onClose={() => setShowPortal(false)} dark={dark} />}

      {/* ═══ AI FLOATER (⌘J) ═══ */}
      <AIFloater
        t={t}
        dark={dark}
        mobile={mobile}
        context={{
          view: (() => {
            if (navSec === 0) return ["Today","Prospecting","Clients","Projects","Calendar","Automations","Money"][nav];
            return ["Docs","Inbox","Settings"][nav];
          })(),
        }}
      />

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
