/**
 * Returns a proof request for Reclaim. In production this should fetch from your backend
 * where you call ReclaimProofRequest.init(APP_ID, APP_SECRET, PROVIDER_ID).
 *
 * For dev: set VITE_RECLAIM_PROOF_REQUEST_URL to your backend endpoint that returns { proofRequest }.
 * Or run a small backend that uses @reclaimprotocol/js-sdk to init and return toJsonString().
 */
export async function getProofRequest() {
  const url = import.meta.env.VITE_RECLAIM_PROOF_REQUEST_URL;
  if (url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Proof request failed: ${res.status}`);
    const data = await res.json();
    if (!data.proofRequest) throw new Error('Invalid response: missing proofRequest');
    return { proofRequest: data.proofRequest };
  }
  throw new Error(
    'Reclaim proof request not configured. Set VITE_RECLAIM_PROOF_REQUEST_URL to your backend URL that returns { proofRequest }, or add a backend that calls ReclaimProofRequest.init(APP_ID, APP_SECRET, PROVIDER_ID).'
  );
}
