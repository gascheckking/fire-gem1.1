// src/App.tsx

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
  const [activeTab, setActiveTab] = useState<'home' | 'market' | 'loot' | 'forge' | 'supcast'>('home');
  const [feed, setFeed] = useState<MeshEvent[]>([]);
  const [runtimeErr, setRuntimeErr] = useState<string | null>(null);
  const [botActive, setBotActive] = useState(true);
  const [modalOpen, setModalOpen] = useState<string | null>(null);
  const [packRevealItem, setPackRevealItem] = useState<any>(null);

  const [wallet, setWallet] = useState({
    address: null as string | null,
    xp: 1575,
    spn: 497,
    streak: 5,
    inventory: [] as any[],
  });

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        await signInAnonymously(auth);
        return;
      }

      setWallet((prev) => ({
        ...prev,
        address: u.uid.slice(0, 6) + '...' + u.uid.slice(-4),
      }));

      try {
        const q = query(
          collection(db, `artifacts/${appId}/mesh_events`),
          orderBy('ts', 'desc'),
          limit(30)
        );

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
      } catch (err: any) {
        setRuntimeErr(String(err?.message || err));
      }
    });

    return () => unsubAuth();
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

      if (db) {
        await addDoc(collection(db, `artifacts/${appId}/mesh_events`), evt);
      }
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
          { type: 'mesh_sync', text: '🌐 Mesh: Factory deployed', tags: ['infra'] }
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
    void pushToMesh('pack_open', `Opened pack: ${result.label}`, ['loot']);
  };

  const handleCheckIn = () => {
    setWallet((p) => ({ ...p, streak: p.streak + 1, xp: p.xp + 50 }));
    void pushToMesh('quest', 'Daily check-in completed', ['xp']);
  };

  return (
    <div className="flex h-screen bg-[#050508] text-slate-200">
      {runtimeErr && (
        <div className="fixed top-3 left-3 right-3 z-[9999] bg-red-950/80 border border-red-500/40 text-red-200 text-xs p-3 rounded-xl">
          {runtimeErr}
        </div>
      )}

      <aside className="hidden lg:flex w-64 bg-[#0c0a14] border-r border-slate-800 p-4 flex-col">
        <div className="font-black text-xl mb-6">SPAWN</div>
        <button onClick={() => setActiveTab('home')}><Home /> Home</button>
        <button onClick={() => setActiveTab('market')}><ShoppingBag /> Market</button>
        <button onClick={() => setActiveTab('loot')}><Gift /> Loot</button>
        <button onClick={() => setActiveTab('forge')}><Terminal /> Forge</button>
        <button onClick={() => setActiveTab('supcast')}><MessageSquare /> SupCast</button>
      </aside>

      <main className="flex-1 p-6 overflow-y-auto">
        {activeTab === 'home' && (
          <div>
            <div className="mb-4">XP: {wallet.xp}</div>
            <button onClick={handleCheckIn}>Check-in</button>
            <div className="mt-6 space-y-2">
              {feed.map((e) => (
                <div key={e.id}>{e.text}</div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'market' && <div>Marketplace</div>}
        {activeTab === 'forge' && <div>Creator Forge</div>}
        {activeTab === 'supcast' && <div>SupCast</div>}

        {activeTab === 'loot' && (
          <div>
            <button onClick={handleOpenPack}>Open Pack</button>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {wallet.inventory.map((i, idx) => (
                <div key={idx} className="border p-2">{i.label}</div>
              ))}
            </div>
          </div>
        )}
      </main>

      {modalOpen && packRevealItem && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center">
          <div className="bg-[#0f111a] p-8 rounded-xl">
            <Diamond className="mx-auto mb-4" />
            <div className="text-xl">{packRevealItem.label}</div>
            <button onClick={() => setModalOpen(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}