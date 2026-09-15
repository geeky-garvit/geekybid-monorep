'use client';

import React from 'react';

export interface WebhookLog {
  id: string;
  event: string;
  status: 'pending' | 'success';
  timestamp: string;
}

interface WebhookConsoleProps {
  logs: WebhookLog[];
}

export default function WebhookConsole({ logs }: WebhookConsoleProps) {
  return (
    <div className="bg-slate-900 text-slate-200 p-5 rounded-2xl font-mono text-[11px] space-y-3 shadow-md border border-slate-800">
      <div className="flex justify-between items-center text-slate-400 pb-2 border-b border-slate-800 text-[10px] uppercase font-bold">
        <span>Webhook Console</span>
        <span className="text-emerald-400">● Live Simulation</span>
      </div>

      {logs.length === 0 ? (
        <p className="text-slate-500 italic">Submit payment to inspect mock webhook payload logs...</p>
      ) : (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {logs.map((log) => (
            <div key={log.id} className="space-y-0.5">
              <div className="flex justify-between text-[10px] text-slate-400">
                <span className="text-purple-400">[{log.timestamp}]</span>
                <span className="text-emerald-400">STATUS 200 OK</span>
              </div>
              <div className="text-slate-200 bg-slate-800/80 p-2 rounded border border-slate-700/50">
                <span className="text-amber-300">event:</span> &quot;{log.event}&quot;
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
