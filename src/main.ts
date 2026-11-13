import './styles/tokens.css';
import './styles/main.css';
import { AppController } from './controller/AppController';

function byId(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing #${id} element`);
  return el;
}

async function bootstrap(): Promise<void> {
  const app = new AppController({
    stage: byId('stage'),
    hud: byId('hud'),
    controls: byId('controls'),
  });

  try {
    await app.start();
  } catch (error) {
    console.error(error);
    const fallback = byId('fallback');
    fallback.textContent =
      'Sorry, this device or browser does not support WebGL, which is required to run the demo.';
    fallback.hidden = false;
    return;
  }

  // Vite HMR: tear down cleanly so GPU resources and listeners don't leak in dev.
  if (import.meta.hot) {
    import.meta.hot.dispose(() => app.destroy());
  }
}

void bootstrap();
