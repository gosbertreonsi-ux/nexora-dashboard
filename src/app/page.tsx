'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Radio, Activity, Ban, Server, DollarSign } from 'lucide-react';

interface MetricLog {
  id: string;
  deviceFingerprint: string;
  status: string;
  revenue: number;
  timestamp: string;
}

export default function Dashboard() {
  const [balanceMetricUnits, setBalanceMetricUnits] = useState<string>("0");
  const [totalChecks, setTotalChecks] = useState<number>(0);
  const [liveLogs, setLiveLogs] = useState<MetricLog[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [bannedDevices, setBannedDevices] = useState<string[]>([]);
  const [socketInstance, setSocketInstance] = useState<WebSocket | null>(null);

  // Keep a local array of the last 10 count values to simulate chart data bars
  const [chartData, setChartData] = useState<number[]>([10, 25, 45, 30, 55, 70, 65, 80, 95, 100]);

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:8080/gravity-stream');
    setSocketInstance(socket);

    socket.onopen = () => {
      setIsConnected(true);
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.status === "SUCCESS") {
          setTotalChecks((prev) => {
            const nextCount = prev + 1;
            // Update rolling chart bars array data simulation
            setChartData((curr) => [...curr.slice(1), Math.min(nextCount % 120, 120)]);
            return nextCount;
          });
          setBalanceMetricUnits(data.balanceMetricUnits || "0");
          
          const newLog: MetricLog = {
            id: Math.random().toString(36).substring(2, 9).toUpperCase(),
            deviceFingerprint: data.deviceFingerprint || "DEVICE_NODE_" + Math.random().toString(36).substring(2, 6).toUpperCase(),
            status: data.authenticated ? "PASS" : "FAIL",
            revenue: 0.00001,
            timestamp: new Date().toLocaleTimeString()
          };

          setLiveLogs((prev) => [newLog, ...prev.slice(0, 8)]);
        }
      } catch (err) {
        console.error("Failed to parse incoming streaming telemetry packet:", err);
      }
    };

    socket.onclose = () => {
      setIsConnected(false);
    };

    return () => socket.close();
  }, []);

  // FRONTEND CLICK-TO-BAN FIRING MATRIX
  const triggerManualBan = (fingerprint: string) => {
    if (socketInstance && isConnected) {
      // Send a targeted block structure to tell the server to permanently flag this phone
      socketInstance.send(JSON.stringify({
        action: "MANUAL_BAN_OVERRIDE",
        deviceFingerprint: fingerprint
      }));
      setBannedDevices((prev) => [...prev, fingerprint]);
      // Instantly filter out banned logs visually
      setLiveLogs((prev) => prev.map(log => log.deviceFingerprint === fingerprint ? { ...log, status: "BANNED" } : log));
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 p-8 font-sans">
      {/* HEADER BAR ROW */}
      <header className="flex justify-between items-center border-b border-slate-800 pb-6 mb-8">
        <div className="flex items-center gap-3">
          <Server className="text-emerald-400 h-8 w-8" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
              NEXORA <span className="text-emerald-400">GRAVITY</span>
            </h1>
            <p className="text-xs text-slate-400">Autonomous Zero-Trust Proof-of-Presence Command Console</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-4 py-2 rounded-lg">
          <Radio className={`h-4 w-4 ${isConnected ? 'text-emerald-500 animate-pulse' : 'text-rose-500'}`} />
          <span className="text-xs font-mono uppercase text-slate-300 font-semibold">{isConnected ? 'MESH STREAM ACTIVE' : 'GRID CONNECTING'}</span>
        </div>
      </header>

      {/* METRICS CARDS GRID MAP */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl relative overflow-hidden">
          <Activity className="absolute right-4 top-4 h-5 w-5 text-slate-700" />
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Total Verified Streams</p>
          <p className="text-4xl font-mono font-bold text-slate-100">{totalChecks.toLocaleString()}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl relative overflow-hidden">
          <DollarSign className="absolute right-4 top-4 h-5 w-5 text-slate-700" />
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Secure Credit Ledger Units</p>
          <p className="text-4xl font-mono font-bold text-emerald-400">{balanceMetricUnits}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl relative overflow-hidden">
          <Shield className="absolute right-4 top-4 h-5 w-5 text-slate-700" />
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Active Manual Override Bans</p>
          <p className="text-4xl font-mono font-bold text-rose-400">{bannedDevices.length}</p>
        </div>
      </section>

      {/* NEW SECTION: OPTION 2 - REAL-TIME VISUALIZATION CHART MATRIX BAR LINES */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-8">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
          <Activity className="h-4 w-4 text-emerald-400" /> Live Data Load & Network Cash Velocity
        </h2>
        <div className="h-28 flex items-end gap-2 pt-4 px-2 border-b border-slate-800 border-l">
          {chartData.map((val, idx) => (
            <div 
              key={idx} 
              style={{ height: `${Math.max(val, 8)}%` }} 
              className="flex-1 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t transition-all duration-300 shadow-[0_0_10px_rgba(52,211,153,0.2)]"
            />
          ))}
        </div>
        <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-2">
          <span>-10s intervals</span>
          <span>Live Ticker</span>
        </div>
      </section>

      {/* TABLE TRACKER SECTOR WITH OPTION 1: THE OVERRIDE CLICK-TO-BAN BUTTON BUTTON */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">Real-Time Ingestion Logs</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-3 font-medium">Log ID</th>
                <th className="pb-3 font-medium">Device Fingerprint Profile</th>
                <th className="pb-3 font-medium">Attestation Proof Status</th>
                <th className="pb-3 font-medium">Micro-Fee Entry</th>
                <th className="pb-3 font-medium text-center">Security Action Override</th>
                <th className="pb-3 font-medium text-right">System Clock</th>
              </tr>
            </thead>
            <tbody>
              {liveLogs.map((log) => (
                <tr key={log.id} className="border-b border-slate-900 last:border-0 hover:bg-slate-900/50">
                  <td className="py-3 text-slate-500">{log.id}</td>
                  <td className="py-3 text-slate-200 font-bold">{log.deviceFingerprint}</td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      log.status === 'PASS' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                      log.status === 'BANNED' ? 'bg-slate-800 text-slate-400 border border-slate-700' :
                      'bg-rose-950 text-rose-400 border border-rose-800'
                    }`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="py-3 text-emerald-400 font-semibold">+0.00001</td>
                  
                  {/* OVERRIDE BUTTON INJECTION ELEMENT */}
                  <td className="py-3 text-center">
                    {log.status === 'PASS' ? (
                      <button 
                        onClick={() => triggerManualBan(log.deviceFingerprint)}
                        className="inline-flex items-center gap-1 bg-rose-950/40 text-rose-400 border border-rose-900/60 px-3 py-1 rounded hover:bg-rose-900 hover:text-white transition-all duration-200 cursor-pointer font-sans text-[11px]"
                      >
                        <Ban className="h-3 w-3" /> Isolate & Ban
                      </button>
                    ) : (
                      <span className="text-slate-600 italic text-[11px]">Enforced</span>
                    )}
                  </td>

                  <td className="py-3 text-right text-slate-500">{log.timestamp}</td>
                </tr>
              ))}
              {liveLogs.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 italic">Awaiting device proofs-of-presence network packets...</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
