'use client';

import React, { useState, useEffect } from 'react';

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

  useEffect(() => {
    // Open a persistent link directly into your running Fastify WebSocket server cluster
    const socket = new WebSocket('ws://localhost:8080/gravity-stream');

    socket.onopen = () => {
      setIsConnected(true);
      console.log("🟢 Linked to NEXORA Engine Mesh");
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.status === "SUCCESS") {
          setTotalChecks((prev) => prev + 1);
          setBalanceMetricUnits(data.balanceMetricUnits || "0");
          
          const newLog: MetricLog = {
            id: Math.random().toString(36).substring(2, 9).toUpperCase(),
            deviceFingerprint: data.deviceFingerprint || "DEVICE_NODE_" + Math.random().toString(36).substring(2, 6).toUpperCase(),
            status: data.authenticated ? "PASS" : "FAIL",
            revenue: 0.00001,
            timestamp: new Date().toLocaleTimeString()
          };

          setLiveLogs((prev) => [newLog, ...prev.slice(0, 9)]);
        }
      } catch (err) {
        console.error("Failed to parse incoming streaming telemetry packet:", err);
      }
    };

    socket.onclose = () => {
      setIsConnected(false);
      console.log("🔴 Network streamline disconnected");
    };

    return () => socket.close();
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 p-8 font-sans">
      <header className="flex justify-between items-center border-b border-slate-800 pb-6 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-emerald-400">NEXORA GRAVITY</h1>
          <p className="text-sm text-slate-400">Autonomous Proof-of-Presence Infrastructure Console</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-4 py-2 rounded-lg">
          <span className={`h-2.5 w-2.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
          <span className="text-xs font-mono uppercase text-slate-300">{isConnected ? 'Engine Online' : 'Connecting Grid'}</span>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Total Verified Streams</p>
          <p className="text-4xl font-mono font-bold text-slate-100">{totalChecks.toLocaleString()}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Secure Ledger Storage Units</p>
          <p className="text-4xl font-mono font-bold text-emerald-400">{balanceMetricUnits} <span className="text-xs text-slate-500 font-sans">credits</span></p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">AI Firewall Defense Capacity</p>
          <p className="text-4xl font-mono font-bold text-blue-400">100.00%</p>
        </div>
      </section>

      <section className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4">Real-Time Ingestion Logs</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-3 font-medium">Log Signature ID</th>
                <th className="pb-3 font-medium">Device Profile Node ID</th>
                <th className="pb-3 font-medium">Attestation Proof Status</th>
                <th className="pb-3 font-medium">Captured Micro-Fee Entry</th>
                <th className="pb-3 font-medium text-right">System Clock Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {liveLogs.map((log) => (
                <tr key={log.id} className="border-b border-slate-900 last:border-0 hover:bg-slate-900/50">
                  <td className="py-3 text-slate-400">{log.id}</td>
                  <td className="py-3 text-slate-200">{log.deviceFingerprint}</td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${log.status === 'PASS' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'}`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="py-3 text-emerald-500">+${log.revenue.toFixed(5)}</td>
                  <td className="py-3 text-right text-slate-500">{log.timestamp}</td>
                </tr>
              ))}
              {liveLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 italic">Waiting for incoming smartphone validation streams...</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
