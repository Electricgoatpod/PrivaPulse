import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { UnlinkProvider } from '@unlink-xyz/react'
import './index.css'
import App from './App.jsx'

// UnlinkProvider config: target monad-testnet, prioritize MetaMask/injected when SDK supports it.
// When @unlink-xyz/react supports walletOptions/modalMode/connectors, they are passed below.
const unlinkConfig = {
  chain: 'monad-testnet',
  // Prefer MetaMask/injected wallet when SDK supports walletOptions
  walletOptions: {
    prioritize: 'injected',
    preferredWallet: 'metamask',
  },
  modalMode: 'connect',
  // If SDK uses a connectors list (e.g. wagmi-style), add injected connector when available:
  // connectors: [injected()],
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <UnlinkProvider {...unlinkConfig}>
      <App />
    </UnlinkProvider>
  </StrictMode>,
)
