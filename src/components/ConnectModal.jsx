import { useState } from 'react';
import './ConnectModal.css';

export default function ConnectModal({
  onClose,
  onConnectMetaMask,
  metamaskError,
  hasMetaMask,
  onCreateWallet,
  onCreateAccount,
  onImportWallet,
  onSuccess,
  promptMessage,
}) {
  const [step, setStep] = useState('choose');
  const [mnemonic, setMnemonic] = useState('');
  const [importPhrase, setImportPhrase] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const handleMetaMask = async () => {
    setError(null);
    if (typeof onConnectMetaMask !== 'function') return;
    setBusy(true);
    try {
      await onConnectMetaMask();
      onSuccess?.();
    } catch (e) {
      setError(e?.message || 'MetaMask connection failed');
    } finally {
      setBusy(false);
    }
  };

  const handleCreate = async () => {
    setError(null);
    setBusy(true);
    try {
      const { mnemonic: newMnemonic } = await onCreateWallet();
      setMnemonic(newMnemonic);
      setStep('create');
    } catch (e) {
      setError(e?.message || 'Failed to create wallet');
    } finally {
      setBusy(false);
    }
  };

  const handleImport = async () => {
    if (!importPhrase.trim()) {
      setError('Enter your recovery phrase');
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await onImportWallet(importPhrase.trim());
      onSuccess?.();
    } catch (e) {
      setError(e?.message || 'Failed to import wallet');
    } finally {
      setBusy(false);
    }
  };

  const handleDone = async () => {
    setError(null);
    setBusy(true);
    try {
      if (typeof onCreateAccount === 'function') await onCreateAccount();
      setMnemonic('');
      setStep('choose');
      onSuccess?.();
    } catch (e) {
      setError(e?.message || 'Failed to create account');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="connect-modal-overlay"
      role="dialog"
      aria-labelledby="connect-modal-title"
      aria-modal="true"
      onClick={onClose}
    >
      <div className="connect-modal" onClick={(e) => e.stopPropagation()}>
        <h2 id="connect-modal-title" className="connect-modal__title">
          Connect Wallet
        </h2>
        {promptMessage && (
          <p className="connect-modal__prompt">{promptMessage}</p>
        )}

        {step === 'choose' && (
          <>
            <div className="connect-modal__actions">
              <button
                type="button"
                className="connect-modal__btn connect-modal__btn--primary"
                onClick={handleMetaMask}
                disabled={busy || !hasMetaMask}
              >
                {busy ? 'Connecting…' : 'Connect with MetaMask'}
              </button>
              {!hasMetaMask && (
                <p className="connect-modal__hint">
                  Install the <a href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer">MetaMask extension</a> for your browser, then refresh.
                </p>
              )}
              <span className="connect-modal__divider">or</span>
              <button
                type="button"
                className="connect-modal__btn connect-modal__btn--secondary"
                onClick={handleCreate}
                disabled={busy}
              >
                {busy ? 'Creating…' : 'Create Unlink wallet'}
              </button>
              <button
                type="button"
                className="connect-modal__btn connect-modal__btn--secondary"
                onClick={() => setStep('import')}
                disabled={busy}
              >
                Import Unlink wallet
              </button>
            </div>
            {(metamaskError || error) && (
              <p className="connect-modal__error" role="alert">
                {metamaskError || error}
              </p>
            )}
          </>
        )}

        {step === 'import' && (
          <>
            <label className="connect-modal__label">
              Recovery phrase (mnemonic)
            </label>
            <textarea
              className="connect-modal__input"
              value={importPhrase}
              onChange={(e) => setImportPhrase(e.target.value)}
              placeholder="word1 word2 word3 …"
              rows={3}
              autoComplete="off"
            />
            <div className="connect-modal__row">
              <button
                type="button"
                className="connect-modal__btn connect-modal__btn--secondary"
                onClick={() => { setStep('choose'); setImportPhrase(''); setError(null); }}
                disabled={busy}
              >
                Back
              </button>
              <button
                type="button"
                className="connect-modal__btn connect-modal__btn--primary"
                onClick={handleImport}
                disabled={busy}
              >
                {busy ? 'Importing…' : 'Import'}
              </button>
            </div>
          </>
        )}

        {step === 'create' && mnemonic && (
          <>
            <p className="connect-modal__warning">
              Save this phrase securely. You will need it to recover your wallet.
            </p>
            <div className="connect-modal__mnemonic">{mnemonic}</div>
            <button
              type="button"
              className="connect-modal__btn connect-modal__btn--primary"
              onClick={handleDone}
            >
              I’ve saved my phrase
            </button>
          </>
        )}

        {error && step !== 'choose' && (
          <p className="connect-modal__error" role="alert">
            {error}
          </p>
        )}

        <button
          type="button"
          className="connect-modal__close"
          onClick={onClose}
          aria-label="Close"
        >
          Close
        </button>
      </div>
    </div>
  );
}
