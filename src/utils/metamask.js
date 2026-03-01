/**
 * MetaMask (injected provider) connection for the Connect Wallet button.
 * Uses window.ethereum from the MetaMask browser extension.
 */

const getEthereum = () => (typeof window !== 'undefined' ? window.ethereum : null);

/**
 * Request connection to MetaMask. Returns the first account address or null.
 * @returns {Promise<string | null>}
 */
export async function connectMetaMask() {
  const ethereum = getEthereum();
  if (!ethereum) {
    throw new Error('MetaMask not found. Install the MetaMask browser extension.');
  }
  const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
  return accounts?.[0] ?? null;
}

/**
 * Get the current chain ID from MetaMask.
 * @returns {Promise<string | null>}
 */
export async function getMetaMaskChainId() {
  const ethereum = getEthereum();
  if (!ethereum) return null;
  return ethereum.request({ method: 'eth_chainId' });
}

/**
 * Check if MetaMask is installed.
 */
export function hasMetaMask() {
  return !!getEthereum();
}
