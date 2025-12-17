// src/App.tsx

import { useState, useEffect } from 'react';
import { auth, db, APP_ID } from './firebase';
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

const EVENTS_COL = collection(db, 'artifacts', APP_ID, 'mesh_events');

const RARITY = {
  FRAGMENT: { id: 'fragment', label: 'Fragment', color: 'text-slate-400', border: 'border-slate-500', value: 0.1 },
  SHARD: { id: 'shard', label: 'Shard', color: 'text-cyan-400', border: 'border-cyan-500', value: 1.1 },
  CORE: { id: 'core', label: 'Core', color: 'text-purple-400', border: 'border-purple-500', value: 4.0 },
  ARTIFACT: { id: 'artifact', label: 'Artifact', color: 'text-pink-500', border: 'border-pink-500', value: 40.0 },
  RELIC: { id: 'relic', label: 'Relic', color: 'text-yellow-400', border: 'border-yellow-400', value: 200.0 },
  OMEGA: { id: 'omega', label: 'Omega Core', color: 'text-red-600', border: 'border-red-600', value: 1000.0 },
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

type TabId = 'home' | 'market' | 'loot' | 'forge' | 'supcast';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [feed, setFeed] = useState<MeshEvent[]>([]);
  const [runtimeErr, setRuntimeErr] = useState<string | null>(null);
  const [botActive, setBotActive] = useState(true);
  const [modalOpen, setModalOpen] = useState<string | null>(null);
  const [packRevealItem, setPackRevealItem] = useState<any>(null);
  const [authed, setAuthed] = useState(false);

  const [wallet, setWallet] = useState({
    address: null as string | null,
    xp: 1575,
    spn: 497,
    streak: 5,
    inventory: [] as any[],
  });

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      if (!u) {
        signInAnonymously(auth).catch((e) => setRuntimeErr(String(e?.message || e)));
        return;
      }
      setAuthed(true);
      setWallet((prev) => ({
        ...prev,
        address: u.uid.slice(0, 6) + '...' + u.uid.slice(-4),
      }));
    });

    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!authed) return;

    const q = query(EVENTS_COL, orderBy('ts', 'desc'), limit(30));
    const unsubFeed = onSnapshot(
      q,
      (snap) => {
        setFeed(
          snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as any),
          }))
        );
      },
      (err) => setRuntimeErr(String(err?.message || err))
    );

    return () => unsubFeed();
  }, [authed]);

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

      setFeed((prev) => [{ id: Date.now(), ...evt }, ...prev]);

      await addDoc(EVENTS_COL, evt);
    } catch (err: any) {
      setRuntimeErr(String(err?.message || err));
    }
  };

  useEffect(() => {
    if (!botActive) return;
    const interval = setInterval(() => {
      if (Math.random() > 0.95) {
        const actions = [
          { type: 'bot_trade', text: '🤖 SpawnBot: Auto-staked 50 SPN', tags: ['automation'] },
          { type: 'bot_scan', text: '🤖 SpawnBot: Whale detected on Base', tags: ['intel'] },
          { type: 'mesh_sync', text: '🌐 Mesh: Factory deployed', tags: ['infra'] },
        ];
        const a = actions[Math.floor(Math.random() * actions.length)];
        void pushToMesh(a.type, a.text, a.tags);
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
    else if (roll > 0.6) result = RARITY.SHARD;

    const xpGain = Math.floor(result.value * 10);

    setWallet((prev) => ({
      ...prev,
      xp: prev.xp + xpGain,
      inventory: [result, ...prev.inventory],
    }));

    setPackRevealItem(result);
    setModalOpen('pack');
    void pushToMesh('pack_open', `Opened pack: ${result.label}`, ['loot', result.id]);
  };

  const handleCheckIn = () => {
    setWallet((p) => ({ ...p, streak: p.streak + 1, xp: p.xp + 50 }));
    void pushToMesh('quest', 'Daily check-in completed', ['xp', 'streak']);
  };

  return (
    <div className="flex h-screen bg-[#050508] text-slate-200">
      {runtimeErr && (
        <div className="fixed top-3 left-3 right-3 z-[9999] bg-red-950/80 border border-red-500/40 text-red-200 text-xs p-3 rounded-xl">
          Runtime error: {runtimeErr}
        </div>
      )}

      <aside className="hidden lg:flex w-64 bg-[#0c0a14] border-r border-slate-800 p-4 flex-col">
        <div className="mb-6">
          <div className="font-black text-2xl">SPAWN</div>
          <div className="text-[10px] text-slate-500 font-mono">MESH OS v4.0</div>
        </div>

        <div className="space-y-2">
          <button className="flex items-center gap-2 text-slate-300 hover:text-white" onClick={() => setActiveTab('home')}>
            <Home size={18} /> Home
          </button>
          <button className="flex items-center gap-2 text-slate-300 hover:text-white" onClick={() => setActiveTab('market')}>
            <ShoppingBag size={18} /> Market
          </button>
          <button className="flex items-center gap-2 text-slate-300 hover:text-white" onClick={() => setActiveTab('loot')}>
            <Gift size={18} /> Loot
          </button>
          <button className="flex items-center gap-2 text-slate-300 hover:text-white" onClick={() => setActiveTab('forge')}>
            <Terminal size={18} /> Forge
          </button>
          <button className="flex items-center gap-2 text-slate-300 hover:text-white" onClick={() => setActiveTab('supcast')}>
            <MessageSquare size={18} /> SupCast
          </button>
        </div>

        <div className="mt-auto pt-4 border-t border-slate-800">
          <div className="text-xs text-slate-500">Wallet</div>
          <div className="text-sm text-slate-200 font-mono">{wallet.address || 'Connecting...'}</div>
          <button
            onClick={() => setBotActive((v) => !v)}
            className="mt-3 w-full text-xs font-bold py-2 rounded-lg border border-slate-700 bg-slate-900/40"
          >
            {botActive ? 'PAUSE BOT' : 'ACTIVATE BOT'}
          </button>
        </div>
      </aside>

      <main className="flex-1 p-6 overflow-y-auto">
        {activeTab === 'home' && (
          <div>
            <div className="mb-4">XP: {wallet.xp}</div>
            <button className="px-4 py-2 bg-orange-600 rounded-lg font-bold" onClick={handleCheckIn}>
              Check-in
            </button>

            <div className="mt-6 space-y-2">
              {feed.map((e) => (
                <div key={String(e.id)} className="text-sm border-b border-slate-800 py-2">
                  {e.text}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'market' && <div className="text-xl font-bold">Marketplace</div>}
        {activeTab === 'forge' && <div className="text-xl font-bold">Creator Forge</div>}
        {activeTab === 'supcast' && <div className="text-xl font-bold">SupCast</div>}

        {activeTab === 'loot' && (
          <div>
            <button className="px-4 py-2 bg-purple-600 rounded-lg font-bold" onClick={handleOpenPack}>
              Open Pack
            </button>

            <div className="grid grid-cols-2 gap-2 mt-4">
              {wallet.inventory.map((i, idx) => (
                <div key={idx} className={`border ${i.border || 'border-slate-700'} p-3 rounded-lg bg-slate-900/40`}>
                  <div className={`font-black ${i.color || ''}`}>{i.label}</div>
                  <div className="text-xs text-slate-500">Value: {i.value}x</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {modalOpen && packRevealItem && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#0f111a] p-8 rounded-xl border border-slate-700 w-full max-w-sm text-center">
            <Diamond className="mx-auto mb-4" />
            <div className="text-xl font-black mb-2">{packRevealItem.label}</div>
            <div className="text-xs text-slate-500 mb-6">Value: {packRevealItem.value}x</div>
            <button className="w-full py-2 bg-slate-800 rounded-lg font-bold" onClick={() => setModalOpen(null)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}