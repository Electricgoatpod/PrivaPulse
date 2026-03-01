/**
 * Health Credit verification & shielding logic
 * - Requests a proof via @reclaimprotocol/js-sdk
 * - Shields a transaction on Monad Testnet via Unlink (replace stub when @unlink/sdk is available)
 */

import { ReclaimProofRequest } from '@reclaimprotocol/js-sdk';

/** Monad Testnet chain ID (replace if different) */
const MONAD_TESTNET_CHAIN_ID = 10143;

/**
 * Request a Reclaim health proof and optionally shield on Monad Testnet.
 * @param {Object} options
 * @param {() => Promise<{ proofRequest: string }>} options.getProofRequest - Async function that returns { proofRequest } (e.g. from your backend)
 * @param {(payload: { verified: boolean }) => Promise<void>} [options.onVerified] - Called after verification with result
 * @returns {Promise<{ verified: boolean, proofData?: unknown, shieldTxHash?: string }>}
 */
export async function verifyHealthViaReclaim({ getProofRequest, onVerified }) {
  if (!getProofRequest) {
    throw new Error('getProofRequest is required (e.g. fetch from your backend with ReclaimProofRequest.init)');
  }

  const { proofRequest: proofRequestJson } = await getProofRequest();
  const reclaimProofRequest = await ReclaimProofRequest.fromJsonString(proofRequestJson);

  return new Promise((resolve, reject) => {
    reclaimProofRequest
      .triggerReclaimFlow({ theme: 'dark' })
      .then(() =>
        reclaimProofRequest.startSession({
          onSuccess: async (proofs) => {
            try {
              // In production you must verify proofs on your backend before trusting them
              const verified = Array.isArray(proofs) && proofs.length > 0;
              if (onVerified) await onVerified({ verified });

              if (verified) {
                const shieldResult = await shieldOnMonadTestnet({ verified });
                resolve({
                  verified: true,
                  proofData: proofs,
                  shieldTxHash: shieldResult?.txHash,
                });
              } else {
                resolve({ verified: false });
              }
            } catch (e) {
              if (onVerified) await onVerified({ verified: false });
              resolve({ verified: false });
            }
          },
          onError: (err) => {
            if (onVerified) onVerified({ verified: false });
            reject(err);
          },
        })
      )
      .catch(reject);
  });
}

/**
 * Shield a transaction on Monad Testnet using Unlink.
 * Stub: replace with real @unlink/sdk when the package is available at the hackathon.
 * @param {{ verified: boolean }} payload
 * @returns {Promise<{ txHash?: string }>}
 */
export async function shieldOnMonadTestnet({ verified }) {
  // TODO: Install @unlink/sdk when provided by Unlink and use it here, e.g.:
  // import { Unlink } from '@unlink/sdk';
  // const unlink = new Unlink({ chainId: MONAD_TESTNET_CHAIN_ID });
  // const tx = await unlink.shield({ ... });
  // return { txHash: tx.hash };

  if (!verified) return {};

  console.info('[Unlink stub] Would shield transaction on Monad Testnet. Add @unlink/sdk when available.');
  return { txHash: undefined };
}

export { MONAD_TESTNET_CHAIN_ID };
