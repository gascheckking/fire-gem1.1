import React, { useEffect, useMemo, useState } from "react";
import { auth, db, PROJECT_ID } from "./firebase";
import { onAuthStateChanged, signInAnonymously, User } from "firebase/auth";
import {
  addDoc,
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";

type Tab = "Home" | "Market" | "Loot" | "Forge" | "SupCast";

type MeshEvent = {
  id: string;
  label?: string;
  kind?: string;
  xp?: number;
  ts?: any;
};

const shortId = (s?: string) => (s ? `${s.slice(0, 5)}…${s.slice(-3)}` : "—");

export default function App() {
  const [tab, setTab] = useState<Tab>("Home");
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  // UI mock stats (byt senare mot riktig data)
  const [xp, setXp] = useState(1575);
  const [spn] = useState(497);
  const [streak, setStreak] = useState(5);

  // Firestore feed
  const [events, setEvents] = useState<MeshEvent[]>([]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        try {
          await signInAnonymously(auth);
        } catch (e) {
          console.error(e);
        }
      } else {
        setUser(u);
      }
      setReady(true);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "mesh_events"), orderBy("ts", "desc"), limit(20));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows: MeshEvent[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
        setEvents(rows);
      },
      (err) => console.error(err)
    );
    return () => unsub();
  }, []);

  const walletLabel = useMemo(() => {
    const uid = user?.uid ?? "";
    return uid ? `Wallet ${shortId(uid)}` : "Wallet —";
  }, [user]);

  const pushEvent = async (payload: Partial<MeshEvent>) => {
    await addDoc(collection(db, "mesh_events"), {
      ...payload,
      ts: serverTimestamp(),
    });
  };

  const checkIn = async () => {
    await pushEvent({ kind: "checkin", label: "Check-in (+50 XP)", xp: 50 });
    setXp((v) => v + 50);
    setStreak((v) => Math.min(999, v + 1));
  };

  const quickOpen = async () => {
    await pushEvent({ kind: "pack_open", label: "Quick Open Pack" });
  };

  const Pill = ({ t }: { t: Tab }) => (
    <button className={`pill ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
      {t}
    </button>
  );

  return (
    <div className="safe wrap">
      <div className="shell">
        {/* TOP HUD */}
        <div className="glass2 topHud">
          <div className="row">
            <div className="brand">
              <div className="logo">SE</div>
              <div className="brandText">
                <div className="title">SPAWN</div>
                <div className="sub">MESH OS v4.0</div>
              </div>
            </div>

            <div className="rightStack">
              <div className="badge">
                <span className="dot" />
                BASE · LIVE
              </div>
              <div className="badge">{walletLabel}</div>
              <button className="btnPink" onClick={() => pushEvent({ kind: "bot", label: "Pause Bot" })}>
                PAUSE BOT
              </button>
            </div>
          </div>

          <div className="hr" />

          <div className="pills">
            <Pill t="Home" />
            <Pill t="Market" />
            <Pill t="Loot" />
            <Pill t="Forge" />
            <Pill t="SupCast" />
          </div>
        </div>

        {/* CONTENT */}
        {tab === "Home" && (
          <>
            <div className="grid">
              <div className="glass card">
                <div className="label">XP</div>
                <div className="value">{xp.toLocaleString("sv-SE")}</div>
              </div>

              <div className="glass card">
                <div className="label">SPN</div>
                <div className="value">{spn.toLocaleString("sv-SE")}</div>
              </div>

              <div className="glass card cardBig">
                <div className="label">STREAK</div>
                <div className="valueSmall">{streak}</div>

                <div className="actions">
                  <button className="btnDark" onClick={checkIn}>
                    Check-in (+50 XP)
                  </button>
                  <button className="btnDark" onClick={quickOpen}>
                    Quick Open Pack
                  </button>
                </div>
              </div>
            </div>

            <div className="glass feed">
              <div className="feedTitle">Live Mesh Feed</div>
              <div className="feedSub">
                Realtime från Firestore · {PROJECT_ID}
              </div>

              <div className="feedBox">
                {!ready ? (
                  <div>Loading…</div>
                ) : events.length === 0 ? (
                  <div>No events yet.</div>
                ) : (
                  events.slice(0, 8).map((e) => (
                    <div key={e.id} style={{ padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,.06)" }}>
                      <div style={{ fontWeight: 900, color: "rgba(232,233,242,.92)" }}>
                        {e.label ?? e.kind ?? "event"}
                      </div>
                      <div className="smallNote">
                        {e.kind ? `kind: ${e.kind}` : ""}{e.xp ? ` · +${e.xp} XP` : ""}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="smallNote">
                Tip: Klicka “Check-in” så ser du direkt eventet i feeden (realtime).
              </div>
            </div>
          </>
        )}

        {tab !== "Home" && (
          <div className="glass feed" style={{ marginTop: 14 }}>
            <div className="feedTitle">{tab}</div>
            <div className="feedSub">Den här fliken är redo – vi fyller den med rätt view sen.</div>
            <div className="feedBox">LOOKEN är kvar. Data kommer nästa.</div>
          </div>
        )}
      </div>
    </div>
  );
}