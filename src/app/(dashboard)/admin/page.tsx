'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Users, 
  Settings, 
  Database, 
  Coins, 
  ToggleLeft, 
  ToggleRight,
  CheckCircle,
  Loader2,
  Lock,
  Globe
} from 'lucide-react';
import { User, ProviderConfig, Generation, CreditLedger } from '@/types';

export default function AdminSettings() {
  const [users, setUsers] = useState<User[]>([]);
  const [providerConfigs, setProviderConfigs] = useState<ProviderConfig[]>([]);
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [ledgers, setLedgers] = useState<CreditLedger[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states for credit adjustments
  const [selectedUserId, setSelectedUserId] = useState('');
  const [adjustAmount, setAdjustAmount] = useState(100);
  const [adjustDesc, setAdjustDesc] = useState('Admin adjustment grant');

  // Active configurations update states
  const [savingConfigId, setSavingConfigId] = useState<string | null>(null);
  const [apiKeyOpenAI, setApiKeyOpenAI] = useState('');
  const [apiKeyVeo, setApiKeyVeo] = useState('');
  const [gcpProjectVeo, setGcpProjectVeo] = useState('');
  const [gcpLocationVeo, setGcpLocationVeo] = useState('');

  const [msg, setMsg] = useState('');

  const fetchAdminData = async () => {
    try {
      const res = await fetch('/api/admin');
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users || []);
        setProviderConfigs(data.providerConfigs || []);
        setGenerations(data.generations || []);
        setLedgers(data.ledgers || []);

        // Prepopulate key inputs
        const openAI = data.providerConfigs.find((c: any) => c.providerName === 'OpenAI');
        const veo = data.providerConfigs.find((c: any) => c.providerName === 'Google Veo');
        if (openAI) setApiKeyOpenAI(openAI.configJson.apiKey || '');
        if (veo) {
          setApiKeyVeo(veo.configJson.apiKey || '');
          setGcpProjectVeo(veo.configJson.project || '');
          setGcpLocationVeo(veo.configJson.location || '');
        }

        // Set default select user
        if (data.users.length > 0 && !selectedUserId) {
          setSelectedUserId(data.users[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load admin logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  // Update credit balances
  const handleAdjustCreditsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;

    setLoading(true);
    setMsg('');

    try {
      const res = await fetch('/api/admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'adjustCredits',
          targetUserId: selectedUserId,
          amount: adjustAmount,
          description: adjustDesc
        })
      });

      const data = await res.json();
      if (res.ok) {
        setMsg(`Adjusted balance by ${adjustAmount} credits successfully!`);
        fetchAdminData();
        // Sync badge
        window.dispatchEvent(new Event('sync-credits'));
      } else {
        alert(data.error || 'Failed to adjust credits');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Toggle provider config
  const handleToggleProvider = async (config: ProviderConfig) => {
    setSavingConfigId(config.id);
    setMsg('');

    let activeKeys = {};
    if (config.providerName === 'OpenAI') {
      activeKeys = { apiKey: apiKeyOpenAI };
    } else if (config.providerName === 'Google Veo') {
      activeKeys = { 
        apiKey: apiKeyVeo,
        project: gcpProjectVeo,
        location: gcpLocationVeo
      };
    }

    try {
      const res = await fetch('/api/admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateProviderConfig',
          id: config.id,
          isActive: !config.isActive,
          configJson: activeKeys
        })
      });

      if (res.ok) {
        setMsg(`Provider "${config.providerName}" status toggled successfully!`);
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingConfigId(null);
    }
  };

  const handleSaveAPIKeys = async (providerName: string, id: string) => {
    setSavingConfigId(id);
    setMsg('');

    let configJson = {};
    if (providerName === 'OpenAI') {
      configJson = { apiKey: apiKeyOpenAI };
    } else if (providerName === 'Google Veo') {
      configJson = { 
        apiKey: apiKeyVeo,
        project: gcpProjectVeo,
        location: gcpLocationVeo
      };
    }

    try {
      const res = await fetch('/api/admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateProviderConfig',
          id,
          isActive: providerConfigs.find(c => c.id === id)?.isActive || false,
          configJson
        })
      });

      if (res.ok) {
        setMsg(`Credentials updated for "${providerName}"!`);
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingConfigId(null);
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent border-violet-500 animate-spin"></div>
        <p className="text-sm text-gray-500 animate-pulse font-medium">Syncing admin configurations...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      
      {/* HEADER */}
      <div className="border-b border-white/5 pb-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-red-500" /> Admin Settings Dashboard
        </h2>
        <p className="text-xs text-gray-500 mt-1">Configure global API adapters, audit system database rows, and adjust user credits.</p>
      </div>

      {/* FEEDBACK STATUS BAR */}
      {msg && (
        <div className="p-4 rounded-xl bg-violet-600/10 border border-violet-500/20 text-violet-300 text-xs font-semibold flex items-center gap-2 animate-slide-up">
          <CheckCircle className="w-4 h-4" /> {msg}
        </div>
      )}

      {/* PANEL 1: GLOBAL CONFIGURATIONS */}
      <section className="grid lg:grid-cols-2 gap-8">
        
        {/* API PROVIDER ADAPTERS */}
        <div className="glass-panel p-6 border-white/5 flex flex-col gap-5">
          <h3 className="text-sm font-bold text-white flex items-center gap-1.5"><Settings className="w-4 h-4 text-violet-400" /> Model Provider Configurations</h3>
          
          <div className="flex flex-col gap-5 divide-y divide-white/5">
            {providerConfigs.map((config) => {
              const isMock = config.providerName.includes('Mock');
              return (
                <div key={config.id} className="flex flex-col gap-3 pt-4 first:pt-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-extrabold text-white text-xs">{config.providerName}</span>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">{config.type} generator ({config.modelName})</p>
                    </div>
                    
                    {savingConfigId === config.id ? (
                      <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
                    ) : (
                      <button 
                        onClick={() => handleToggleProvider(config)}
                        className="text-gray-400 hover:text-white"
                        title={config.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {config.isActive ? (
                          <ToggleRight className="w-7 h-7 text-violet-500" />
                        ) : (
                          <ToggleLeft className="w-7 h-7 text-gray-600" />
                        )}
                      </button>
                    )}
                  </div>

                  {/* Keys settings forms for real integrations */}
                  {!isMock && config.providerName === 'OpenAI' && (
                    <div className="flex flex-col gap-3 bg-black/20 p-4 rounded-lg border border-white/5">
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-bold text-gray-500 uppercase flex items-center gap-1"><Lock className="w-3 h-3" /> OpenAI API Key</label>
                        <input 
                          type="password" 
                          placeholder="sk-..." 
                          value={apiKeyOpenAI}
                          onChange={(e) => setApiKeyOpenAI(e.target.value)}
                          className="glass-input text-[11px] font-mono py-1.5"
                        />
                      </div>
                      <button 
                        onClick={() => handleSaveAPIKeys('OpenAI', config.id)}
                        className="self-end px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white font-bold text-[9px] uppercase rounded transition-colors"
                      >
                        Save Key
                      </button>
                    </div>
                  )}

                  {!isMock && config.providerName === 'Google Veo' && (
                    <div className="flex flex-col gap-3 bg-black/20 p-4 rounded-lg border border-white/5">
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-bold text-gray-500 uppercase flex items-center gap-1"><Lock className="w-3 h-3" /> Google API Key</label>
                        <input 
                          type="password" 
                          placeholder="AIzaSy..." 
                          value={apiKeyVeo}
                          onChange={(e) => setApiKeyVeo(e.target.value)}
                          className="glass-input text-[11px] font-mono py-1.5"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] font-bold text-gray-500 uppercase">GCP Project ID</label>
                          <input 
                            type="text" 
                            placeholder="project-id" 
                            value={gcpProjectVeo}
                            onChange={(e) => setGcpProjectVeo(e.target.value)}
                            className="glass-input text-[11px] py-1.5"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] font-bold text-gray-500 uppercase">GCP Location</label>
                          <input 
                            type="text" 
                            placeholder="us-central1" 
                            value={gcpLocationVeo}
                            onChange={(e) => setGcpLocationVeo(e.target.value)}
                            className="glass-input text-[11px] py-1.5"
                          />
                        </div>
                      </div>
                      <button 
                        onClick={() => handleSaveAPIKeys('Google Veo', config.id)}
                        className="self-end px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white font-bold text-[9px] uppercase rounded transition-colors"
                      >
                        Save Credentials
                      </button>
                    </div>
                  )}

                  {isMock && (
                    <div className="bg-white/5 px-3 py-2 rounded-lg border border-white/5 text-[10px] text-gray-500 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5" /> No configuration needed for offline local mock generators.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* CREDIT ADJUSTMENTS */}
        <div className="glass-panel p-6 border-white/5 flex flex-col gap-5 justify-between">
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5"><Coins className="w-4 h-4 text-violet-400" /> Adjust User Token Balances</h3>
            
            <form onSubmit={handleAdjustCreditsSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Select User</label>
                <select 
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="glass-input text-xs text-white"
                >
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name} - {u.email} ({u.creditBalance} cr)</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Token Amount</label>
                  <input 
                    type="number" 
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(parseInt(e.target.value))}
                    placeholder="e.g. 100 or -50"
                    className="glass-input text-xs font-semibold"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Adjustment Action</label>
                  <div className="text-xs bg-black/40 border border-white/5 rounded-lg flex items-center justify-center font-bold h-10 text-gray-300">
                    {adjustAmount >= 0 ? 'GRANT TO USER' : 'DEDUCT FROM USER'}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Audit Log Reason</label>
                <input 
                  type="text" 
                  value={adjustDesc}
                  onChange={(e) => setAdjustDesc(e.target.value)}
                  placeholder="e.g. Compensated for failed job"
                  className="glass-input text-xs"
                />
              </div>

              <button 
                type="submit"
                className="w-full mt-2 py-3 bg-red-600 hover:bg-red-500 text-white text-xs font-bold uppercase rounded-lg transition-colors flex items-center justify-center gap-1"
              >
                Apply Balance Correction
              </button>
            </form>
          </div>

          <div className="p-3 bg-white/5 border border-white/5 rounded-lg text-[10px] text-gray-500 leading-relaxed italic">
            Note: All adjustments are logged instantly in the global audit database and ledger logs shown below.
          </div>
        </div>

      </section>

      {/* PANEL 2: GLOBAL LOGS AUDIT */}
      <section className="flex flex-col gap-4">
        <h3 className="font-bold text-base text-white flex items-center gap-1.5"><Database className="w-4 h-4 text-violet-400" /> Active System Generation Logs</h3>
        
        <div className="glass-panel border-white/5 overflow-hidden">
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-black/30 text-gray-400 font-semibold border-b border-white/5 sticky top-0 z-10 backdrop-blur-md">
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">User</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Model & Provider</th>
                  <th className="p-4">Credits</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Prompt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {generations.map((g) => {
                  const userEmail = users.find(u => u.id === g.userId)?.email || g.userId;
                  return (
                    <tr key={g.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4 text-gray-400 whitespace-nowrap">{new Date(g.createdAt).toLocaleString()}</td>
                      <td className="p-4 text-gray-300 font-medium">{userEmail}</td>
                      <td className="p-4 uppercase font-bold text-[9px] text-violet-400">{g.type}</td>
                      <td className="p-4 text-gray-400">{g.provider} ({g.model})</td>
                      <td className="p-4 font-bold text-gray-300">{g.creditsUsed} cr</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded border ${
                          g.status === 'completed' 
                            ? 'bg-green-500/10 text-green-400 border-green-500/10' 
                            : g.status === 'failed' 
                              ? 'bg-red-500/10 text-red-400 border-red-500/10' 
                              : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/10'
                        }`}>
                          {g.status}
                        </span>
                      </td>
                      <td className="p-4 text-gray-500 max-w-xs truncate italic">"{g.prompt}"</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

    </div>
  );
}
