import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/app.css';
import { App } from './App';
import { useStore } from './lib/store';

const root = createRoot(document.getElementById('root')!);
const render = () => root.render(<StrictMode><App /></StrictMode>);
// Wait for the saved state: a page that starts from empty state would overwrite it (e.g. a code draft).
if (useStore.persist.hasHydrated()) render(); else useStore.persist.onFinishHydration(render);
