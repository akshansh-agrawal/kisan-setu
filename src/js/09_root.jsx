/* ============================= ROOT ============================= */
function RoleRouter(){
  const { session } = useApp();
  useEffect(()=>{
    document.documentElement.setAttribute('data-view', !session.role ? 'landing' : session.role==='admin' ? 'admin' : 'app');
    try{ window.scrollTo(0,0); }catch(e){}
  }, [session.role]);
  if(!session.role) return <Landing/>;
  if(session.role==='farmer') return <FarmerApp/>;
  if(session.role==='buyer') return <BuyerApp/>;
  if(session.role==='consumer') return <ConsumerApp/>;
  if(session.role==='logistics') return <LogisticsApp/>;
  if(session.role==='admin') return <AdminApp/>;
  return <Landing/>;
}
class Boundary extends React.Component {
  constructor(p){ super(p); this.state = { bad:false }; }
  static getDerivedStateFromError(){ return { bad:true }; }
  componentDidCatch(e){ try{ console.error(e); }catch(_){} }
  render(){
    if(!this.state.bad) return this.props.children;
    return (
      <div className="boundary"><Logo size={56}/><h2 className="display">Something went wrong</h2><p>Your saved data may be out of date. Resetting it will fix this.</p>
        <button className="btn btn-primary" onClick={()=>{ try{ localStorage.removeItem('kisan_setu_state_v3'); localStorage.removeItem('kisan_setu_session_v3'); }catch(e){} window.location.reload(); }}><span className="btn-label">Reset and reload</span></button></div>
    );
  }
}
function App(){
  const [state, dispatch] = usePersistentAppState();
  const [session, setSession] = usePersistentSession();
  useEffect(()=>{ autoTranslate(session.lang || 'en'); }, [session.lang]);
  useEffect(()=>{ const f=()=>setSession({ ...CLEAR_AUTH }); window.addEventListener('ks-unauth', f); return ()=>window.removeEventListener('ks-unauth', f); }, []);
  return (
    <AppCtx.Provider value={{ state, dispatch, session, setSession }}>
      <RoleRouter/>
    </AppCtx.Provider>
  );
}
ReactDOM.createRoot(document.getElementById('root')).render(<Boundary><App/></Boundary>);
