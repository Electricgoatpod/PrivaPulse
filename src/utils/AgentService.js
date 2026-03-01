/**
 * Autonomous X402 Agent for the SDM (Stress Diagnose–Meditate) flow.
 * When EZKL proofStatus is SUCCESS, calls /api/claim; on 402 Payment Required,
 * signs the challenge via Unlink (signX402Header) and retries with X-PAYMENT.
 */

import { runShieldedTransfer } from './unlinkReward';

const CLAIM_URL = import.meta.env.VITE_CLAIM_REWARD_URL || 'http://127.0.0.1:5000/api/claim';

/**
 * Run the X402 claim flow: POST to /api/claim with { proof }; on 402, sign with Unlink and retry.
 * @param {Object} proofResult - EZKL result (proof, verified, proofId, etc.) — sent as `proof` in body
 * @param {{ send: Function, activeAccount: { address: string } | null, signX402Header?: (paymentRequest: string) => Promise<string> }} unlink - Unlink context; signX402Header signs the x402-payment-request to keep agent identity private
 * @param {(msg: string) => void} onLog - Callback for agent log lines (for UI terminal)
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export async function runClaimRewardAgent(proofResult, unlink, onLog) {
  const log = (msg) => {
    const line = `[Agent]: ${msg}`;
    onLog?.(line);
  };

  if (!proofResult?.verified) {
    return { success: false, error: 'Invalid proof result' };
  }

  const { send, activeAccount, signX402Header } = unlink || {};
  const proof = proofResult;

  log('EZKL Proof detected. Initializing X402 handshake...');

  const claimUrl = CLAIM_URL;
  try {
    let res = await fetch(claimUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ proof }),
    });

    if (res.status === 402) {
      log('402 Challenge Received. Agent signing payment...');
      const paymentRequest = res.headers.get('x402-payment-request');

      if (signX402Header && typeof signX402Header === 'function' && paymentRequest) {
        const xPaymentHeader = await signX402Header(paymentRequest);
        log('402 Challenge resolved. Retrying with payment header...');
        res = await fetch(claimUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-PAYMENT': xPaymentHeader,
          },
          body: JSON.stringify({ proof }),
        });
      } else {
        if (send && activeAccount?.address) {
          const transferResult = await runShieldedTransfer(send, activeAccount);
          if (!transferResult.success) {
            log(`Shielded transfer failed: ${transferResult.error}`);
            return { success: false, error: transferResult.error };
          }
        }
        log('402 Challenge resolved. Retrying with payment header...');
        res = await fetch(claimUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Payment-Resolved': 'shielded',
          },
          body: JSON.stringify({ proof, paymentResolved: true }),
        });
      }
    }

    if (!res.ok) {
      const errText = await res.text();
      log(`Claim failed: ${res.status} ${errText}`);
      return { success: false, error: errText || `HTTP ${res.status}` };
    }

    log('200 Success. Shielded payout confirmed on Monad.');
    return { success: true };
  } catch (err) {
    const msg = err?.message || String(err);
    const isNetworkError = msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('Load failed');
    log(isNetworkError
      ? 'Connection failed. Is the claim server running? Run in a separate terminal: npm run server'
      : `Error: ${msg}`);
    return { success: false, error: msg };
  }
}

/**
 * Start the agent "monitoring" state and emit an initial log.
 * Call this when the app/dashboard mounts so the terminal shows "Monitoring stress levels...".
 */
export function startAgentMonitoring(onLog) {
  const log = (msg) => onLog?.(`[Agent]: ${msg}`);
  log('Monitoring stress levels...');
}
