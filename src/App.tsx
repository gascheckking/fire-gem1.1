import { useEffect, useMemo, useRef, useState } from "react";
import { auth, db, APP_ID } from "./firebase";
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";
import {
  addDoc,
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";

type TabId = "home" | "market" | "loot" | "forge" | "supcast";

type MeshEvent = {
  id: string | number;
  type: string;
  text: string;
  tags?: string[];
  actor?: string;
  ts?: any;
  ver?: string;
};

const RARITY = {
  FRAGMENT: { id: "fragment", label: "Fragment", hue: "slate", value: 0.1 },
  SHARD: { id: "shard", label: "Shard", hue: "cyan", value: 1.1 },
  CORE: { id: "core", label: "Core", hue: "purple", value: 4.0 },
  ARTIFACT: { id: "artifact", label: "Artifact", hue: "pink", value: 40.0 },
  RELIC: { id: "relic", label: "Relic", hue: "gold", value: 200.0 },
  OMEGA: { id: "omega", label: "Omega Core", hue: "red", value: 1000.0 },
} as const;

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function shortId(s: string) {
  if (!s) return "Anon";
  if (s.length <= 10) return s;
  return `${s.slice(0, 6)}...${s.slice(-4)}`;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [runtimeErr, setRuntimeErr] = useState<string | null>(null);

  const [wallet, setWallet] = useState({
    address: null as string | null,
    xp: 1575,
    spn: 497,
    streak: 5,
    inventory: [] as any[],
  });

  const [feed, setFeed] = useState<MeshEvent[]>([]);
  const [botActive, setBotActive] = useState(true);

  const [modalOpen, setModalOpen] = useState<null | "pack">(null);
  const [packRevealItem, setPackRevealItem] = useState<any>(null);

  const feedRef = useRef<HTMLDivElement | null>(null);

  const collPath = useMemo(() => `artifacts/${APP_ID}/mesh_events`, []);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (u) => {
      try {
        if (!u) {
          await signInAnonymously(auth);
          return;
        }
        setWallet((p) => ({ ...p, address: shortId(u.uid) }));

        const q = query(
          collection(db, collPath),
          orderBy("ts", "desc"),
          limit(40)
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
  }, [collPath]);

  const pushToMesh = async (type: string, text: string, tags: string[] = []) => {
    try {
      const evt = {
        type,
        text,
        tags,
        actor: wallet.address || "Anon",
        ts: serverTimestamp(),
        ver: "v4.0",
      };

      // Optimistisk UI
      setFeed((prev) => [
        { id: Date.now(), ...evt, ts: { toDate: () => new Date() } },
        ...prev,
      ]);

      await addDoc(collection(db, collPath), evt);
    } catch (err: any) {
      setRuntimeErr(String(err?.message || err));
    }
  };

  useEffect(() => {
    if (!botActive) return;

    const interval = setInterval(() => {
      if (Math.random() > 0.93) {
        const actions = [
          { type: "bot_trade", text: "🤖 SpawnBot: Auto-staked 50 SPN", tags: ["automation"] },
          { type: "bot_scan", text: "🤖 SpawnBot: Whale detected on Base", tags: ["intel"] },
          { type: "mesh_sync", text: "🌐 Mesh: Factory deployed", tags: ["infra"] },
          { type: "zora_buy", text: "🛒 Zora: Creator coin buy detected", tags: ["zora"] },
        ];
        const a = actions[Math.floor(Math.random() * actions.length)];
        void pushToMesh(a.type, a.text, a.tags);
      }
    }, 7000);

    return () => clearInterval(interval);
  }, [botActive, wallet.address]);

  const handleCheckIn = () => {
    setWallet((p) => ({ ...p, streak: p.streak + 1, xp: p.xp + 50 }));
    void pushToMesh("quest", "Daily check-in completed (+50 XP)", ["xp", "daily"]);
  };

  const handleOpenPack = () => {
    const roll = Math.random();
    let result = RARITY.FRAGMENT;
    if (roll > 0.992) result = RARITY.OMEGA;
    else if (roll > 0.985) result = RARITY.RELIC;
    else if (roll > 0.95) result = RARITY.ARTIFACT;
    else if (roll > 0.85) result = RARITY.CORE;
    else if (roll > 0.6) result = RARITY.SHARD;

    const xpGain = Math.max(5, Math.floor(result.value * 10));

    setWallet((prev) => ({
      ...prev,
      xp: prev.xp + xpGain,
      inventory: [result, ...prev.inventory].slice(0, 24),
    }));

    setPackRevealItem({ ...result, xpGain });
    setModalOpen("pack");
    void pushToMesh("pack_open", `Opened pack: ${result.label} (+${xpGain} XP)`, ["loot"]);
  };

  const TabPill = ({ id, label }: { id: TabId; label: string }) => (
    <button
      className={cx("pill", activeTab === id && "active")}
      onClick={() => setActiveTab(id)}
      type="button"
    >
      {label}
    </button>
  );

  const FeedRow = ({ e }: { e: MeshEvent }) => {
    const when =
      e?.ts?.toDate ? new Date(e.ts.toDate()).toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" }) : "";
    return (
      <div className="feed-row">
        <div className="feed-meta">
          <span className="feed-time">{when}</span>
          <span className="feed-dot" />
          <span className="feed-actor">{e.actor || "Anon"}</span>
        </div>
        <div className="feed-text">{e.text}</div>
        {e.tags?.length ? (
          <div className="feed-tags">
            {e.tags.slice(0, 4).map((t) => (
              <span key={t} className="tag">
                #{t}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <div className="app">
      <div className="bg-mesh" aria-hidden="true" />

      {runtimeErr && (
        <div className="toast">
          <strong>Runtime error:</strong> {runtimeErr}
        </div>
      )}

      <header className="topbar">
        <div className="brand">
          <div className="brand-badge">SE</div>
          <div className="brand-text">
            <div className="brand-title">SPAWN</div>
            <div className="brand-sub">MESH OS v4.0</div>
          </div>
        </div>

        <div className="status">
          <span className="status-pill">
            <span className="dot live" /> BASE · LIVE
          </span>
          <span className="status-pill">
            <span className="dot ok" /> {wallet.address ? `Wallet ${wallet.address}` : "Wallet connecting…"}
          </span>

          <button className="btn primary" type="button" onClick={() => setBotActive((v) => !v)}>
            {botActive ? "PAUSE BOT" : "RESUME BOT"}
          </button>
        </div>
      </header>

      <div className="content">
        <div className="tabs">
          <TabPill id="home" label="Home" />
          <TabPill id="market" label="Market" />
          <TabPill id="loot" label="Loot" />
          <TabPill id="forge" label="Forge" />
          <TabPill id="supcast" label="SupCast" />
        </div>

        {activeTab === "home" && (
          <>
            <section className="hud">
              <div className="hud-row">
                <div className="stat">
                  <div className="stat-k">XP</div>
                  <div className="stat-v">{wallet.xp.toLocaleString("sv-SE")}</div>
                </div>
                <div className="stat">
                  <div className="stat-k">SPN</div>
                  <div className="stat-v">{wallet.spn.toLocaleString("sv-SE")}</div>
                </div>
                <div className="stat">
                  <div className="stat-k">STREAK</div>
                  <div className="stat-v">{wallet.streak}</div>
                </div>
              </div>

              <div className="hud-actions">
                <button className="btn soft" type="button" onClick={handleCheckIn}>
                  Check-in (+50 XP)
                </button>
                <button className="btn soft" type="button" onClick={handleOpenPack}>
                  Quick Open Pack
                </button>
              </div>
            </section>

            <section className="panel">
              <div className="panel-head">
                <div className="panel-title">Live Mesh Feed</div>
                <div className="panel-sub">Realtime från Firestore · {APP_ID}</div>
              </div>

              <div className="feed" ref={feedRef}>
                {feed.length ? feed.map((e) => <FeedRow key={e.id} e={e} />) : <div className="empty">No events yet.</div>}
              </div>
            </section>
          </>
        )}

        {activeTab === "market" && (
          <section className="panel">
            <div className="panel-head">
              <div className="panel-title">Market</div>
              <div className="panel-sub">Placeholder (koppla senare)</div>
            </div>
            <div className="pad">
              <button className="btn soft" onClick={() => void pushToMesh("market_ping", "Market ping (demo)", ["market"])}>
                Push demo event
              </button>
            </div>
          </section>
        )}

        {activeTab === "forge" && (
          <section className="panel">
            <div className="panel-head">
              <div className="panel-title">Creator Forge</div>
              <div className="panel-sub">Placeholder (AI/Contracts senare)</div>
            </div>
            <div className="pad">
              <button className="btn soft" onClick={() => void pushToMesh("forge", "Forge opened (demo)", ["forge"])}>
                Push demo event
              </button>
            </div>
          </section>
        )}

        {activeTab === "supcast" && (
          <section className="panel">
            <div className="panel-head">
              <div className="panel-title">SupCast</div>
              <div className="panel-sub">Support / community layer</div>
            </div>
            <div className="pad">
              <button className="btn soft" onClick={() => void pushToMesh("supcast", "SupCast ping (demo)", ["support"])}>
                Push demo event
              </button>
            </div>
          </section>
        )}

        {activeTab === "loot" && (
          <>
            <section className="hud">
              <div className="hud-row">
                <div className="stat wide">
                  <div className="stat-k">INVENTORY</div>
                  <div className="stat-v">{wallet.inventory.length} items</div>
                </div>
                <button className="btn primary" type="button" onClick={handleOpenPack}>
                  Open Pack
                </button>
              </div>
            </section>

            <section className="panel">
              <div className="panel-head">
                <div className="panel-title">Loot Inventory</div>
                <div className="panel-sub">Din senaste pulls</div>
              </div>

              <div className="grid">
                {wallet.inventory.length ? (
                  wallet.inventory.map((i, idx) => (
                    <div key={idx} className={cx("card", `hue-${i.hue || "slate"}`)}>
                      <div className="card-top">
                        <div className="card-badge">{i.label}</div>
                        <div className="card-mini">v{(Math.random() * 0.9 + 1).toFixed(1)}</div>
                      </div>
                      <div className="card-bottom">
                        <div className="card-k">value</div>
                        <div className="card-v">{i.value}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty">Open a pack to see items here.</div>
                )}
              </div>
            </section>
          </>
        )}
      </div>

      {modalOpen === "pack" && packRevealItem && (
        <div className="modal" role="dialog" aria-modal="true">
          <div className="modal-card">
            <div className={cx("reveal", `hue-${packRevealItem.hue || "slate"}`)}>
              <div className="reveal-title">{packRevealItem.label}</div>
              <div className="reveal-sub">+{packRevealItem.xpGain} XP</div>
              <div className="reveal-glow" aria-hidden="true" />
            </div>

            <div className="modal-actions">
              <button className="btn soft" onClick={() => setModalOpen(null)} type="button">
                Close
              </button>
              <button className="btn primary" onClick={handleOpenPack} type="button">
                Open Another
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}