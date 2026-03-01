import { useState, useEffect, useRef } from 'react';
import ZenMode from './components/ZenMode';
import PrivateAssets from './components/PrivateAssets';
import SelectiveDisclosure from './components/SelectiveDisclosure';
import ConnectModal from './components/ConnectModal';
import AppleHealthPermissionModal from './components/AppleHealthPermissionModal';
import { useUnlink } from '@unlink-xyz/react';
import { connectMetaMask, hasMetaMask } from './utils/metamask';
import { runShieldedTransfer } from './utils/unlinkReward';
import { runClaimRewardAgent, startAgentMonitoring } from './utils/AgentService';
import ShadowDashboard from './components/ShadowDashboard';
import './App.css';

const CLASS_LABELS = { stressed: 'Stressed', recovering: 'Recovering', recovered: 'Recovered' };

function shortenAddress(addr) {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function AppleLogoIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}

export default function App() {
  const { send, activeAccount, unlink, walletExists, createWallet, createAccount, importWallet, openModal } = useUnlink();
  const [metamaskAddress, setMetamaskAddress] = useState(() => {
    try {
      return sessionStorage.getItem('metamaskAddress') || null;
    } catch {
      return null;
    }
  });

  const isConnected = !!metamaskAddress;

  const [stressSpike, setStressSpike] = useState(false);
  const [zenActive, setZenActive] = useState(false);
  const [hrvResult, setHrvResult] = useState(null);
  const [shieldingStatus, setShieldingStatus] = useState(null);
  const [shieldingError, setShieldingError] = useState(null);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [connectPrompt, setConnectPrompt] = useState(null);
  const [connectError, setConnectError] = useState(null);

  const [appleHealthConnected, setAppleHealthConnected] = useState(false);
  const [showAppleHealthModal, setShowAppleHealthModal] = useState(false);
  const [liveHrv, setLiveHrv] = useState(null);
  const [simulatedHrvForProof, setSimulatedHrvForProof] = useState(null);
  const appleHealthStressTriggered = useRef(false);

  const [agentLogs, setAgentLogs] = useState([]);
  const [agentProcessing, setAgentProcessing] = useState(false);
  const [recentRewardLogEntries, setRecentRewardLogEntries] = useState([]);

  useEffect(() => {
    if (metamaskAddress) {
      try {
        sessionStorage.setItem('metamaskAddress', metamaskAddress);
      } catch (_) {}
    } else {
      try {
        sessionStorage.removeItem('metamaskAddress');
      } catch (_) {}
    }
  }, [metamaskAddress]);

  useEffect(() => {
    startAgentMonitoring((line) => setAgentLogs((prev) => [...prev, line]));
  }, []);

  useEffect(() => {
    const ethereum = typeof window !== 'undefined' ? window.ethereum : null;
    if (!ethereum || !metamaskAddress) return;
    const onAccountsChanged = (accounts) => {
      const next = accounts?.[0] ?? null;
      setMetamaskAddress(next);
    };
    ethereum.on?.('accountsChanged', onAccountsChanged);
    return () => ethereum.removeListener?.('accountsChanged', onAccountsChanged);
  }, [metamaskAddress]);

  // Live HRV simulation after connecting Apple Health: ~65ms for 3s, then drop to 32ms and trigger stress (once per connection)
  useEffect(() => {
    if (!appleHealthConnected || zenActive || appleHealthStressTriggered.current) return;
    setLiveHrv(65);
    const start = Date.now();
    const duration = 3000;
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      if (elapsed >= duration) {
        clearInterval(interval);
        appleHealthStressTriggered.current = true;
        setLiveHrv(32);
        setSimulatedHrvForProof(32);
        setStressSpike(true);
        setHrvResult(null);
        setShieldingStatus(null);
        setShieldingError(null);
        setTimeout(() => {
          setZenActive(true);
          setStressSpike(false);
        }, 1500);
        return;
      }
      setLiveHrv(62 + Math.floor(Math.random() * 7));
    }, 280);
    return () => clearInterval(interval);
  }, [appleHealthConnected, zenActive]);

  const handleConnectWallet = async () => {
    setConnectError(null);
    if (!hasMetaMask()) {
      setConnectError('MetaMask not found. Install the MetaMask extension for Chrome.');
      setShowConnectModal(true);
      return;
    }
    try {
      const address = await connectMetaMask();
      if (address) {
        setMetamaskAddress(address);
        setShowConnectModal(false);
        setConnectPrompt(null);
      }
    } catch (e) {
      const msg = e?.message || 'Connection failed';
      setConnectError(msg);
      setShowConnectModal(true);
    }
  };

  const handleDisconnect = () => setMetamaskAddress(null);

  const openConnectModal = () => {
    setConnectError(null);
    if (typeof openModal === 'function') {
      openModal();
    } else {
      setShowConnectModal(true);
    }
  };
  const closeConnectModal = () => {
    setShowConnectModal(false);
    setConnectPrompt(null);
    setConnectError(null);
  };

  const handleStressSpike = () => {
    if (!isConnected) {
      setConnectPrompt('Connect your wallet to use the Stress Recovery flow.');
      handleConnectWallet();
      return;
    }
    setStressSpike(true);
    setHrvResult(null);
    setShieldingStatus(null);
    setShieldingError(null);
    setTimeout(() => {
      setZenActive(true);
      setStressSpike(false);
    }, 1500);
  };

  const handleZenComplete = async (classificationResult) => {
    setZenActive(false);
    setSimulatedHrvForProof(null);
    if (classificationResult) setHrvResult(classificationResult);

    if (classificationResult?.verified === true) {
      setShieldingError(null);
      setAgentProcessing(true);
      setShieldingStatus('pending');

      const onLog = (line) => setAgentLogs((prev) => [...prev, line]);

      const result = await runClaimRewardAgent(
        classificationResult,
        { send, activeAccount, signX402Header: unlink?.signX402Header },
        onLog
      );

      setAgentProcessing(false);

      if (result.success) {
        setShieldingStatus('success');
        setRecentRewardLogEntries((prev) => [
          { id: `reward-${Date.now()}`, amount: '1.0', source: '[Shielded Pool]', time: 'Just now', type: 'credit' },
          ...prev,
        ]);
      } else {
        if (activeAccount) {
          setShieldingStatus('pending');
          const transferResult = await runShieldedTransfer(send, activeAccount);
          if (transferResult.success) {
            setShieldingStatus('success');
            setAgentLogs((prev) => [...prev, '[Agent]: 402 Challenge resolved. Shielded payout confirmed on Monad.']);
            setRecentRewardLogEntries((prev) => [
              { id: `reward-${Date.now()}`, amount: '1.0', source: '[Shielded Pool]', time: 'Just now', type: 'credit' },
              ...prev,
            ]);
          } else {
            setShieldingStatus('error');
            setShieldingError(transferResult.error || 'Transfer failed');
          }
        } else {
          setShieldingStatus('success');
        }
      }
    }
  };

  return (
    <div className="app">
      {stressSpike && <div className="stress-overlay" aria-hidden="true" />}
      {zenActive && (
        <ZenMode onComplete={handleZenComplete} simulatedHrvMs={simulatedHrvForProof ?? undefined} />
      )}

      <header className="header">
        <div className="header__top">
          <div className="header__brand">
            <h1 className="title">PrivaPulse</h1>
            <p className="subtitle">Meditate. Recover. Get paid by Agent.</p>
          </div>
          <div className="header__actions">
            {isConnected ? (
              <div className="header__wallet-wrap">
                <span className="header__wallet-status" title={metamaskAddress}>
                  {shortenAddress(metamaskAddress)}
                </span>
                <button
                  type="button"
                  className="header__disconnect"
                  onClick={handleDisconnect}
                  aria-label="Disconnect wallet"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="btn-connect"
                onClick={handleConnectWallet}
                aria-label="Connect wallet with MetaMask"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </header>

      {showConnectModal && (
        <ConnectModal
          onClose={closeConnectModal}
          onConnectMetaMask={handleConnectWallet}
          metamaskError={connectError}
          hasMetaMask={hasMetaMask()}
          onCreateWallet={createWallet}
          onCreateAccount={createAccount}
          onImportWallet={importWallet}
          onSuccess={closeConnectModal}
          promptMessage={connectPrompt}
        />
      )}

      {showAppleHealthModal && (
        <AppleHealthPermissionModal
          onAllow={() => {
            setShowAppleHealthModal(false);
            setAppleHealthConnected(true);
          }}
          onDontAllow={() => setShowAppleHealthModal(false)}
        />
      )}

      <main className="main">
        <section className="card dashboard">
          <div className="dashboard-header">
            <span className="label">Status</span>
            <span className={`badge ${zenActive ? 'badge-zen' : shieldingStatus === 'pending' ? 'badge-shielding' : 'badge-idle'}`}>
              {zenActive ? 'Zen Mode' : shieldingStatus === 'pending' ? 'Shielding…' : 'Ready'}
            </span>
          </div>
          <p className="message">
            {zenActive
              ? 'Follow the breathing circle until the countdown ends.'
              : shieldingStatus === 'pending'
                ? 'Shielding Transaction…'
                : !isConnected
                  ? 'Connect your wallet to unlock the Stress Recovery flow and earn $PRP.'
                  : 'When stress spikes, hit the button to trigger Zen Mode and a 5s breathing exercise.'}
          </p>

          {shieldingStatus === 'pending' && (
            <div className="shielding-status shielding-status--pending" aria-live="polite">
              Zen protocol verified. X402 Agent is negotiating shielded $PRP payout via Unlink...
            </div>
          )}
          {shieldingStatus === 'success' && (
            <div className="shielding-status shielding-status--success">
              Success! Agent secured 1.0 $PRP in your shielded vault.
            </div>
          )}
          {shieldingStatus === 'error' && (
            <div className="shielding-status shielding-status--error">
              Shielding failed: {shieldingError}
            </div>
          )}

          {hrvResult && (
            <div className="hrv-result card">
              <span className="label">HRV classification (EZKL mock)</span>
              <p className="hrv-result__classification">
                <span className={`hrv-result__badge hrv-result__badge--${hrvResult.classification}`}>
                  {CLASS_LABELS[hrvResult.classification] ?? hrvResult.classification}
                </span>
              </p>
              {hrvResult.proofId && (
                <p className="hrv-result__proof">Proof: {hrvResult.proofId.slice(0, 20)}…</p>
              )}
            </div>
          )}

          {/* Apple Health connect + Live HRV */}
          <div className="mt-6 flex flex-col gap-3">
            {!appleHealthConnected ? (
              <button
                type="button"
                onClick={() => setShowAppleHealthModal(true)}
                className="font-apple inline-flex items-center justify-center gap-2 rounded-xl bg-black px-5 py-3.5 text-base font-semibold text-white shadow-md hover:bg-gray-800 active:scale-[0.98] transition-all"
                aria-label="Connect Apple Health"
              >
                <AppleLogoIcon className="h-5 w-5" />
                Connect Apple Health
              </button>
            ) : (
              <>
                <div className="font-apple inline-flex items-center justify-center gap-2 rounded-xl bg-gray-100 px-5 py-3 text-base font-medium text-gray-700">
                  <span className="text-green-600">Connected</span>
                  <span aria-hidden="true">✅</span>
                </div>
                {liveHrv != null && (
                  <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
                    <span className="text-sm font-medium text-gray-500">Live HRV</span>
                    <p className="mt-1 font-apple text-2xl font-semibold tabular-nums text-gray-900">
                      {liveHrv}ms
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          <button
            type="button"
            className="btn-stress"
            onClick={handleStressSpike}
            disabled={zenActive}
          >
            Simulate Stress Spike
          </button>
          {connectPrompt && !showConnectModal && (
            <p className="connect-prompt" role="alert">
              {connectPrompt}{' '}
              <button type="button" className="btn-inline" onClick={handleConnectWallet}>
                Connect now
              </button>
            </p>
          )}
        </section>

        <ShadowDashboard agentLogs={agentLogs} />

        <PrivateAssets recentRewardLogEntries={recentRewardLogEntries} />
        <SelectiveDisclosure />
      </main>

      <footer className="footer">
        <span>PrivaPulse</span>
        <span>·</span>
        <span>432Hz · C Major 7th</span>
      </footer>
    </div>
  );
}
