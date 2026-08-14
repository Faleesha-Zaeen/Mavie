import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

import routes from './routes/index.js';
import { hasCredentials } from './services/youcam/client.js';
import { activeProvider } from './services/ai/llm.js';
import { store } from './store.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '12mb' })); // room for base64 photos
app.use(morgan('dev'));

app.use('/api', routes);

app.use((req, res) => {
  res.status(404).json({ error: 'not_found', message: `No route for ${req.method} ${req.path}` });
});

/**
 * Judges should never see a raw stack trace.
 * Every failure returns something a human can read.
 */
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  console.error('[mavie]', err);
  res.status(err.status || 500).json({
    error: 'server_error',
    message: "Something went wrong on MAVIE's side. Please try that again.",
    ...(process.env.NODE_ENV !== 'production' ? { detail: err.message } : {}),
  });
});

app.listen(PORT, async () => {
  console.log(`\n  💗  MAVIE API  ·  http://localhost:${PORT}`);
  console.log(`      YouCam    ${hasCredentials() ? 'live' : 'mocked (no credentials)'}`);
  console.log(`      LLM       ${activeProvider()}`);

  // Surface a bad Supabase URL or key at boot rather than mid-demo.
  const result = await store.hydrate();
  if (result.hydrated) {
    console.log(`      Database  supabase · ${result.closet} closet items, ${result.saved_looks} saved looks`);
  } else if (result.reason === 'no_supabase') {
    console.log('      Database  in-memory (no Supabase configured)');
  } else {
    console.log(`      Database  in-memory — Supabase unreachable: ${result.reason}`);
  }
  console.log('');
});
