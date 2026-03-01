import { useState, useMemo } from 'react';
import { useUnlinkBalance, useUnlinkHistory } from '@unlink-xyz/react';
import { formatAmount } from '@unlink-xyz/core';
import { PRP_TOKEN_ADDRESS } from '../utils/unlinkReward';
import './PrivateAssets.css';

const PRP_DECIMALS = 18;

/** Normalize token address for comparison (lowercase). */
function tokenKey(addr) {
  return (addr || '').toLowerCase();
}

function parseBalance(value, decimals = PRP_DECIMALS) {
  if (value == null) return '0';
  if (typeof value !== 'bigint') return '0';
  return formatAmount(value, decimals);
}

/**
 * Sum PRP balance from history: for each entry, sum amount.delta for the PRP token.
 * Delta is signed (positive = receive, negative = send). Result can be 0n or negative if more sent than received.
 */
function sumPrpFromHistory(history, prpTokenAddress) {
  const key = tokenKey(prpTokenAddress);
  let sum = 0n;
  for (const entry of history) {
    for (const amt of entry.amounts || []) {
      if (tokenKey(amt.token) === key) {
        try {
          sum += BigInt(amt.delta);
        } catch {
          // ignore invalid delta
        }
      }
    }
  }
  return sum;
}

/**
 * Build log list from history for PRP only: each entry with amount, source label, time, type (credit/debit).
 */
function buildLogFromHistory(history, prpTokenAddress) {
  const key = tokenKey(prpTokenAddress);
  const list = [];
  for (const entry of history) {
    for (const amt of entry.amounts || []) {
      if (tokenKey(amt.token) !== key) continue;
      try {
        const delta = BigInt(amt.delta);
        const isCredit = delta >= 0n;
        const absAmount = delta >= 0n ? delta : -delta;
        const time = entry.timestamp
          ? new Date(entry.timestamp).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })
          : '—';
        list.push({
          id: entry.id + (list.length ? `-${list.length}` : ''),
          amount: formatAmount(absAmount, PRP_DECIMALS),
          source: entry.kind === 'Deposit' ? '[Deposit]' : entry.kind === 'Receive' ? '[Shielded Pool]' : `[${entry.kind}]`,
          time,
          type: isCredit ? 'credit' : 'debit',
          delta,
        });
      } catch {
        // skip invalid
      }
    }
  }
  return list.reverse();
}

const SAMPLE_ADDRESS = '0x71C...8B4';

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

export default function PrivateAssets({ recentRewardLogEntries = [] }) {
  const { balance: sdkBalance, ready } = useUnlinkBalance(PRP_TOKEN_ADDRESS);
  const { history, loading: historyLoading } = useUnlinkHistory({ includeSelfSends: true });

  const prpBalanceFromHistory = useMemo(
    () => sumPrpFromHistory(history, PRP_TOKEN_ADDRESS),
    [history, PRP_TOKEN_ADDRESS]
  );
  const logEntries = useMemo(
    () => buildLogFromHistory(history, PRP_TOKEN_ADDRESS),
    [history, PRP_TOKEN_ADDRESS]
  );
  const displayEntries = useMemo(
    () => [...(recentRewardLogEntries || []), ...logEntries],
    [recentRewardLogEntries, logEntries]
  );

  const displayBalance = prpBalanceFromHistory !== 0n ? prpBalanceFromHistory : sdkBalance;
  const prpBalance = parseBalance(displayBalance);
  const [stealthMode, setStealthMode] = useState(false);

  return (
    <section className="private-assets card">
      <div className="private-assets__header">
        <span className="label">Private Assets</span>
        <label className="stealth-toggle">
          <span className="stealth-toggle__label">Stealth Mode</span>
          <input
            type="checkbox"
            className="stealth-toggle__input"
            checked={stealthMode}
            onChange={(e) => setStealthMode(e.target.checked)}
            aria-label="Toggle Stealth Mode"
          />
          <span className="stealth-toggle__track" aria-hidden="true" />
        </label>
      </div>

      <div className="private-assets__balance">
        <span className="private-assets__balance-label">$PRP Balance:</span>
        <span className="private-assets__balance-value">
          <span className="shimmer-wrap">
            {historyLoading && history.length === 0 ? '…' : prpBalance}
          </span>
        </span>
        {prpBalanceFromHistory !== 0n && sdkBalance === 0n && (
          <span className="private-assets__balance-note" title="Sum from transaction history">
            (from log)
          </span>
        )}
      </div>

      <div className="private-assets__wallet">
        <span className="private-assets__wallet-label">Wallet</span>
        <span className={`private-assets__wallet-address ${stealthMode ? 'private-assets__wallet-address--blur' : ''}`}>
          {SAMPLE_ADDRESS}
        </span>
        <span className={`private-assets__status ${stealthMode ? 'private-assets__status--shield' : ''}`} title={stealthMode ? 'Shielded' : 'Verified'}>
          {stealthMode ? <ShieldIcon /> : <CheckIcon />}
        </span>
      </div>

      <div className="unlinkability-log">
        <span className="label">Unlinkability Log</span>
        <ul className="unlinkability-log__list" aria-label="Transaction history">
          {displayEntries.length === 0 ? (
            <li className="unlinkability-log__item unlinkability-log__item--empty">
              <span className="unlinkability-log__amount">No PRP history yet</span>
            </li>
          ) : (
            displayEntries.map((entry) => (
              <li key={entry.id} className="unlinkability-log__item">
                <span className={`unlinkability-log__amount unlinkability-log__amount--${entry.type}`}>
                  {entry.type === 'credit' ? '+' : '-'}{entry.amount} PRP
                </span>
                <span className="unlinkability-log__source">Source: {entry.source}</span>
                <span className="unlinkability-log__time">{entry.time}</span>
              </li>
            ))
          )}
        </ul>
      </div>
    </section>
  );
}
