/**
 * Selective Disclosure: ZK-proof of "Shielded Balance >= 10 $PRP" for insurance discount.
 * Uses Unlink SDK when available, otherwise mock proof for demo.
 */

const REQUIRED_BALANCE = 10;

/**
 * Check if balance meets requirement and generate a ZK-proof of "Balance >= 10".
 * @param {number} shieldedBalance - Current $PRP balance from Unlink
 * @param {{ useDemoBalance?: boolean }} [opts] - useDemoBalance: treat as 10 PRP for demo
 * @returns {Promise<{ success: boolean, proofPayload?: string, error?: string }>}
 */
export async function generateInsuranceProof(shieldedBalance, opts = {}) {
  const effectiveBalance = opts.useDemoBalance ? REQUIRED_BALANCE : shieldedBalance;

  if (effectiveBalance < REQUIRED_BALANCE) {
    return {
      success: false,
      error: `Need at least ${REQUIRED_BALANCE} $PRP in your shielded balance. You have ${shieldedBalance} $PRP.`,
    };
  }

  // Unlink SDK would generate a real ZK-proof here; use mock when SDK pending
  try {
    // Optional: const unlink = await getUnlink(); await unlink.proveBalanceGte(10);
    await new Promise((r) => setTimeout(r, 600));
    const proofPayload = JSON.stringify({
      claim: 'balance_gte',
      value: REQUIRED_BALANCE,
      nonce: Date.now().toString(36),
      scope: 'insurance_discount',
    });
    return { success: true, proofPayload };
  } catch (e) {
    return { success: false, error: e?.message || 'Proof generation failed.' };
  }
}
