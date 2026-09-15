'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Mic, Radio, Cpu, CheckCircle2 } from 'lucide-react';

interface JarvisResponse {
  status: string;
  text: string;
  action: string;
}

export default function JarvisConsole() {
  const [isListening, setIsListening] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [jarvisThought, setJarvisOpeningText] = useState("Initializing neural interface links...");
  const [isConnected, setIsConnected] = useState(false);
  const [systemAction, setSystemAction] = useState("STANDBY");
  
  const socketRef = useRef<WebSocket | null>(null);
  const recognitionRef = useRef<any>(null);

  // UTILITY FUNCTION: Converts text responses into active spoken audio output streams
  const vocalizeJarvisSpeech = (phraseText: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Clear trailing audio buffers immediately
      const vocalToken = new SpeechSynthesisUtterance(phraseText);
      
      const availableVoices = window.speechSynthesis.getVoices();
      const premiumVoice = availableVoices.find(v => v.name.includes("Google US English") || v.name.includes("Microsoft David"));
      if (premiumVoice) vocalToken.voice = premiumVoice;
      
      vocalToken.rate = 1.05; // Rhythmic pacing adjustment
      vocalToken.pitch = 0.90; // Deep mechanical tone config
      window.speechSynthesis.speak(vocalToken);
    }
  };

  // INITIALIZE WEBSOCKET DATA STREAM LINK
  useEffect(() => {
    const socket = new WebSocket('ws://localhost:8080/jarvis-core');
    socketRef.current = socket;

    socket.onopen = () => {
      setIsConnected(true);
      setTerminalLogs(prev => ["🟢 Neural Network Pipeline Connected successfully.", ...prev]);
    };

    socket.onmessage = (event) => {
      const data: JarvisResponse = JSON.parse(event.data);
      setJarvisOpeningText(data.text);
      vocalizeJarvisSpeech(data.text);
      
      if (data.action) setSystemAction(data.action);
      setTerminalLogs(prev => [`🤖 [JARVIS]: ${data.text}`, ...prev]);
    };

    socket.onclose = () => {
      setIsConnected(false);
      setTerminalLogs(prev => ["🔴 Pipeline connection split from machine interface.", ...prev]);
    };

    // CHROMIUM SPEECH-TO-TEXT COGNITIVE INTERCEPTORS REGISTRY
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechConfig = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognizer = new SpeechConfig();
      recognizer.continuous = false;
      recognizer.interimResults = false;
      recognizer.lang = 'en-US';

      recognizer.onstart = () => {
        setIsListening(true);
        setSystemAction("LISTENING");
      };

      recognizer.onresult = (event: any) => {
        const capturedTextOutput = event.results[0][0].transcript;
        setTerminalLogs(prev => [`🎙️ [COMMAND]: "${capturedTextOutput}"`, ...prev]);
        
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
          socketRef.current.send(JSON.stringify({ command: capturedTextOutput }));
        }
      };

      recognizer.onerror = () => {
        setTerminalLogs(prev => ["⚠️ Cognitive error processing speech frequency modules.", ...prev]);
      };

      recognizer.onend = () => {
        setIsListening(false);
        setSystemAction("STANDBY");
      };

      recognitionRef.current = recognizer;
    }

    return () => {
      socket.close();
    };
  }, []);

  const triggerVoiceCaptureSession = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition metrics not supported on this browser engine layer. Please utilize Google Chrome.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-8 font-mono flex flex-col justify-between selection:bg-cyan-500/30">
      {/* HUD HEADER PANEL SECTION */}
      <header className="flex justify-between items-center border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <Cpu className={`h-6 w-6 ${isConnected ? 'text-cyan-400 animate-spin [animation-duration:10s]' : 'text-slate-600'}`} />
          <div>
            <h1 className="text-sm font-bold tracking-widest text-cyan-400">NEXORA :: JARVIS v2.0</h1>
            <p className="text-[10px] text-slate-500 uppercase mt-0.5">Tactical Command Platform Node // Commander Lee</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded text-xs">
          <Radio className={`h-3 w-3 ${isConnected ? 'text-cyan-400 animate-pulse' : 'text-rose-500'}`} />
          <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">{isConnected ? 'Neural Sync Active' : 'Offline State'}</span>
        </div>
      </header>

      {/* CENTER COGNITIVE RING INTERFACE COMPONENT */}
      <section className="flex flex-col items-center justify-center my-12 flex-1 gap-8">
        <div className="relative flex items-center justify-center">
          
          {/* Outer Visual Homing Holographic Ring Elements */}
          <div className="absolute rounded-full border border-dashed border-cyan-500/20 h-72 w-72 animate-spin [animation-duration:40s]"></div>
          <div className="absolute rounded-full border border-double border-cyan-400/10 h-64 w-64 animate-spin [animation-duration:15s] [animation-direction:reverse]"></div>

          {/* Core Pulsing Geometric Command Ring */}
          <button 
            type="button"
            onClick={triggerVoiceCaptureSession}
            className={`relative rounded-full h-48 w-48 bg-slate-900 border border-slate-800 flex flex-col items-center justify-center shadow-2xl transition-all duration-500 cursor-pointer group focus:outline-none ${
              systemAction === "LISTENING" ? 'border-cyan-400 shadow-[0_0_40px_rgba(34,211,238,0.25)] scale-105' :
              systemAction.startsWith("LAUNCH") ? 'border-emerald-400 shadow-[0_0_40px_rgba(52,211,153,0.25)]' :
              'hover:border-cyan-500/50 shadow-[0_0_20px_rgba(0,0,0,0.5)]'
            }`}
          >
            {systemAction === "LISTENING" ? (
              <Mic className="h-12 w-12 text-cyan-400 animate-pulse" />
            ) : (
              <Mic className="h-12 w-12 text-slate-400 group-hover:text-cyan-400 transition-colors" />
            )}
            <span className="text-[9px] uppercase tracking-widest text-slate-500 font-bold mt-2 group-hover:text-cyan-400/70 transition-colors">
              {isListening ? 'Intercepting' : 'Initialize'}
            </span>
          </button>
        </div>

        {/* Dynamic Thought Ticker Text Card */}
        <div className="w-full max-w-xl text-center bg-slate-900/40 border border-slate-900 p-4 rounded-xl min-h-16 flex items-center justify-center">
          <p className={`text-xs tracking-wide leading-relaxed font-sans ${systemAction === "LISTENING" ? 'text-cyan-300 italic' : 'text-slate-300'}`}>
            "{jarvisThought}"
          </p>
        </div>
      </section>

      {/* MATRIX TERMINAL ACTIVITY FEED CONTAINER */}
      <section className="bg-slate-900 border border-slate-800 p-4 rounded-xl max-h-48 overflow-y-auto flex flex-col gap-1.5 scrollbar-thin">
        <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2 mb-1 text-[11px] text-slate-500 font-bold uppercase tracking-wider">
          <Terminal className="h-3.5 w-3.5 text-cyan-500" /> Command Line Log Stream
        </div>
        {terminalLogs.map((log, index) => (
          <div key={index} className="text-[11px] text-slate-400 font-mono tracking-wide leading-none truncate select-all hover:bg-slate-900/50 py-0.5 rounded px-1">
            {log}
          </div>
        ))}
      </section>
    </main>
  );
}
