'use client';

import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Sparkles, 
  ArrowUpRight, 
  TrendingUp, 
  CheckCircle,
  Clock,
  Coins
} from 'lucide-react';
import { CreditLedger } from '@/types';

export default function Billing() {
  const [balance, setBalance] = useState(0);
  const [plan, setPlan] = useState('free');
  const [ledger, setLedger] = useState<CreditLedger[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseMsg, setPurchaseMsg] = useState('');

  const fetchCredits = async () => {
    try {
      const res = await fetch('/api/credits');
      const data = await res.json();
      if (res.ok) {
        setBalance(data.creditBalance);
        setPlan(data.plan);
        setLedger(data.ledger || []);
      }
    } catch (err) {
      console.error('Failed to load credit details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCredits();
  }, []);

  const handlePurchaseCredits = async (amount: number) => {
    setPurchasing(true);
    setPurchaseMsg('');
    
    try {
      const res = await fetch('/api/credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount })
      });
      const data = await res.json();
      if (res.ok) {
        setPurchaseMsg(`Successfully purchased ${amount} credits!`);
        fetchCredits();
        // Sync header badge
        window.dispatchEvent(new Event('sync-credits'));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPurchasing(false);
    }
  };

  const handleUpgradePlan = async (planType: string) => {
    setPurchasing(true);
    setPurchaseMsg('');

    try {
      const res = await fetch('/api/credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planType })
      });
      const data = await res.json();
      if (res.ok) {
        setPurchaseMsg(data.message);
        fetchCredits();
        window.dispatchEvent(new Event('sync-credits'));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent border-violet-500 animate-spin"></div>
        <p className="text-sm text-gray-500 animate-pulse font-medium">Syncing account ledger...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      
      {/* HEADER */}
      <div className="border-b border-white/5 pb-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-violet-500" /> Billing & Credits
        </h2>
        <p className="text-xs text-gray-500 mt-1">Manage your subscription, buy credit tokens, and review ledger audits.</p>
      </div>

      {/* SUCCESS DISPLAY */}
      {purchaseMsg && (
        <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-semibold flex items-center gap-2 animate-slide-up">
          <CheckCircle className="w-4 h-4 text-green-400" /> {purchaseMsg}
        </div>
      )}

      {/* TOP SUMMARY PANELS */}
      <div className="grid md:grid-cols-3 gap-6">
        
        {/* Credit balance card */}
        <div className="glass-panel p-6 border-white/5 bg-gradient-to-br from-violet-950/10 to-[#12121a] flex flex-col justify-between h-44">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500">Remaining Balance</span>
            <h3 className="text-4xl font-black text-white mt-2 flex items-center gap-2">
              <Coins className="w-8 h-8 text-amber-400" /> {balance}
            </h3>
          </div>
          <span className="text-[10px] text-gray-500">Includes package starter and adjustment tokens</span>
        </div>

        {/* Current plan card */}
        <div className="glass-panel p-6 border-white/5 flex flex-col justify-between h-44">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500">Subscription Tier</span>
            <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400 mt-2 uppercase">
              {plan} Account
            </h3>
          </div>
          <span className="text-[10px] text-gray-500">Renews automatically on next cycle</span>
        </div>

        {/* Cost breakdown reminder */}
        <div className="glass-panel p-6 border-white/5 flex flex-col justify-between h-44">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500">Token Costs</span>
            <div className="flex flex-col gap-1.5 mt-2.5 text-[11px] text-gray-400">
              <div className="flex justify-between"><span>Character Sheet</span><strong>10 Credits</strong></div>
              <div className="flex justify-between"><span>Scene swap image</span><strong>5 Credits</strong></div>
              <div className="flex justify-between"><span>Video animation</span><strong>50 Credits</strong></div>
            </div>
          </div>
          <span className="text-[10px] text-gray-500 italic">Failed runs are fully refunded instantly</span>
        </div>

      </div>

      {/* CREDIT TOPUP SECTION */}
      <section className="flex flex-col gap-4">
        <h3 className="font-bold text-base text-white">Purchase Credits Token Pack</h3>
        
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {[
            { amount: 100, price: '$5', desc: 'Starter pack' },
            { amount: 300, price: '$12', desc: 'Popular choice' },
            { amount: 1000, price: '$35', desc: 'Marketer value' },
            { amount: 3000, price: '$90', desc: 'Agency volume' }
          ].map((pack) => (
            <div key={pack.amount} className="glass-panel p-5 border-white/5 flex flex-col justify-between items-center text-center gap-4 hover:border-violet-500/10 transition-colors">
              <div>
                <span className="text-xl font-black text-white">{pack.amount} Credits</span>
                <p className="text-[10px] text-gray-500 mt-1 uppercase font-bold tracking-wide">{pack.desc}</p>
              </div>
              <button
                onClick={() => handlePurchaseCredits(pack.amount)}
                disabled={purchasing}
                className="w-full py-2 bg-violet-600 hover:bg-violet-500 disabled:bg-violet-800/40 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1"
              >
                Buy for {pack.price} <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}

        </div>
      </section>

      {/* UPGRADE TIERS */}
      <section className="flex flex-col gap-4">
        <h3 className="font-bold text-base text-white">Upgrade Subscription Tier</h3>
        <div className="grid sm:grid-cols-2 gap-6">
          
          <div className="glass-panel p-6 border-white/5 flex justify-between items-center">
            <div>
              <h4 className="font-bold text-white text-sm">Creator Pro Plan</h4>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Add 500 starting credits, connect real API credentials, unlock Veo video rendering.
              </p>
            </div>
            <button
              onClick={() => handleUpgradePlan('pro')}
              disabled={purchasing || plan === 'pro'}
              className="px-4 py-2.5 bg-violet-600/10 hover:bg-violet-600 text-violet-400 hover:text-white rounded-lg text-xs font-bold border border-violet-500/20 whitespace-nowrap transition-colors"
            >
              {plan === 'pro' ? 'Current Plan' : 'Upgrade for $29'}
            </button>
          </div>

          <div className="glass-panel p-6 border-white/5 flex justify-between items-center">
            <div>
              <h4 className="font-bold text-white text-sm">Studio Agency Plan</h4>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Add 2,000 credits, batch image swaps, team workspace tools, priority server nodes.
              </p>
            </div>
            <button
              onClick={() => handleUpgradePlan('agency')}
              disabled={purchasing || plan === 'agency'}
              className="px-4 py-2.5 bg-violet-600/10 hover:bg-violet-600 text-violet-400 hover:text-white rounded-lg text-xs font-bold border border-violet-500/20 whitespace-nowrap transition-colors"
            >
              {plan === 'agency' ? 'Current Plan' : 'Upgrade for $99'}
            </button>
          </div>

        </div>
      </section>

      {/* TRANSACTION LEDGER AUDIT */}
      <section className="flex flex-col gap-4">
        <h3 className="font-bold text-base text-white flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-violet-400" /> Credit Ledger Transaction Audit
        </h3>

        <div className="glass-panel border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-black/30 text-gray-400 font-semibold border-b border-white/5">
                  <th className="p-4">Date</th>
                  <th className="p-4">Action</th>
                  <th className="p-4">Description</th>
                  <th className="p-4">Credit Delta</th>
                  <th className="p-4">Reference ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {ledger.map((log) => {
                  const isDeduction = log.action === 'deduct';
                  return (
                    <tr key={log.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4 text-gray-400">{new Date(log.createdAt).toLocaleString()}</td>
                      <td className="p-4 uppercase font-bold text-[10px]">
                        <span className={`px-2.5 py-0.5 rounded-full border ${
                          isDeduction 
                            ? 'bg-red-500/10 text-red-400 border-red-500/10' 
                            : 'bg-green-500/10 text-green-400 border-green-500/10'
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="p-4 text-gray-300 font-medium">{log.description}</td>
                      <td className={`p-4 font-extrabold text-sm ${isDeduction ? 'text-red-400' : 'text-green-400'}`}>
                        {isDeduction ? '-' : '+'}{log.amount}
                      </td>
                      <td className="p-4 font-mono text-[10px] text-gray-500">{log.generationId || log.id}</td>
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
