/* The Reading Room — optional per-user cloud sync.
 * Works offline by default. Requires Supabase publishable key and RLS policies.
 * Keep secret keys OUT of client-side files.
 */
(function (global) {
'use strict';
global.createReadingRoomSync = function (hooks) {
  const cfg = global.READING_ROOM_SYNC_CONFIG || {};
  const enabled = typeof cfg.url === 'string' &&
    /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(cfg.url) &&
    typeof cfg.publishableKey === 'string' &&
    cfg.publishableKey.startsWith('sb_publishable_') && cfg.publishableKey.length > 20;
  let client = null, user = null, status = 'offline', lastSync = '';
  let pending = {progress:{},custom:{}}, busy = false, rerun = false, timer = null, authSeq = 0;
  const guestKey = hooks.baseKey;
  const accountKey = id => guestKey + '-account-' + id;
  const queueKey = id => guestKey + '-pending-' + id;
  const obj = x => x && typeof x === 'object' && !Array.isArray(x) ? x : {};
  const parse = raw => {try {return JSON.parse(raw)} catch (_) {return null}};
  const stored = key => obj(parse(localStorage.getItem(key)));
  const clean = x => ({progress:obj(x.progress),custom:Array.isArray(x.custom)?x.custom:[]});
  const current = () => clean(JSON.parse(JSON.stringify(hooks.getState())));
  const has = x => Object.keys(obj(x.progress)).length > 0 || (Array.isArray(x.custom)&&x.custom.length > 0);
  const notify = m => hooks.notify && hooks.notify(m);
  function setStatus(s) {status=s;hooks.onStatus && hooks.onStatus()}
  function saveQueue() {if (user) localStorage.setItem(queueKey(user.id),JSON.stringify(pending))}
  function stamp() {return Date.now() + ':' + Math.random().toString(36).slice(2)}
  function enqueue(type,id) {
    if (!user || !enabled) return;
    pending[type][id] = stamp(); saveQueue(); setStatus('pending');
    clearTimeout(timer); timer=setTimeout(sync,600);
  }
  function queueAll() {
    if (!user) return;
    const x=current();
    Object.keys(x.progress).forEach(id => pending.progress[id]=stamp());
    x.custom.forEach(b => {if(b&&typeof b.id==='string')pending.custom[b.id]=stamp()});
    saveQueue();setStatus('pending');clearTimeout(timer);timer=setTimeout(sync,700);
  }
  async function getRemote() {
    const id=user.id;
    const [p,c]=await Promise.all([
      client.from('rr_book_progress').select('book_id,data').eq('user_id',id),
      client.from('rr_custom_books').select('book_id,data').eq('user_id',id)
    ]);
    if (p.error) throw p.error;
    if (c.error) throw c.error;
    return {progress:p.data||[],custom:c.data||[]};
  }
  function mergeRemote(remote) {
    const before=current(),next={progress:{...before.progress},custom:[...before.custom]};
    for (const r of remote.progress) {
      if (typeof r.book_id==='string' && !pending.progress[r.book_id] && r.data && typeof r.data==='object' && !Array.isArray(r.data)) {
        next.progress[r.book_id]=r.data;
      }
    }
    for (const r of remote.custom) {
      if (typeof r.book_id!=='string' || pending.custom[r.book_id] || !r.data || typeof r.data!=='object' || Array.isArray(r.data))continue;
      const i=next.custom.findIndex(b=>b.id===r.book_id);
      if(i===-1)next.custom.push(r.data);
      else next.custom[i]=r.data;
    }
    if(JSON.stringify(before)!==JSON.stringify(next)) {hooks.setState(next);hooks.onData && hooks.onData()}
  }
  async function pushPending(id) {
    const work={progress:{...pending.progress},custom:{...pending.custom}};
    for (const [bookId,mark] of Object.entries(work.progress)) {
      if(user?.id!==id)return;
      const data=hooks.getState().progress?.[bookId];
      if(!data)continue;
      const {error}=await client.from('rr_book_progress').upsert(
        {user_id:id,book_id:bookId,data},{onConflict:'user_id,book_id'});
      if(error)throw error;
      if(user?.id!==id)return;
      if(pending.progress[bookId]===mark)delete pending.progress[bookId];
      saveQueue();
    }
    for(const [bookId,mark] of Object.entries(work.custom)){
      if(user?.id!==id)return;
      const data=hooks.getState().custom?.find(b=>b.id===bookId);
      if(!data)continue;
      const {error}=await client.from('rr_custom_books').upsert(
        {user_id:id,book_id:bookId,data},{onConflict:'user_id,book_id'});
      if(error)throw error;
      if(user?.id!==id)return;
      if(pending.custom[bookId]===mark)delete pending.custom[bookId];
      saveQueue();
    }
  }
  async function sync() {
    if(!enabled||!client||!user)return;
    if(busy){rerun=true;return}
    const id=user.id;busy=true;setStatus('syncing');
    try {
      await pushPending(id);
      if(user?.id!==id)return;
      const remote=await getRemote();
      if(user?.id!==id)return;
      mergeRemote(remote);
      lastSync=new Date().toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit'});
      setStatus(Object.keys(pending.progress).length||Object.keys(pending.custom).length?'pending':'ready');
    } catch(e) {
      console.warn('Reading Room cloud sync:',e?.message||e);
      setStatus('error');
    } finally {
      busy=false;
      const needsRetry=rerun;rerun=false;
      if (user?.id===id && (needsRetry || (status==='pending' &&
        (Object.keys(pending.progress).length||Object.keys(pending.custom).length)))) {
        clearTimeout(timer);timer=setTimeout(sync,850);
      }
    }
  }
  async function activate(next) {
    const id=next?.id||null;
    if(id===user?.id)return;
    const seq=++authSeq;
    if(!id) {
      user=null;pending={progress:{},custom:{}};clearTimeout(timer);
      hooks.setStorage(guestKey);hooks.setState(stored(guestKey));
      setStatus('offline');hooks.onData && hooks.onData();return;
    }
    user=next;setStatus('syncing');
    hooks.setStorage(accountKey(id));
    const account=clean(stored(accountKey(id)));
    hooks.setState(account);
    const queued=stored(queueKey(id));
    pending={progress:obj(queued.progress),custom:obj(queued.custom)};
    hooks.onData && hooks.onData();
    try {
      const remote=await getRemote();
      if(seq!==authSeq||user?.id!==id)return;
      if(!remote.progress.length&&!remote.custom.length) {
        if(has(account))queueAll();
        else {
          const guest=clean(stored(guestKey));
          if(has(guest)){
            hooks.setState(guest);
            queueAll();
            notify('I dati già presenti su questo browser sono stati copiati nel tuo account.');
          }
        }
      }
      mergeRemote(remote);
      hooks.onData && hooks.onData();
      await sync();
    }catch(e){console.warn('Reading Room login:',e?.message||e);setStatus('error')}
  }
  async function init() {
    if(!enabled)return;
    try {
      const sdk=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
      client=sdk.createClient(cfg.url,cfg.publishableKey,{
        auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}
      });
    }catch(e){console.warn('Reading Room SDK:',e);setStatus('error');return}
    hooks.onStatus && hooks.onStatus();
    client.auth.onAuthStateChange((_event,session)=>{
      setTimeout(()=>activate(session?.user||null),0);
    });
    const {data,error}=await client.auth.getSession();
    if(error){setStatus('error');return}
    await activate(data.session?.user||null);
    global.addEventListener('online',sync);
    global.addEventListener('focus',sync);
    global.document.addEventListener('visibilitychange',()=>{
      if(global.document.visibilityState==='visible')sync()
    });
    global.setInterval(()=>{
      if(global.document.visibilityState==='visible')sync()
    },60000);
  }
  async function signIn(email) {
    if(!client)throw Error('Sincronizzazione non configurata');
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw Error('Email non valida');
    const {error}=await client.auth.signInWithOtp({
      email:email.trim(),
      options:{emailRedirectTo:global.location.origin+global.location.pathname}
    });
    if(error)throw error;
    notify('Ti abbiamo inviato il link di accesso via email.');
  }
  async function signOut() {
    if(!client)return;
    const {error}=await client.auth.signOut();
    if(error)throw error;
    await activate(null);
  }
  async function importGuest() {
    if(!user)throw Error('Accedi prima di importare');
    const guest=clean(stored(guestKey));
    if(!has(guest)){notify('Non ci sono dati locali da importare.');return}
    const x=current();let count=0;
    for(const [id,value] of Object.entries(guest.progress)){
      if(!(id in x.progress)){x.progress[id]=value;count++}
    }
    const known=new Set(x.custom.map(b=>b.id));
    for(const b of guest.custom){
      if(b?.id&&!known.has(b.id)){x.custom.push(b);known.add(b.id);count++}
    }
    hooks.setState(x);queueAll();hooks.onData && hooks.onData();
    notify(count?'Importati '+count+' elementi senza sostituire i tuoi dati cloud.':'Nessun nuovo elemento da importare.');
  }
  return {
    enabled,get ready(){return !!client},get user(){return user},
    get status(){return status},get lastSync(){return lastSync},
    init,signIn,signOut,sync,importGuest,queueAll,
    queueProgress:id=>enqueue('progress',id),
    queueCustom:id=>enqueue('custom',id)
  };
};
})(window);
