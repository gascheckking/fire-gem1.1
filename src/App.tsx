import { auth, db, APP_ID } from './firebase';
import { useState, useEffect } from 'react';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import {
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';

import {
  Home,
  ShoppingBag,
  Gift,
  MessageSquare,
  Settings,
  Activity,
  Shield,
  Terminal,
  Box,
  Globe,
  Search,
  Trophy,
  Flame,
  Bot,
  Diamond,
  Zap,
} from 'lucide-react';

const appId = APP_ID;

const RARITY = {
  FRAGMENT: { id: 'fragment', label: 'Fragment', color: 'text-slate-400', border: 'border-slate-500', value: 0.1 },
  SHARD: { id: 'shard', label: 'Shard', color: 'text-cyan-400', border: 'border-cyan-500', value: 1.1 },
  CORE: { id: 'core', label: 'Core', color: 'text-purple-400', border: 'border-purple-500', value: 4.0 },
  ARTIFACT: { id: 'artifact', label: 'Artifact', color: 'text-pink-500', border: 'border-pink-500', value: 40.0 },
  RELIC: { id: 'relic', label: 'Relic', color: 'text-yellow-400', border: 'border-yellow-400', value: 200.0 },
  OMEGA: { id: 'omega', label: 'Omega Core', color: 'text-red-600', border: 'border-red-600', value: 1000.0 }
};

type MeshEvent = {
  id: string | number;
  type: string;
  text: string;
  tags?: string[];
  actor?: string;
  ts?: any;
  ver?: string;
};

export default function SpawnEngineOS() {
  const [activeTab, setActiveTab] = useState<string>('home');
  const [feed, setFeed] = useState<MeshEvent[]>([]);
  const [wallet, setWallet] = useState({
    address: null as string | null,
    xp: 1575,
    spn: 497,
    streak: 5,
    inventory: [] as any[],
  });

  const [botActive, setBotActive] = useState(true);
  const [modalOpen, setModalOpen] = useState<string | null>(null);
  const [packRevealItem, setPackRevealItem] = useState<any>(null);
const [runtimeErr, setRuntimeErr] = useState<string | null>(null);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      if (u) {
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

    const unsubFeed = onSnapshot(
  q,
  (snap) => {
    setFeed(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
  },
  (err) => {
    setRuntimeErr(String(err?.message || err));
  }
);

    return () => {
      unsubAuth();
      unsubFeed();
    };
  }, []);

  const pushToMesh = async (type: string, text: string, tags: string[] = []) => {
  try {
    const evt = {
      type,
      text,
      tags,
      actor: wallet.address || 'Anon',
      ts: serverTimestamp(),
      ver: 'v1.0',
    };

    setFeed((prev) => [
      { id: Date.now(), ...evt, ts: { toDate: () => new Date() } },
      ...prev,
    ]);

    await addDoc(collection(db, `artifacts/${appId}/public/mesh_events`), evt);
  } catch (err: any) {
    setRuntimeErr(String(err?.message || err));
  }
};

  useEffect(() => {
    if (!botActive) return;
    const interval = setInterval(() => {
      if (Math.random() > 0.95) {
        const actions = [
          { type: 'bot_trade', text: '🤖 SpawnBot: Auto-staked 50 SPN (Streak Safe)', tags: ['automation'] },
          { type: 'bot_scan', text: '🤖 SpawnBot: Detected Whale movement on Zora chain.', tags: ['intel'] },
          { type: 'mesh_sync', text: '🌐 Mesh: New contract factory deployed by @builder0x', tags: ['infra'] }
        ];
        const action = actions[Math.floor(Math.random() * actions.length)];
        void pushToMesh(action.type, action.text, action.tags);
      }
    }, 8000);
    return () => clearInterval(interval);
  }, [botActive, wallet.address]);

  const handleOpenPack = () => {
    const roll = Math.random();
    let result = RARITY.FRAGMENT;
    if (roll > 0.99) result = RARITY.RELIC;
    else if (roll > 0.95) result = RARITY.ARTIFACT;
    else if (roll > 0.85) result = RARITY.CORE;
    else if (roll > 0.60) result = RARITY.SHARD;

    const xpGain = Math.floor(result.value * 10);
    setWallet((prev) => ({
      ...prev,
      xp: prev.xp + xpGain,
      inventory: [result, ...prev.inventory],
    }));

    setPackRevealItem(result);
    setModalOpen('pack-reveal');
    void pushToMesh('pack_open', `Opened GENESIS Pack. Pulled: ${result.label.toUpperCase()}`, ['loot', result.id]);
  };

  const handleCheckIn = () => {
    setWallet((prev) => ({ ...prev, streak: prev.streak + 1, xp: prev.xp + 50 }));
    void pushToMesh('quest_complete', `Daily Ritual Check-in completed. Streak: ${wallet.streak + 1}`, ['streak', 'xp']);
  };

  const SidebarItem = ({ id, icon: Icon, label }: { id: string; icon: any; label: string }) => (
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

  const Widgets = () => (
    <aside className="hidden xl:flex flex-col w-80 border-l border-slate-800 bg-[#0c0a14] fixed right-0 h-full z-20 p-6 space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
        <input
          type="text"
          placeholder="Search tokens, packs..."
          className="w-full bg-slate-900 border border-slate-800 rounded-full py-2 pl-10 pr-4 text-sm text-slate-300 focus:outline-none focus:border-cyan-500/50 transition-colors"
        />
      </div>

      <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-3 opacity-10">
          <Bot className="w-16 h-16 text-emerald-400" />
        </div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">SpawnBot Status</h3>
        <div className="flex items-center gap-2 mb-3">
          <div className={`w-2 h-2 rounded-full ${botActive ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`} />
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

      <div className="flex-1 overflow-hidden flex flex-col">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Live Mesh Feed</h3>
        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {feed.slice(0, 10).map((evt) => (
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

  const getIconForType = (type: string) => {
    switch (type) {
      case 'pack_open': return <Box size={16} />;
      case 'burn': return <Flame size={16} />;
      case 'bot_trade': return <Bot size={16} />;
      case 'quest_complete': return <Trophy size={16} />;
      default: return <Activity size={16} />;
    }
  };

  const HomeView = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">XP Balance</div>
          <div className="text-2xl font-black text-cyan-400">
            {wallet.xp.toLocaleString()} <span className="text-xs font-normal text-slate-500">XP</span>
          </div>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Spawn Token</div>
          <div className="text-2xl font-black text-purple-400">
            {wallet.spn.toLocaleString()} <span className="text-xs font-normal text-slate-500">SPN</span>
          </div>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Mesh Load</div>
          <div className="text-2xl font-black text-white">High <span className="text-xs font-normal text-slate-500">98%</span></div>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Gas (Base)</div>
          <div className="text-2xl font-black text-white">0.01 <span className="text-xs font-normal text-slate-500">gwei</span></div>
        </div>
      </div>

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

      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <Activity className="w-5 h-5 text-cyan-400" />
          <h3 className="text-lg font-bold text-white">Unified Activity Mesh</h3>
          <span className="ml-auto flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
        </div>
        <div className="space-y-0 divide-y divide-slate-800">
          {feed.map((evt) => (
            <div key={evt.id} className="py-4 flex items-center gap-4 hover:bg-slate-800/30 px-2 -mx-2 rounded transition-colors cursor-pointer group">
              <div className="p-2 rounded-lg bg-slate-800 text-slate-400 group-hover:text-cyan-400 group-hover:bg-cyan-950/30 transition-colors">
                {getIconForType(evt.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-200 truncate">{evt.text}</p>
                <div className="flex gap-2 text-xs text-slate-500 mt-0.5">
                  <span>{evt.actor}</span>
                  <span>•</span>
                  <span className="uppercase">{evt.type.replace('_', ' ')}</span>
                  {evt.tags?.map((t) => (
                    <span key={t} className="px-1.5 rounded bg-slate-800 text-slate-400 text-[10px]">{t}</span>
                  ))}
                </div>
              </div>
              <div className="text-xs font-mono text-slate-600">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const MarketView = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Marketplace</h2>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 text-xs font-bold bg-cyan-600/20 text-cyan-400 rounded-lg border border-cyan-600/30">Packs</button>
          <button className="px-3 py-1.5 text-xs font-bold bg-slate-800 text-slate-400 rounded-lg border border-slate-700">Services</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2 rounded-lg bg-slate-800 text-purple-400"><Box size={20} /></div>
            <span className="text-[10px] font-bold bg-slate-800 text-slate-400 px-2 py-1 rounded">Pack</span>
          </div>
          <h4 className="font-bold text-white mb-1">Genesis Token Pack</h4>
          <p className="text-xs text-slate-500 mb-4">Contains 5 random tokens. Chance for Mythic.</p>
          <div className="flex justify-between items-center pt-3 border-t border-slate-800">
            <span className="font-mono text-white text-sm">0.05 ETH</span>
            <button className="text-xs bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg font-bold">VIEW</button>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2 rounded-lg bg-slate-800 text-emerald-400"><Shield size={20} /></div>
            <span className="text-[10px] font-bold bg-slate-800 text-slate-400 px-2 py-1 rounded">Service</span>
          </div>
          <h4 className="font-bold text-white mb-1">Smart Contract Audit</h4>
          <p className="text-xs text-slate-500 mb-4">Full security review by Spawn Verified devs.</p>
          <div className="flex justify-between items-center pt-3 border-t border-slate-800">
            <span className="font-mono text-white text-sm">0.5 ETH</span>
            <button className="text-xs bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg font-bold">VIEW</button>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl md:col-span-2">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2 rounded-lg bg-slate-800 text-yellow-400"><Zap size={20} /></div>
            <span className="text-[10px] font-bold bg-slate-800 text-slate-400 px-2 py-1 rounded">Utility</span>
          </div>
          <h4 className="font-bold text-white mb-1">XP Booster (7 Days)</h4>
          <p className="text-xs text-slate-500 mb-4">2x XP multiplier for all actions.</p>
          <div className="flex justify-between items-center pt-3 border-t border-slate-800">
            <span className="font-mono text-white text-sm">1000 SPN</span>
            <button className="text-xs bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg font-bold">VIEW</button>
          </div>
        </div>
      </div>
    </div>
  );

  const ForgeView = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 p-8 rounded-2xl text-center">
        <Terminal className="w-12 h-12 text-pink-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Creator Forge (No-Code)</h2>
        <p className="text-slate-400 max-w-md mx-auto mb-6">Deploy contracts, tokens, and pack series directly to the mesh without writing code.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
          <button className="p-4 bg-slate-800 rounded-xl border border-slate-700 hover:border-pink-500 transition-all">
            <div className="font-bold text-white mb-1">Deploy Token</div>
            <div className="text-xs text-slate-500">ERC-20 Standard</div>
          </button>
          <button className="p-4 bg-slate-800 rounded-xl border border-slate-700 hover:border-cyan-500 transition-all">
            <div className="font-bold text-white mb-1">Deploy Pack Series</div>
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">SupCast <span className="text-slate-500 text-lg">Support Mesh</span></h2>
        <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-bold border border-slate-700">New Ticket</button>
      </div>
      <div className="text-center py-20 text-slate-500">SupCast Loading...</div>
    </div>
  );

  const Modal = () => {
    if (!modalOpen) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <div className="bg-[#0f111a] w-full max-w-md rounded-2xl border border-slate-700 shadow-2xl overflow-hidden">
          {modalOpen === 'pack-reveal' && packRevealItem && (
            <div className="text-center p-8">
              <div className={`mx-auto w-24 h-24 flex items-center justify-center rounded-full border-4 mb-6 ${packRevealItem.border} bg-slate-900 shadow-[0_0_30px_rgba(255,255,255,0.1)]`}>
                <Diamond className={`w-12 h-12 ${packRevealItem.color}`} />
              </div>
              <h2 className={`text-2xl font-black uppercase mb-2 ${packRevealItem.color}`}>{packRevealItem.label}</h2>
              <p className="text-slate-400 mb-6">
                Estimated Value: <span className="text-white font-mono">{packRevealItem.value}x</span>
              </p>
              <button onClick={() => setModalOpen(null)} className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold">
                Collect & Close
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-[#050508] text-slate-200 font-sans">
{runtimeErr && (
  <div className="fixed top-3 left-3 right-3 z-[9999] bg-red-950/80 border border-red-500/40 text-red-200 text-xs p-3 rounded-xl backdrop-blur">
    <div className="font-bold mb-1">Runtime error:</div>
    <div className="break-words">{runtimeErr}</div>
  </div>
)}
      <Sidebar />

      <main className="flex-1 lg:ml-64 xl:mr-80 flex flex-col h-full relative z-10">
        <header className="lg:hidden h-16 border-b border-slate-800 flex items-center justify-between px-4 bg-[#050508]/90 backdrop-blur sticky top-0 z-30">
          <div className="font-black text-xl text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">SPAWN</div>
          <Settings className="w-6 h-6 text-slate-400" />
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-8 pb-24 lg:pb-8">
          {activeTab === 'home' && <HomeView />}
          {activeTab === 'market' && <MarketView />}
          {activeTab === 'loot' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Packs & Loot</h2>
                <button onClick={handleOpenPack} className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-bold">
                  Open Pack
                </button>
              </div>

              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                <div className="text-sm text-slate-400 mb-4">Inventory</div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {wallet.inventory.length === 0 && <div className="text-slate-500">No items yet.</div>}
                  {wallet.inventory.map((it, idx) => (
                    <div key={idx} className={`bg-slate-900/80 border ${it.border} rounded-xl p-3`}>
                      <div className={`font-black ${it.color}`}>{it.label}</div>
                      <div className="text-xs text-slate-500 mt-1">Value: {it.value}x</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          {activeTab === 'forge' && <ForgeView />}
          {activeTab === 'supcast' && <SupCastView />}
        </div>

        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#0c0a14]/95 backdrop-blur border-t border-slate-800 flex justify-around p-2 z-40">
          <button onClick={() => setActiveTab('home')} className={`p-2 rounded-lg flex flex-col items-center ${activeTab === 'home' ? 'text-cyan-400' : 'text-slate-500'}`}>
            <Home size={20} /><span className="text-[10px] font-bold mt-1">Home</span>
          </button>
          <button onClick={() => setActiveTab('market')} className={`p-2 rounded-lg flex flex-col items-center ${activeTab === 'market' ? 'text-cyan-400' : 'text-slate-500'}`}>
            <ShoppingBag size={20} /><span className="text-[10px] font-bold mt-1">Market</span>
          </button>
          <button onClick={() => setActiveTab('loot')} className={`p-2 rounded-lg flex flex-col items-center ${activeTab === 'loot' ? 'text-cyan-400' : 'text-slate-500'}`}>
            <Gift size={20} /><span className="text-[10px] font-bold mt-1">Loot</span>
          </button>
          <button onClick={() => setActiveTab('supcast')} className={`p-2 rounded-lg flex flex-col items-center ${activeTab === 'supcast' ? 'text-cyan-400' : 'text-slate-500'}`}>
            <MessageSquare size={20} /><span className="text-[10px] font-bold mt-1">SupCast</span>
          </button>
        </nav>
      </main>

      <Widgets />
      <Modal />
    </div>
  );
}