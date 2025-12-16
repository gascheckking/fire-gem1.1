import { useState, useEffect, useRef, useMemo } from 'react';
import { auth, db, APP_ID } from './firebase';
import {
  Home, ShoppingBag, Gift, Layers, MessageSquare, Settings,
  Zap, Activity, Users, Shield, Cpu, Terminal,
  ChevronRight, Play, Box, Globe, Wallet, Bell, Search,
  Trophy, Flame, Sparkles
} from 'lucide-react';

// --- CONFIG & CONSTANTS ---
const appId = APP_ID;

// Rarity Model (SpawnEngine v1 Economy)
const RARITY = {
  FRAGMENT: { id: 'fragment', label: 'Fragment', color: 'text-slate-400', border: 'border-slate-500', value: 0.1 },
  SHARD: { id: 'shard', label: 'Shard', color: 'text-cyan-400', border: 'border-cyan-500', value: 1.1 },
  CORE: { id: 'core', label: 'Core', color: 'text-purple-400', border: 'border-purple-500', value: 4.0 },
  ARTIFACT: { id: 'artifact', label: 'Artifact', color: 'text-pink-500', border: 'border-pink-500', value: 40.0 },
  RELIC: { id: 'relic', label: 'Relic', color: 'text-yellow-400', border: 'border-yellow-400', value: 200.0 },
  OMEGA: { id: 'omega', label: 'Omega Core', color: 'text-red-600', border: 'border-red-600', value: 1000.0 }
};

