import { useState, useEffect, useCallback } from 'react';
import { startHealing, stopHealing, playSuccess } from '../utils/ZenEngine';
import { classifyHRVWithEzkl } from '../utils/hrvClassification';
import './ZenMode.css';

const COUNTDOWN_SECONDS = 5;

export default function ZenMode({ onComplete, simulatedHrvMs }) {
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS);
  const [isActive, setIsActive] = useState(true);
  const [classifying, setClassifying] = useState(false);

  const tick = useCallback(() => {
    setSecondsLeft((prev) => {
      if (prev <= 1) {
        setIsActive(false);
        setClassifying(true);
        stopHealing();
        playSuccess();
        classifyHRVWithEzkl({ simulatedHrvMs })
          .then((result) => {
            onComplete?.(result);
          })
          .catch(() => {
            onComplete?.({ classification: 'recovered', classIndex: 2, verified: true });
          })
          .finally(() => setClassifying(false));
        return 0;
      }
      return prev - 1;
    });
  }, [onComplete]);

  useEffect(() => {
    startHealing();
    return () => stopHealing();
  }, []);

  useEffect(() => {
    if (!isActive) return;
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [isActive, tick]);

  return (
    <div className="zen-mode" role="dialog" aria-label="Zen mode breathing">
      <div className="zen-mode__circle breathing-circle" aria-hidden="true" />
      <div className="zen-mode__content">
        <p className="zen-mode__label">Breathe with the circle</p>
        <p className="zen-mode__countdown" aria-live="polite">
          {classifying ? '…' : secondsLeft}
        </p>
        <p className="zen-mode__hint">
          {classifying ? 'Classifying HRV (EZKL)…' : 'seconds left'}
        </p>
      </div>
    </div>
  );
}
