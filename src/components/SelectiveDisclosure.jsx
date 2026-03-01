import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useUnlinkBalance } from '@unlink-xyz/react';
import { PRP_TOKEN_ADDRESS } from '../utils/unlinkReward';
import { generateInsuranceProof } from '../utils/insuranceProof';
import './SelectiveDisclosure.css';

const DISCOUNT_CODE = 'HEALTH2026';

export default function SelectiveDisclosure() {
  const { balance } = useUnlinkBalance(PRP_TOKEN_ADDRESS);
  const shieldedBalance = balance != null ? Number(balance) / 1e18 : 0;
  const [demo10PRP, setDemo10PRP] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [proofPayload, setProofPayload] = useState(null);
  const [error, setError] = useState(null);
  const [generating, setGenerating] = useState(false);

  const handleGenerateProof = async () => {
    setError(null);
    setGenerating(true);
    const result = await generateInsuranceProof(shieldedBalance, { useDemoBalance: demo10PRP });
    setGenerating(false);
    if (result.success) {
      setProofPayload(result.proofPayload);
      setModalOpen(true);
    } else {
      setError(result.error);
    }
  };

  const canGenerate = shieldedBalance >= 10 || demo10PRP;

  return (
    <>
      <section className="selective-disclosure card">
        <span className="label">Selective Disclosure</span>
        <p className="selective-disclosure__intro">
          Generate a zero-knowledge proof of high resilience for your insurer. Your wallet, HRV, and stress history stay private.
        </p>

        <label className="selective-disclosure__demo">
          <input
            type="checkbox"
            checked={demo10PRP}
            onChange={(e) => setDemo10PRP(e.target.checked)}
            aria-label="Simulate 10 $PRP balance for demo"
          />
          <span>Simulate 10+ $PRP (demo)</span>
        </label>

        {error && (
          <div className="selective-disclosure__error" role="alert">
            {error}
          </div>
        )}

        <button
          type="button"
          className="btn-insurance-proof"
          onClick={handleGenerateProof}
          disabled={generating || !canGenerate}
        >
          {generating ? 'Generating…' : 'Generate Proof for Insurer'}
        </button>
      </section>

      {modalOpen && proofPayload && (
        <div
          className="insurance-modal-overlay"
          role="dialog"
          aria-labelledby="insurance-modal-title"
          aria-modal="true"
          onClick={() => setModalOpen(false)}
        >
          <div className="insurance-modal" onClick={(e) => e.stopPropagation()}>
            <h2 id="insurance-modal-title" className="insurance-modal__title">
              High Resilience Proof
            </h2>
            <div className="insurance-modal__qr">
              <QRCodeSVG value={proofPayload} size={180} level="M" includeMargin />
            </div>
            <p className="insurance-modal__bouncer">
              This QR code proves you have a <strong>High Resilience Score</strong> to your insurer. It does NOT reveal your wallet address, HRV data, or stress history.
            </p>
            <div className="insurance-modal__success">
              <span className="insurance-modal__badge">Proof Verified ✅</span>
              <span className="insurance-modal__code">Discount code: <strong>{DISCOUNT_CODE}</strong></span>
            </div>
            <button
              type="button"
              className="insurance-modal__close"
              onClick={() => setModalOpen(false)}
              aria-label="Close"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
