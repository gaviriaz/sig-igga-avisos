import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Activity, Shield, Terminal as TerminalIcon, ArrowLeft,
    Cpu, Globe, Zap, BarChart3, Lock, Server,
    AlertTriangle, CheckCircle2, Cloud, Database,
    FileText, HelpCircle, HardDrive, Network
} from 'lucide-react';

const NOCCommand: React.FC = () => {
    const navigate = useNavigate();
    const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
    const [uptime, setUptime] = useState('99.982%');
    const [latency, setLatency] = useState('14ms');
    const [scannedFiles, setScannedFiles] = useState(12405);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString()), 1000);
        const dataEffect = setInterval(() => {
            setScannedFiles(prev => prev + Math.floor(Math.random() * 5));
        }, 3000);
        return () => {
            clearInterval(timer);
            clearInterval(dataEffect);
        };
    }, []);

    const slaMetrics = [
        { label: 'Cloud Gateway', status: 'Optimal', value: 99.99, color: 'text-emerald-500' },
        { label: 'GIS Render Engine', status: 'Nominal', value: 99.95, color: 'text-indigo-400' },
        { label: 'Auth Multi-Tenant', status: 'Stable', value: 100, color: 'text-primary' },
        { label: 'Database Sync', status: 'Active', value: 99.98, color: 'text-amber-500' }
    ];

    return (
        <div className="min-h-screen bg-[#020617] text-white selection:bg-primary/30 overflow-x-hidden font-sans noise-overlay">
            {/* HUD Scanlines & Grid */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 grid-pattern opacity-10" />
                <div className="absolute inset-0 scanline opacity-5" />
            </div>

            {/* Navbar HUD */}
            <nav className="fixed top-0 left-0 right-0 z-50 h-20 glass border-b border-white/5 px-8">
                <div className="max-w-[1800px] mx-auto h-full flex items-center justify-between">
                    <div className="flex items-center gap-6 cursor-pointer group" onClick={() => navigate('/')}>
                        <div className="p-2 bg-white/5 rounded-lg border border-white/10 group-hover:border-primary/50 transition-all">
                            <ArrowLeft size={18} className="text-primary" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-black tracking-[0.2em] text-white uppercase italic">NOC Command Hub <span className="text-primary">v7.8.2</span></span>
                            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Unified Monitoring Center
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-12">
                        <div className="hidden lg:flex items-center gap-4 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                            <Cloud className="text-indigo-400 animate-pulse" size={16} />
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-white uppercase leading-none">Cloudflare Tunnel</span>
                                <span className="text-[8px] font-mono text-emerald-500 uppercase font-black">Secure Link: Active</span>
                            </div>
                        </div>
                        <div className="hidden lg:flex flex-col items-end border-l border-white/5 pl-6">
                            <span className="text-[9px] font-mono text-slate-500 uppercase">System Uptime</span>
                            <span className="text-xs font-mono font-black text-emerald-500">{uptime}</span>
                        </div>
                        <div className="hidden lg:flex flex-col items-end">
                            <span className="text-[9px] font-mono text-slate-500 uppercase">Edge Latency</span>
                            <span className="text-xs font-mono font-black text-indigo-400">{latency}</span>
                        </div>
                        <div className="h-8 w-px bg-white/5" />
                        <div className="text-right">
                            <span className="text-xs font-mono font-black text-white uppercase tracking-tighter">{currentTime}</span>
                            <p className="text-[8px] font-black text-primary uppercase text-end">Local Node: COL-01</p>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="relative z-10 pt-32 pb-20 px-8">
                <div className="max-w-[1800px] mx-auto space-y-8">

                    {/* Top Stats Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { label: 'Security Protocols', value: 'ISO 27001 / SOC2', icon: Shield, color: 'text-primary', sub: 'Compliance Verified' },
                            { label: 'Cloud Sync Engine', value: 'Active Gateway', icon: Cloud, color: 'text-indigo-400', sub: 'L1-L3 Support Ready' },
                            { label: 'Data Encryption', value: 'RSA 4096 / AES', icon: Lock, color: 'text-rose-500', sub: 'Multi-Tenant Isolation' },
                            { label: 'Cloud Gateway', value: 'strategy-acute-advertiser-rated', icon: Globe, color: 'text-primary', sub: 'trycloudflare.com' }
                        ].map((stat, i) => (
                            <div key={i} className="glass p-6 rounded-[2rem] border-white/5 hover:border-white/10 transition-all group overflow-hidden relative">
                                <div className="absolute -right-4 -top-4 opacity-5 group-hover:rotate-12 transition-transform">
                                    <stat.icon size={100} />
                                </div>
                                <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center ${stat.color} mb-4`}>
                                    <stat.icon size={20} />
                                </div>
                                <p className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">{stat.label}</p>
                                <h3 className="text-lg font-black italic uppercase text-white mb-1">{stat.value}</h3>
                                <p className="text-[9px] font-bold text-slate-600 uppercase italic leading-none">{stat.sub}</p>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* SLA & Performance (Expert View) */}
                        <div className="lg:col-span-8 space-y-8">
                            <div className="glass rounded-[3rem] p-10 border-white/5 relative overflow-hidden">
                                <div className="flex items-center justify-between mb-10">
                                    <div className="flex items-center gap-4">
                                        <Activity className="text-primary" size={24} />
                                        <h2 className="text-xl font-black italic uppercase italic tracking-tighter">SLA Analytics & Performance</h2>
                                    </div>
                                    <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[9px] font-black uppercase rounded-lg">Real-time Stream</span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    {slaMetrics.map((m, i) => (
                                        <div key={i} className="space-y-3">
                                            <div className="flex justify-between items-end">
                                                <span className="text-[11px] font-mono font-bold text-slate-400 uppercase">{m.label}</span>
                                                <span className={`text-xs font-mono font-black ${m.color}`}>{m.value}%</span>
                                            </div>
                                            <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full bg-current ${m.color} transition-all duration-1000`}
                                                    style={{ width: `${m.value}%` }}
                                                />
                                            </div>
                                            <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2">
                                                <span className="w-1 h-1 bg-current rounded-full" /> {m.status}
                                            </p>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-12 p-6 bg-white/5 rounded-2xl border border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
                                    <div className="flex items-center gap-6">
                                        <Cpu className="text-slate-500" size={32} />
                                        <div>
                                            <p className="text-[10px] font-mono font-black text-slate-500 uppercase">Server Load</p>
                                            <p className="text-sm font-black text-white italic">QUAD-CORE HYPER_THREADING (7.2% UTILIZATION)</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                            <div key={i} className={`w-1.5 h-6 rounded-sm ${i > 3 ? 'bg-primary' : 'bg-slate-800'}`} />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Ticket System / Support Log */}
                            <div className="glass rounded-[3rem] border-white/5 flex flex-col h-[400px]">
                                <div className="p-8 border-b border-white/5 flex items-center justify-between bg-slate-900/40">
                                    <div className="flex items-center gap-4">
                                        <Network className="text-indigo-400" size={20} />
                                        <h3 className="text-sm font-black uppercase tracking-widest">Support Node Log (L1-L3)</h3>
                                    </div>
                                    <div className="flex gap-4">
                                        <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">Active Tickets: 0</span>
                                        <span className="text-[10px] font-mono font-bold text-emerald-500 uppercase tracking-widest italic">All Resolved</span>
                                    </div>
                                </div>
                                <div className="flex-1 p-8 overflow-y-auto font-mono text-[11px] space-y-4">
                                    {[
                                        { time: '20:12:05', cat: 'L1', msg: 'User SIG-721 recovery password initiated.' },
                                        { time: '19:44:12', cat: 'L3', msg: 'Database Sync Gateway: Batch 882 indexed successfully.' },
                                        { time: '18:30:00', cat: 'SYS', msg: 'Cloudflare Tunnel: Health Check PASSED.' },
                                        { time: '17:15:32', cat: 'SOC', msg: 'Scheduled security audit ISO 27001 completed 100%.' },
                                        { time: '16:00:21', cat: 'L2', msg: 'GIS Render Engine optimization applied from build v7.5.' }
                                    ].map((log, i) => (
                                        <div key={i} className="flex gap-6 text-slate-500 border-l border-white/10 pl-6 relative">
                                            <div className="absolute left-[-4.5px] top-1.5 w-2 h-2 rounded-full bg-slate-800" />
                                            <span className="text-primary font-black shrink-0">[{log.time}]</span>
                                            <span className="px-1.5 py-0.5 bg-white/5 rounded text-[9px] font-black italic inline-block w-10 text-center uppercase tracking-tighter">{log.cat}</span>
                                            <span className="text-slate-300 font-medium">{log.msg}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Right Sidebar: Knowledge Base & Specs */}
                        <div className="lg:col-span-4 space-y-8">
                            <div className="glass rounded-[3rem] p-10 border-white/5 space-y-8">
                                <div className="flex items-center gap-4">
                                    <HelpCircle className="text-amber-500" size={24} />
                                    <h2 className="text-xl font-black italic uppercase italic tracking-tighter">Knowledge Base</h2>
                                </div>
                                <div className="space-y-4">
                                    {[
                                        { name: 'Architecture Overview', size: '12.4 MB', type: 'PDF' },
                                        { name: 'SOC2 Compliance Pack', size: '42.1 MB', type: 'ZIP' },
                                        { name: 'Gateway Sync Protocol', size: '2.8 MB', type: 'TSX' },
                                        { name: 'Cloudflare Tunnel Docs', size: '1.2 MB', type: 'DOC' }
                                    ].map((doc, i) => (
                                        <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors cursor-pointer border border-transparent hover:border-white/10">
                                            <div className="flex items-center gap-4">
                                                <FileText className="text-slate-500" size={18} />
                                                <div>
                                                    <p className="text-xs font-black text-white italic">{doc.name}</p>
                                                    <p className="text-[9px] font-mono text-slate-500 font-bold uppercase">{doc.size}</p>
                                                </div>
                                            </div>
                                            <span className="text-[9px] font-black text-primary border border-primary/30 px-2 py-0.5 rounded uppercase">{doc.type}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="glass rounded-[3rem] p-10 border-white/5 relative overflow-hidden group">
                                <div className="absolute right-0 bottom-0 opacity-10 group-hover:scale-125 transition-transform duration-1000">
                                    <HardDrive size={120} />
                                </div>
                                <h2 className="text-xl font-black italic uppercase italic tracking-tighter mb-8 tracking-tight">System Specs</h2>
                                <div className="space-y-6">
                                    {[
                                        { label: 'Cloud Provider', val: 'HYBRID NODE / $0 COST' },
                                        { label: 'OS Build', val: 'LINUX IGGA-DEB 12.0' },
                                        { label: 'Public Gateway', val: 'https://strategy-acute-advertiser-rated.trycloudflare.com' },
                                        { label: 'Auth Store', val: 'SUPABASE POSTGRES' }
                                    ].map(spec => (
                                        <div key={spec.label}>
                                            <p className="text-[9px] font-mono font-black text-slate-600 uppercase tracking-widest">{spec.label}</p>
                                            <p className="text-sm font-black text-white italic">{spec.val}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button
                                className="w-full h-24 glass border-dashed border-primary/30 rounded-[2.5rem] flex items-center justify-center gap-4 group hover:border-primary transition-all"
                            >
                                <Shield size={24} className="text-primary group-hover:scale-110 transition-transform" />
                                <div className="text-left">
                                    <p className="text-xs font-black text-white italic uppercase leading-none mb-1">Audit System Log</p>
                                    <p className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest">Verify Inmutable Chain</p>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            {/* Global HUD Data Footer */}
            <footer className="fixed bottom-0 left-0 right-0 h-10 px-8 glass border-t border-white/5 z-50 flex items-center justify-between pointer-events-none">
                <div className="flex gap-8">
                    <span className="text-[9px] font-mono font-black text-slate-500">PACKET_FLOW: 128kb/s</span>
                    <span className="text-[9px] font-mono font-black text-emerald-500 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" /> SCAN: {scannedFiles} NODES
                    </span>
                </div>
                <span className="text-[9px] font-mono font-black text-primary italic uppercase tracking-[0.4em]">Integrated Management Environment v7.5</span>
            </footer>
        </div>
    );
};

export default NOCCommand;
