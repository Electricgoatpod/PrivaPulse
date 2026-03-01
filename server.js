/**
 * Express server for X402 claim endpoint.
 * Run with: node server.js (or npm run server)
 * Listens on port 5000; frontend should call http://localhost:5000/api/claim
 */

import express from 'express';
import cors from 'cors';

const app = express();

const allowOrigin = (origin, cb) => {
  if (!origin || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return cb(null, true);
  return cb(null, true);
};
app.use(cors({ origin: allowOrigin }));
app.use(express.json({ strict: false }));

app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.url}`);
  next();
});

app.options('/api/claim', (req, res) => {
  const o = req.headers.origin || 'http://localhost:5173';
  res.setHeader('Access-Control-Allow-Origin', o);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-PAYMENT, X-Payment-Resolved');
  res.sendStatus(204);
});
app.options('/api/claim/', (req, res) => {
  const o = req.headers.origin || 'http://localhost:5173';
  res.setHeader('Access-Control-Allow-Origin', o);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-PAYMENT, X-Payment-Resolved');
  res.sendStatus(204);
});

app.get('/', (req, res) => {
  res.json({ ok: true, message: 'X402 claim API', claim: 'POST /api/claim' });
});

app.get('/api/claim', (req, res) => {
  res.status(405).json({ error: 'Method Not Allowed', use: 'POST' });
});

function hasValidProof(body) {
  if (!body || typeof body !== 'object') return false;
  const proof = body.proof;
  if (!proof || typeof proof !== 'object') return false;
  return proof.verified === true || proof.proofId || proof.classification;
}

app.post('/api/claim', claimHandler);
app.post('/api/claim/', claimHandler);

function claimHandler(req, res) {
  const body = req.body || {};
  const xPayment = req.headers['x-payment'];
  const xPaymentResolved = req.headers['x-payment-resolved'];
  const hasPayment = Boolean(xPayment || xPaymentResolved);

  console.log(`[POST /api/claim] proof=${body.proof ? 'yes' : 'no'}, X-PAYMENT=${xPayment ? 'yes' : 'no'}, X-Payment-Resolved=${xPaymentResolved || '(none)'}`);

  if (!hasValidProof(body)) {
    return res.status(400).json({ error: 'Missing or invalid EZKL proof in body' });
  }

  if (!hasPayment) {
    res.setHeader('x402-payment-request', 'monad-testnet-0x123');
    return res.status(402).json({
      error: 'Payment Required',
      message: 'X-PAYMENT header required to complete claim',
    });
  }

  return res.status(200).json({
    success: true,
    reward: '1.0 PRP',
  });
}

// 404 must be last so it does not intercept /api/claim
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', path: req.path });
});

app.listen(5000, () => console.log('Banker live on 5000'));