// --- APP COMPONENT ---
export default function SpawnEngineOS() {
  // State
  const [activeTab, setActiveTab] = useState('home');
  const [user, setUser] = useState(null);
  const [db, setDb] = useState(null);
  const [feed, setFeed] = useState([]);
  const [wallet, setWallet] = useState({ 
    address: null, 
    xp: 1575, 
    spn: 497, 
    streak: 5, 
    inventory: [] 
  });
  const [botActive, setBotActive] = useState(true);
  const [modalOpen, setModalOpen] = useState(null); // 'pack-reveal', 'create-listing', etc.
  const [packRevealItem, setPackRevealItem] = useState(null);

// --- FIREBASE INIT ---
useEffect(() => {
  if (!auth || !db) return;

  const unsubAuth = onAuthStateChanged(auth, (u) => {
    if (u) {
      setUser(u);
      setWallet((prev) => ({
        ...prev,
        address: u.uid.substring(0, 6) + '...' + u.uid.substring(u.uid.length - 4),
      }));
    } else {
      signInAnonymously(auth);
    }
  });

  const q = query(
    collection(db, `artifacts/${appId}/public/mesh_events`),
    orderBy('ts', 'desc'),
    limit(30)
  );

  const unsubFeed = onSnapshot(q, (snap) => {
    setFeed(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
  });

  return () => {
    unsubAuth();
    unsubFeed();
  };
}, [appId]);
    // Unified Activity Mesh Listener
    const q = query(collection(firestore, `artifacts/${appId}/public/mesh_events`), orderBy('ts', 'desc'), limit(30));
    const unsubFeed = onSnapshot(q, (snap) => {
      setFeed(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubAuth(); unsubFeed(); };
  }, []);

  // --- MESH CORE LOGIC (Simulated Backend) ---
  
  const pushToMesh = async (type, text, tags = []) => {
    if (!db) return;
    const evt = {
      type,
      text,
      tags,
      actor: wallet.address || 'Anon',
      ts: serverTimestamp(),
      ver: 'v1.0'
    };
    // Optimistic UI update
    setFeed(prev => [{id: Date.now(), ...evt, ts: { toDate: () => new Date() }}, ...prev]); 
    await addDoc(collection(db, `artifacts/${appId}/public/mesh_events`), evt);
  };

  // Mock "SpawnBot" Intelligence
  useEffect(() => {
    if (!botActive) return;
    const interval = setInterval(() => {
      // 5% chance every 10s to trigger a bot action
      if (Math.random() > 0.95) {
        const actions = [
          { type: 'bot_trade', text: '🤖 SpawnBot: Auto-staked 50 SPN (Streak Safe)', tags: ['automation'] },
          { type: 'bot_scan', text: '🤖 SpawnBot: Detected Whale movement on Zora chain.', tags: ['intel'] },
          { type: 'mesh_sync', text: '🌐 Mesh: New contract factory deployed by @builder0x', tags: ['infra'] }
        ];
        const action = actions[Math.floor(Math.random() * actions.length)];
        pushToMesh(action.type, action.text, action.tags);
      }
    }, 8000);
    return () => clearInterval(interval);
  }, [botActive, db]);

  // Actions
  const handleOpenPack = () => {
    // 1. Simulate Rarity Roll (Weighted)
    const roll = Math.random();
    let result = RARITY.FRAGMENT;
    if (roll > 0.99) result = RARITY.RELIC;
    else if (roll > 0.95) result = RARITY.ARTIFACT;
    else if (roll > 0.85) result = RARITY.CORE;
    else if (roll > 0.60) result = RARITY.SHARD;

    // 2. Update Wallet State
    const xpGain = Math.floor(result.value * 10);
    setWallet(prev => ({
      ...prev,
      xp: prev.xp + xpGain,
      inventory: [result, ...prev.inventory]
    }));

    // 3. Trigger UI & Mesh
    setPackRevealItem(result);
    setModalOpen('pack-reveal');
    pushToMesh('pack_open', `Opened GENESIS Pack. Pulled: ${result.label.toUpperCase()}`, ['loot', result.id]);
  };

  const handleCheckIn = () => {
    setWallet(prev => ({ ...prev, streak: prev.streak + 1, xp: prev.xp + 50 }));
    pushToMesh('quest_complete', `Daily Ritual Check-in completed. Streak: ${wallet.streak + 1}`, ['streak', 'xp']);
  };

  // --- RENDERERS ---

  // Sidebar (Desktop)
  const Sidebar = () => (
    <aside className="hidden lg:flex flex-col w-64 border-r border-slate-800 bg-[#0c0a14] fixed h-full z-20">
      <div className="p-6 border-b border-slate-800/50">
        <h1 className="text-2xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
          SPAWN
        </h1>
        <p className="text-[10px] text-slate-500 font-mono mt-1">MESH OS v4.0</p>
      </div>
      
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <SidebarItem id="home" icon={Home} label="Dashboard" />
        <SidebarItem id="market" icon={ShoppingBag} label="Marketplace" />
        <SidebarItem id="loot" icon={Gift} label="Packs & Loot" />
        <div className="pt-4 pb-2 px-3 text-[10px] font-bold text-slate-600 uppercase tracking-wider">Protocol</div>
        <SidebarItem id="forge" icon={Terminal} label="Creator Forge" />
        <SidebarItem id="mesh" icon={Globe} label="Mesh Explorer" />
        <SidebarItem id="spawnbot" icon={Bot} label="SpawnBot AI" />
        <div className="pt-4 pb-2 px-3 text-[10px] font-bold text-slate-600 uppercase tracking-wider">Social</div>
        <SidebarItem id="supcast" icon={MessageSquare} label="SupCast" />
        <SidebarItem id="leaderboard" icon={Trophy} label="Leaderboard" />
      </nav>

      <div className="p-4 border-t border-slate-800 bg-slate-900/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-cyan-500/20">
            S
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="text-sm font-bold text-slate-200">Spawniz</div>
            <div className="text-xs text-slate-500 truncate">{wallet.address || 'Connecting...'}</div>
          </div>
          <Settings className="w-5 h-5 text-slate-500 hover:text-white cursor-pointer" />
        </div>
      </div>
    </aside>
  );

  const SidebarItem = ({ id, icon: Icon, label }) => (
    <button 
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
        activeTab === id 
          ? 'bg-slate-800 text-cyan-400 border-l-2 border-cyan-400 shadow-inner' 
          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
      }`}
    >
      <Icon className={`w-5 h-5 ${activeTab === id ? 'text-cyan-400' : 'text-slate-500'}`} />
      {label}
    </button>
  );

  // Right Widgets (Desktop)
  const Widgets = () => (
    <aside className="hidden xl:flex flex-col w-80 border-l border-slate-800 bg-[#0c0a14] fixed right-0 h-full z-20 p-6 space-y-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
        <input 
          type="text" 
          placeholder="Search tokens, packs..." 
          className="w-full bg-slate-900 border border-slate-800 rounded-full py-2 pl-10 pr-4 text-sm text-slate-300 focus:outline-none focus:border-cyan-500/50 transition-colors"
        />
      </div>

      {/* Quest Layer */}
      <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Quests</h3>
          <span className="text-xs text-cyan-400 hover:underline cursor-pointer">View All</span>
        </div>
        <div className="space-y-3">
          <QuestItem title="Mint 'Base Alpha'" reward="250 XP" progress={60} />
          <QuestItem title="Deploy Token v2" reward="1000 XP" progress={0} />
        </div>
      </div>

      {/* SpawnBot Status */}
      <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-3 opacity-10">
          <Bot className="w-16 h-16 text-emerald-400" />
        </div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">SpawnBot Status</h3>
        <div className="flex items-center gap-2 mb-3">
          <div className={`w-2 h-2 rounded-full ${botActive ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`}></div>
          <span className="text-sm font-medium text-white">{botActive ? 'Online & Scanning' : 'Paused'}</span>
        </div>
        <button 
          onClick={() => setBotActive(!botActive)}
          className={`w-full py-1.5 rounded-lg text-xs font-bold border ${
            botActive 
              ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20' 
              : 'border-slate-700 text-slate-400 hover:bg-slate-800'
          }`}
        >
          {botActive ? 'PAUSE AUTOMATION' : 'ACTIVATE BOT'}
        </button>
      </div>

      {/* Mini Feed */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Live Mesh Feed</h3>
        <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hide">
          {feed.slice(0, 10).map(evt => (
            <div key={evt.id} className="text-xs border-l-2 border-slate-800 pl-3 py-1">
              <p className="text-slate-300 font-medium truncate">{evt.text}</p>
              <div className="flex justify-between mt-1 text-slate-600">
                <span>{evt.actor}</span>
                <span>{evt.type}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );

  const QuestItem = ({ title, reward, progress }) => (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-200">{title}</span>
        <span className="text-cyan-400 font-mono">{reward}</span>
      </div>
      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500" style={{ width: `${progress}%` }}></div>
      </div>
    </div>
  );

  // --- VIEWS ---

  const HomeView = () => (
    <div className="space-y-6 animate-fade-in">
      {/* Hero Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="XP Balance" value={wallet.xp.toLocaleString()} unit="XP" glow="cyan" />
        <StatCard label="Spawn Token" value={wallet.spn.toLocaleString()} unit="SPN" glow="purple" />
        <StatCard label="Mesh Load" value="High" unit="98%" />
        <StatCard label="Gas (Base)" value="0.01" unit="gwei" />
      </div>

      {/* Daily Ritual */}
      <div className="bg-gradient-to-r from-slate-900 to-[#1e1b2e] border border-slate-800 rounded-2xl p-6 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
          <Flame className="w-32 h-32 text-orange-500" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full border-4 border-orange-500/50 bg-orange-500/10 flex items-center justify-center text-2xl font-black text-orange-400">
              {wallet.streak}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Daily Ritual</h2>
              <p className="text-sm text-slate-400">Streak Active. Keep it up for 2 more days for a <span className="text-orange-400">Mega Pack</span>.</p>
            </div>
          </div>
          <button 
            onClick={handleCheckIn}
            className="px-6 py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl shadow-lg shadow-orange-500/20 transition-transform active:scale-95"
          >
            Check-in (+50 XP)
          </button>
        </div>
      </div>

      {/* Unified Mesh Feed (Large) */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <Activity className="w-5 h-5 text-cyan-400" />
          <h3 className="text-lg font-bold text-white">Unified Activity Mesh</h3>
          <span className="ml-auto flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
        </div>
        <div className="space-y-0 divide-y divide-slate-800">
          {feed.map(evt => (
            <div key={evt.id} className="py-4 flex items-center gap-4 hover:bg-slate-800/30 px-2 -mx-2 rounded transition-colors cursor-pointer group">
              <div className={`p-2 rounded-lg bg-slate-800 text-slate-400 group-hover:text-cyan-400 group-hover:bg-cyan-950/30 transition-colors`}>
                {getIconForType(evt.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-200 truncate">{evt.text}</p>
                <div className="flex gap-2 text-xs text-slate-500 mt-0.5">
                  <span>{evt.actor}</span>
                  <span>•</span>
                  <span className="uppercase">{evt.type.replace('_', ' ')}</span>
                  {evt.tags && evt.tags.map(t => (
                    <span key={t} className="px-1.5 rounded bg-slate-800 text-slate-400 text-[10px]">{t}</span>
                  ))}
                </div>
              </div>
              <div className="text-xs font-mono text-slate-600">{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const MarketView = () => (
    <div className="space-y-6 animate-fade-in">
       <div className="flex justify-between items-center">
         <h2 className="text-2xl font-bold text-white">Marketplace</h2>
         <div className="flex gap-2">
            <button className="px-3 py-1.5 text-xs font-bold bg-cyan-600/20 text-cyan-400 rounded-lg border border-cyan-600/30">Packs</button>
            <button className="px-3 py-1.5 text-xs font-bold bg-slate-800 text-slate-400 rounded-lg border border-slate-700">Services</button>
         </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ListingCard 
            title="Genesis Token Pack" 
            price="0.05 ETH" 
            type="Pack" 
            desc="Contains 5 random tokens. Chance for Mythic."
            icon={Box}
            color="text-purple-400"
          />
          <ListingCard 
            title="Smart Contract Audit" 
            price="0.5 ETH" 
            type="Service" 
            desc="Full security review by Spawn Verified devs."
            icon={Shield}
            color="text-emerald-400"
          />
          <ListingCard 
            title="XP Booster (7 Days)" 
            price="1000 SPN" 
            type="Utility" 
            desc="2x XP multiplier for all actions."
            icon={Zap}
            color="text-yellow-400"
          />
       </div>
    </div>
  );

  const ForgeView = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 p-8 rounded-2xl text-center">
        <Terminal className="w-12 h-12 text-pink-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Creator Forge (No-Code)</h2>
        <p className="text-slate-400 max-w-md mx-auto mb-6">Deploy contracts, tokens, and pack series directly to the mesh without writing code.</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
           <button className="p-4 bg-slate-800 rounded-xl border border-slate-700 hover:border-pink-500 group transition-all">
              <div className="font-bold text-white mb-1 group-hover:text-pink-400">Deploy Token</div>
              <div className="text-xs text-slate-500">ERC-20 Standard</div>
           </button>
           <button className="p-4 bg-slate-800 rounded-xl border border-slate-700 hover:border-cyan-500 group transition-all">
              <div className="font-bold text-white mb-1 group-hover:text-cyan-400">Deploy Pack Series</div>
              <div className="text-xs text-slate-500">Lootbox Logic</div>
           </button>
        </div>
      </div>
      
      <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl">
        <h3 className="font-bold text-white mb-4">Your Deployments</h3>
        <div className="text-center text-slate-500 py-8 text-sm">No active contracts found on Base Mainnet.</div>
      </div>
    </div>
  );

  const SupCastView = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">SupCast <span className="text-slate-500 text-lg">Support Mesh</span></h2>
        <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-bold border border-slate-700">New Ticket</button>
      </div>

      <div className="space-y-3">
        {[1,2,3].map(i => (
          <div key={i} className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex items-center gap-4 hover:border-slate-600 cursor-pointer transition-colors">
            <div className="flex flex-col items-center justify-center w-12 h-12 bg-slate-800 rounded-lg text-green-400 border border-slate-700">
               <span className="text-xs font-bold">XP</span>
               <span className="font-black text-sm">500</span>
            </div>
            <div className="flex-1">
               <h4 className="font-bold text-slate-200">Help implementing Pack Reveal API?</h4>
               <p className="text-xs text-slate-500 mt-1">Posted by @dev_chad • 2h ago</p>
            </div>
            <div className="px-3 py-1 bg-blue-900/30 text-blue-400 text-xs font-bold rounded-full border border-blue-500/30">OPEN</div>
          </div>
        ))}
      </div>
    </div>
  );

  // --- SUB-COMPONENTS ---
  const StatCard = ({ label, value, unit, glow }) => (
    <div className={`bg-slate-900/80 border border-slate-800 p-4 rounded-xl ${glow ? `shadow-[0_0_15px_rgba(var(--${glow}-rgb),0.1)]` : ''}`}>
      <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">{label}</div>
      <div className={`text-2xl font-black text-white ${glow === 'cyan' ? 'text-cyan-400' : glow === 'purple' ? 'text-purple-400' : ''}`}>
        {value} <span className="text-xs font-normal text-slate-500">{unit}</span>
      </div>
    </div>
  );

  const ListingCard = ({ title, price, type, desc, icon: Icon, color }) => (
    <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl hover:border-slate-600 transition-colors cursor-pointer group">
      <div className="flex justify-between items-start mb-3">
        <div className={`p-2 rounded-lg bg-slate-800 ${color}`}>
           <Icon size={20} />
        </div>
        <span className="text-[10px] font-bold bg-slate-800 text-slate-400 px-2 py-1 rounded">{type}</span>
      </div>
      <h4 className="font-bold text-white mb-1 group-hover:text-cyan-400 transition-colors">{title}</h4>
      <p className="text-xs text-slate-500 mb-4">{desc}</p>
      <div className="flex justify-between items-center pt-3 border-t border-slate-800">
        <span className="font-mono text-white text-sm">{price}</span>
        <button className="text-xs bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg font-bold transition-colors">VIEW</button>
      </div>
    </div>
  );

  const getIconForType = (type) => {
    switch(type) {
      case 'pack_open': return <Box size={16} />;
      case 'burn': return <Flame size={16} />;
      case 'bot_trade': return <Bot size={16} />;
      case 'quest_complete': return <Trophy size={16} />;
      default: return <Activity size={16} />;
    }
  };

  // --- MODAL RENDERER ---
  const Modal = () => {
    if (!modalOpen) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
        <div className="bg-[#0f111a] w-full max-w-md rounded-2xl border border-slate-700 shadow-2xl overflow-hidden transform transition-all">
          {modalOpen === 'pack-reveal' && packRevealItem && (
            <div className="text-center p-8">
               <div className={`mx-auto w-24 h-24 flex items-center justify-center rounded-full border-4 mb-6 ${packRevealItem.border} bg-slate-900 shadow-[0_0_30px_rgba(255,255,255,0.1)]`}>
                 <Diamond className={`w-12 h-12 ${packRevealItem.color}`} />
               </div>
               <h2 className={`text-2xl font-black uppercase mb-2 ${packRevealItem.color}`}>{packRevealItem.label}</h2>
               <p className="text-slate-400 mb-6">Estimated Value: <span className="text-white font-mono">{packRevealItem.value}x</span></p>
               <button 
                 onClick={() => setModalOpen(null)}
                 className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-colors"
               >
                 Collect & Close
               </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // --- MAIN LAYOUT ---
  return (
    <div className="flex h-screen bg-[#050508] text-slate-200 font-sans selection:bg-cyan-500/30">
      <Sidebar />
      
      {/* Center Scrollable Area */}
      <main className="flex-1 lg:ml-64 xl:mr-80 flex flex-col h-full relative z-10">
        
        {/* Mobile Header */}
        <header className="lg:hidden h-16 border-b border-slate-800 flex items-center justify-between px-4 bg-[#050508]/90 backdrop-blur sticky top-0 z-30">
           <div className="font-black text-xl text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">SPAWN</div>
           <Settings className="w-6 h-6 text-slate-400" />
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-8 pb-24 lg:pb-8">
           {activeTab === 'home' && <HomeView />}
           {activeTab === 'market' && <MarketView />}
           {activeTab === 'loot' && <div className="text-center py-20 text-slate-500">Loot Inventory Loading...</div>}
           {activeTab === 'forge' && <ForgeView />}
           {activeTab === 'supcast' && <SupCastView />}
           {/* Add placeholders for other tabs as needed */}
        </div>

        {/* Mobile Bottom Nav */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#0c0a14]/95 backdrop-blur border-t border-slate-800 flex justify-around p-2 z-40 pb-safe">
           <button onClick={() => setActiveTab('home')} className={`p-2 rounded-lg flex flex-col items-center ${activeTab === 'home' ? 'text-cyan-400' : 'text-slate-500'}`}><Home size={20} /><span className="text-[10px] font-bold mt-1">Home</span></button>
           <button onClick={() => setActiveTab('market')} className={`p-2 rounded-lg flex flex-col items-center ${activeTab === 'market' ? 'text-cyan-400' : 'text-slate-500'}`}><ShoppingBag size={20} /><span className="text-[10px] font-bold mt-1">Market</span></button>
           <button onClick={() => setActiveTab('loot')} className={`p-2 rounded-lg flex flex-col items-center ${activeTab === 'loot' ? 'text-cyan-400' : 'text-slate-500'}`}><Gift size={20} /><span className="text-[10px] font-bold mt-1">Loot</span></button>
           <button onClick={() => setActiveTab('supcast')} className={`p-2 rounded-lg flex flex-col items-center ${activeTab === 'supcast' ? 'text-cyan-400' : 'text-slate-500'}`}><MessageSquare size={20} /><span className="text-[10px] font-bold mt-1">SupCast</span></button>
        </nav>
      </main>

      <Widgets />
      <Modal />

      {/* Global Styles for Animations/Scrollbars */}
      <style jsx global>{`
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #334155; }
        .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}


