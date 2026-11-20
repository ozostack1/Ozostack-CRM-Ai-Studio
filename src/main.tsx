import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import {initDatabaseSync} from './data/dbSync.ts';

initDatabaseSync().finally(() => {
  createRoot(document.getElementById('root')!).render(<App />);
});
