/**
 * Unlink SDK integration for $PRP shielded reward on Monad Testnet.
 * Use useUnlink() in your component to get send and activeAccount, then call
 * runShieldedTransfer(send, activeAccount, prpTokenAddress) when EZKL proof is verified.
 *
 * SDK API: send(params: SendInput[]) where SendInput = { token, recipient (Unlink address), amount: bigint }
 * Source of the reward: the connected Unlink wallet. For the demo, use the vault wallet so it is the Source.
 */

import { parseAmount } from '@unlink-xyz/core';

/** Vault / source wallet for demo rewards — this address is the Source of the $PRP reward transfer. */
export const VAULT_ADDRESS = '0x6121830cB226F2ed9AfA786ab45c5242a5AEB617';

/** PRP token contract address on Monad Testnet — replace with actual address from chain config. */
export const PRP_TOKEN_ADDRESS = import.meta.env.VITE_PRP_TOKEN_ADDRESS || '0x0000000000000000000000000000000000000000';

const PRP_DECIMALS = 18;
const REWARD_AMOUNT = '1.0';

/**
 * Run a shielded send of 1.0 $PRP to the user's Unlink address using the send function from useUnlink().
 * Configure the app so the connected wallet is the vault (VAULT_ADDRESS); then this transfer uses your
 * wallet as the Source for the demo rewards.
 *
 * @param {Function} send - send function from useUnlink()
 * @param {{ address: string } | null} activeAccount - active account from useUnlink() (recipient Unlink address)
 * @param {string} [tokenAddress] - PRP token contract address (defaults to PRP_TOKEN_ADDRESS)
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export async function runShieldedTransfer(send, activeAccount, tokenAddress = PRP_TOKEN_ADDRESS) {
  if (!send || typeof send !== 'function') {
    return { success: false, error: 'Unlink send not available.' };
  }
  if (!activeAccount?.address) {
    return { success: false, error: 'No wallet connected.' };
  }
  try {
    await send([
      {
        token: tokenAddress,
        recipient: activeAccount.address,
        amount: parseAmount(REWARD_AMOUNT, PRP_DECIMALS),
      },
    ]);
    return { success: true };
  } catch (err) {
    const message = err?.message || String(err);
    console.error('[Unlink] Shielded send failed:', message);
    return { success: false, error: message };
  }
}
