import './styles/main.css';
import { formatHealthStatus } from './lib/health';

const app = document.querySelector<HTMLDivElement>('#app');

if (app) {
  app.textContent = formatHealthStatus('ok');
}
