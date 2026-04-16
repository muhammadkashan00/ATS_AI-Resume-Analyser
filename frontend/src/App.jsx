import React, { useState, useEffect } from 'react';
import { 
  Upload, 
  Search, 
  MessageSquare, 
  BarChart3, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  BrainCircuit,
  LayoutDashboard,
  Send
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie 
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const API_BASE = "http://localhost:8000";

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [files, setFiles] = useState([]);
  const [jobDescription, setJobDescription] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);

  const handleFileUpload = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const runAnalysis = async () => {
    if (!files.length || !jobDescription) return;
    setLoading(true);
    
    const formData = new FormData();
    files.forEach(file => formData.append("files", file));
    
    try {
      // 1. Upload
      await axios.post(`${API_BASE}/upload`, formData);
      
      // 2. Analyze
      const analyzeFormData = new FormData();
      analyzeFormData.append("job_description", jobDescription);
      const res = await axios.post(`${API_BASE}/analyze`, analyzeFormData);
      
      setResults(res.data);
      setActiveTab('results');
    } catch (err) {
      console.error(err);
      alert("Analysis failed. Ensure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleChat = async () => {
    if (!chatMessage) return;
    const userMsg = chatMessage;
    setChatMessage('');
    setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);
    
    try {
      const res = await axios.post(`${API_BASE}/chat`, { message: userMsg });
      setChatHistory(prev => [...prev, { role: 'ai', content: res.data.answer }]);
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'ai', content: "Error communicating with AI. Make sure resumes are analyzed first." }]);
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <nav className="sidebar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
          <div style={{ background: 'var(--accent-primary)', padding: '8px', borderRadius: '10px' }}>
            <BrainCircuit size={24} color="white" />
          </div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: '800', letterSpacing: '-0.5px' }}>RE-LYSER AI</h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <SidebarItem 
            active={activeTab === 'dashboard'} 
            Icon={LayoutDashboard} 
            label="Dashboard" 
            onClick={() => setActiveTab('dashboard')} 
          />
          <SidebarItem 
            active={activeTab === 'upload'} 
            Icon={Upload} 
            label="Upload Resumes" 
            onClick={() => setActiveTab('upload')} 
          />
          <SidebarItem 
            active={activeTab === 'results'} 
            Icon={CheckCircle2} 
            label="Analysis Results" 
            onClick={() => setActiveTab('results')} 
          />
          <SidebarItem 
            active={activeTab === 'chat'} 
            Icon={MessageSquare} 
            label="AI Chat" 
            onClick={() => setActiveTab('chat')} 
          />
        </div>

        <div style={{ marginTop: 'auto' }}>
          <div className="card glass" style={{ padding: '16px' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Advanced RAG Pipeline Ready</p>
            <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
              <div style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%' }}></div>
              <p style={{ fontSize: '0.7rem' }}>System Online</p>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="main-content">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="animate-fade"
            >
              <header style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: '800' }}>Recruitment Dashboard</h1>
                <p style={{ color: 'var(--text-dim)' }}>Overview of applicant pool and match analytics</p>
              </header>

              <div className="stats-grid">
                <StatCard title="Total Resumes" value={files.length} icon={FileText} color="#6366f1" />
                <StatCard title="Average Match" value={results.length > 0 ? (results.reduce((a,b) => a + b.score, 0) / results.length).toFixed(1) + "%" : "N/A"} icon={BarChart3} color="#a855f7" />
                <StatCard title="Top Matches (>80%)" value={results.filter(r => r.score > 80).length} icon={CheckCircle2} color="#10b981" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginTop: '32px' }}>
                <div className="card">
                  <h3 style={{ marginBottom: '20px' }}>Match Score Distribution</h3>
                  <div className="chart-container">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={results}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2e" />
                        <XAxis dataKey="filename" stroke="#94a3b8" fontSize={10} tick={false} />
                        <YAxis stroke="#94a3b8" />
                        <Tooltip 
                          contentStyle={{ background: '#141417', borderColor: '#2a2a2e', borderRadius: '8px' }}
                          labelStyle={{ color: '#e2e8f0' }}
                        />
                        <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                          {results.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.score > 70 ? '#10b981' : entry.score > 40 ? '#f59e0b' : '#ef4444'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="card">
                  <h3>Candidate Ranking</h3>
                  <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {results.slice(0, 5).map((res, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{res.filename}</span>
                        <span style={{ fontWeight: '700', color: 'var(--accent-primary)' }}>{res.score}%</span>
                      </div>
                    ))}
                    {results.length === 0 && <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>No data available. Please upload resumes.</p>}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'upload' && (
            <motion.div 
              key="upload"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card"
              style={{ padding: '60px', textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}
            >
              <div style={{ marginBottom: '32px' }}>
                <div style={{ display: 'inline-block', padding: '24px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.1)', marginBottom: '16px' }}>
                  <Upload size={48} color="var(--accent-primary)" />
                </div>
                <h2>Upload Applicant Data</h2>
                <p style={{ color: 'var(--text-dim)' }}>Select PDF resumes and provide a job description for context.</p>
              </div>

              <div style={{ textAlign: 'left', marginBottom: '24px' }}>
                <label style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>Job Description / Requirements</label>
                <textarea 
                  className="input-field" 
                  rows="6" 
                  placeholder="Paste the job role details here..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                ></textarea>
              </div>

              <div 
                style={{ border: '2px dashed var(--glass-border)', padding: '40px', borderRadius: '16px', marginBottom: '24px', cursor: 'pointer' }}
                onClick={() => document.getElementById('file-input').click()}
              >
                <input type="file" id="file-input" multiple hidden onChange={handleFileUpload} accept=".pdf" />
                <p style={{ color: 'var(--text-dim)' }}>
                  {files.length > 0 ? `${files.length} files selected` : "Click to select or drag and drop PDFs"}
                </p>
              </div>

              <button className="btn-primary" style={{ width: '100%' }} onClick={runAnalysis} disabled={loading}>
                {loading ? "Processing AI Pipeline..." : "Initialize Analysis"}
              </button>
            </motion.div>
          )}

          {activeTab === 'results' && (
            <motion.div key="results" className="animate-fade">
              <h2>Analysis Results</h2>
              <div style={{ display: 'grid', gap: '16px', marginTop: '24px' }}>
                {results.map((res, i) => (
                  <ResultItem key={i} data={res} />
                ))}
                {results.length === 0 && <p>No results yet. Upload resumes first.</p>}
              </div>
            </motion.div>
          )}

          {activeTab === 'chat' && (
             <motion.div key="chat" className="card" style={{ height: '70vh', display: 'flex', flexDirection: 'column' }}>
                <header style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '16px', marginBottom: '16px' }}>
                  <h3>Agent Intelligence Chat</h3>
                  <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>Ask follow-up questions about candidates or specific skill comparisons.</p>
                </header>
                
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', padding: '8px' }}>
                  {chatHistory.map((msg, i) => (
                    <div key={i} style={{ 
                      alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                      background: msg.role === 'user' ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      maxWidth: '80%'
                    }}>
                      {msg.content}
                    </div>
                  ))}
                  {chatHistory.length === 0 && (
                    <div style={{ textAlign: 'center', marginTop: '100px', color: 'var(--text-dim)' }}>
                      <BrainCircuit size={48} style={{ opacity: 0.2 }} />
                      <p>Start a conversation about the applicants</p>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                  <input 
                    className="input-field" 
                    placeholder="e.g., 'Compare the top 2 candidates' or 'What skills is John missing?'"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleChat()}
                  />
                  <button className="btn-primary" onClick={handleChat}><Send size={20} /></button>
                </div>
             </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function SidebarItem({ active, Icon, label, onClick }) {
  return (
    <div 
      onClick={onClick}
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '12px', 
        padding: '12px', 
        borderRadius: '12px', 
        cursor: 'pointer',
        background: active ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
        color: active ? 'var(--accent-primary)' : 'var(--text-dim)',
        transition: 'all 0.2s'
      }}
    >
      <Icon size={20} />
      <span style={{ fontWeight: active ? '600' : '400' }}>{label}</span>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }) {
  return (
    <div className="card glass">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem', marginBottom: '8px' }}>{title}</p>
          <p style={{ fontSize: '1.8rem', fontWeight: '800' }}>{value}</p>
        </div>
        <div style={{ background: `${color}20`, padding: '8px', borderRadius: '8px' }}>
          <Icon size={20} color={color} />
        </div>
      </div>
    </div>
  );
}

function ResultItem({ data }) {
  return (
    <div className="card glass" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
            <FileText size={24} />
          </div>
          <h4 style={{ fontWeight: '700' }}>{data.filename}</h4>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>MATCH SCORE</p>
          <p style={{ fontSize: '1.2rem', fontWeight: '800', color: data.score > 70 ? '#10b981' : '#f59e0b' }}>{data.score}%</p>
        </div>
      </div>
      <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '8px', fontSize: '0.9rem', lineHeight: '1.6', color: '#cbd5e1', whiteSpace: 'pre-wrap' }}>
        <p style={{ fontWeight: '600', marginBottom: '8px' }}>AI Insights:</p>
        {data.analysis}
      </div>
    </div>
  );
}

export default App;
