import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ServerCrash } from 'lucide-react';
import { fetchCatalog } from './lib/api';
import { useStore } from './lib/store';
import { ping } from './lib/llm';
import { useTutor } from './lib/tutor';
import { useCatalog } from './components/ui';
import { CommandPalette, Sidebar, TopBar } from './components/Shell';
import { Tutor } from './components/Tutor';
import { Home } from './pages/Home';
import { TopicPage } from './pages/Topic';
import { ProblemPage } from './pages/Problem';

function useHash(): string[] {
  const [h, setH] = useState(location.hash);
  useEffect(() => {
    const f = () => setH(location.hash);
    addEventListener('hashchange', f);
    return () => removeEventListener('hashchange', f);
  }, []);
  return h.replace(/^#\/?/, '').split('/').map(decodeURIComponent);
}

export function App() {
  const route = useHash();
  const theme = useStore(s => s.theme);
  const tutorOpen = useTutor(s => s.open);
  const { loaded, topics, byId } = useCatalog();
  const [error, setError] = useState('');
  const [palette, setPalette] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem('algodojo:theme', theme); } catch { /* only avoids a flash on load */ }
  }, [theme]);
  useEffect(() => {
    fetchCatalog()
      .then(c => useCatalog.setState({ ...c, byId: Object.fromEntries(c.problems.map(p => [p.id, p])), loaded: true }))
      .catch(e => setError(String(e.message ?? e)));
    ping();
    const id = setInterval(ping, 20000);
    addEventListener('focus', ping);
    const keys = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === 'j') { e.preventDefault(); useTutor.getState().toggle(); }
      if (mod && e.key.toLowerCase() === 'k') { e.preventDefault(); setPalette(o => !o); }
    };
    addEventListener('keydown', keys);
    return () => { clearInterval(id); removeEventListener('focus', ping); removeEventListener('keydown', keys); };
  }, []);

  if (error) {
    return (
      <div className="grid h-full place-items-center p-8 text-center">
        <div className="grid justify-items-center gap-3">
          <ServerCrash size={30} className="text-bad" />
          <h2 className="text-xl font-semibold">Can’t reach the AlgoDojo server</h2>
          <p className="text-muted">Start it with <code>./start.sh</code> from the project folder ({error}).</p>
        </div>
      </div>
    );
  }

  const [kind, ...rest] = route;
  const topic = kind === 't' ? topics.find(t => t.id === rest[0]) : undefined;
  const problem = kind === 'p' ? byId[rest.join('/')] : undefined;
  const currentTopic = topic?.id ?? problem?.topic;
  const tab = (['theory', 'play', 'problems'] as const).find(x => x === rest[1]) ?? 'theory';
  const pageKey = route.join('/');

  return (
    <div className="flex h-full flex-col">
      <TopBar onPalette={() => setPalette(true)} />
      <div className="flex min-h-0 flex-1">
        <Sidebar current={currentTopic} />
        <main className={problem ? 'flex min-h-0 min-w-0 flex-1 flex-col' : 'min-w-0 flex-1 overflow-y-auto'}>
          {!loaded ? <div className="m-10 h-64 animate-pulse rounded-3xl bg-panel" /> : (
            <motion.div key={pageKey} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .18 }}
              className={problem ? 'flex min-h-0 flex-1 flex-col' : ''}>
              {problem ? <ProblemPage p={problem} /> : topic ? <TopicPage topic={topic} tab={tab} /> : <Home />}
            </motion.div>
          )}
        </main>
        <AnimatePresence>{tutorOpen && <Tutor />}</AnimatePresence>
      </div>
      <CommandPalette open={palette} onClose={() => setPalette(false)} />
    </div>
  );
}
