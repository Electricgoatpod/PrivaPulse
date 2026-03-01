/**
 * Mock HRV (Heart Rate Variability) classification using EZKL-style proof shape.
 * After Zen session we "classify" mock HRV data and return a witness/proof-like result.
 *
 * Uses the `ezkl` package when available; falls back to a local mock that mimics
 * the same response shape (witness.inputs, witness.outputs, proof).
 */

const CLASSES = ['stressed', 'recovering', 'recovered'];

/**
 * Generate mock HRV features for a Zen session.
 * If simulatedHrvMs is provided (e.g. from Apple Health), use it as RMSSD and build EZKL input.
 */
export function generateMockHRVData(opts = {}) {
  const { simulatedHrvMs } = opts;
  const meanRR = 800 + Math.floor(Math.random() * 200);
  const rmssd = simulatedHrvMs != null ? Math.round(Number(simulatedHrvMs)) : 40 + Math.floor(Math.random() * 50);
  const sdnn = simulatedHrvMs != null ? Math.round(Number(simulatedHrvMs) * 1.2) : 50 + Math.floor(Math.random() * 60);
  const pNN50 = simulatedHrvMs != null ? Math.max(0, Math.round((simulatedHrvMs / 100) * 30)) : 5 + Math.floor(Math.random() * 25);
  return {
    input: [[meanRR, rmssd, sdnn, pNN50]],
  };
}

/**
 * Mock classification: map HRV features to class index and label.
 * 0 = stressed, 1 = recovering, 2 = recovered.
 */
function classifyMock(hrvInput) {
  const [meanRR, rmssd, sdnn, pNN50] = hrvInput[0] || [800, 50, 60, 15];
  const score = (rmssd / 100) * 0.4 + (sdnn / 120) * 0.3 + (pNN50 / 30) * 0.3;
  let classIndex = 0;
  if (score > 0.6) classIndex = 2;      // recovered
  else if (score > 0.35) classIndex = 1; // recovering
  return { classIndex, label: CLASSES[classIndex] };
}

/**
 * Build a mock EZKL getProof-style response (witness + proof hex).
 */
function buildMockProofResponse(hrvInput, classIndex) {
  const proofHex = Array(4)
    .fill(0)
    .map(() => Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''))
    .join('');
  return {
    taskId: `mock-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    status: 'SUCCESS',
    proof: proofHex,
    witness: {
      inputs: [hrvInput.map((row) => [...row, 0, 0, 0].slice(0, 4))],
      outputs: [[classIndex, 0, 0, 0]],
      maxLookupInputs: 362,
    },
  };
}

/**
 * Run mock HRV classification and return EZKL-style result.
 * Optionally uses real EZKL Hub if artifactId is set and hub is available.
 *
 * @param {Object} [opts] - Options
 * @param {string} [opts.artifactId] - EZKL Hub artifact ID (if you have one)
 * @returns {Promise<{ classification: string, classIndex: number, proofId?: string, witness?: object, proof?: string }>}
 */
export async function classifyHRVWithEzkl(opts = {}) {
  const hrvData = generateMockHRVData({ simulatedHrvMs: opts.simulatedHrvMs });
  const hrvInput = hrvData.input;
  const { classIndex, label } = classifyMock(hrvInput);

  // If artifact ID provided, try real EZKL Hub (may fail if artifact missing / network error)
  if (opts.artifactId && typeof window !== 'undefined') {
    try {
      const { router } = await import('ezkl');
      const inputBlob = new Blob([JSON.stringify(hrvData)], { type: 'application/json' });
      const inputFile = new File([inputBlob], 'input.json', { type: 'application/json' });
      const { taskId, status } = await router.initiateProof(opts.artifactId, inputFile);
      if (taskId && status === 'PENDING') {
        // Poll for result (mock timeout after 8s so we don't block forever)
        const maxWait = 8000;
        const step = 500;
        let elapsed = 0;
        while (elapsed < maxWait) {
          await new Promise((r) => setTimeout(r, step));
          elapsed += step;
          const result = await router.getProof(taskId);
          if (result.status === 'SUCCESS' && result.witness) {
            const out = result.witness.outputs?.[0]?.[0] ?? classIndex;
            return {
              classification: CLASSES[out] ?? label,
              classIndex: out,
              verified: true,
              proofId: result.taskId,
              witness: result.witness,
              proof: result.proof,
            };
          }
          if (result.status === 'FAILED') break;
        }
      }
    } catch (_) {
      // Fall through to mock
    }
  }

  // Mock: simulate proof generation delay, then return mock proof shape
  await new Promise((r) => setTimeout(r, 800 + Math.random() * 400));
  const mock = buildMockProofResponse(hrvInput, classIndex);
  return {
    classification: label,
    classIndex,
    verified: true,
    proofId: mock.taskId,
    witness: mock.witness,
    proof: mock.proof,
  };
}
