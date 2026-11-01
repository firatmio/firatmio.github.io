import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const root = document.getElementById('root')!
const app = (
  <StrictMode>
    <App />
  </StrictMode>
)

// The production build ships the first screen already rendered (scripts/prerender.mjs); the dev server does not.
if (root.firstElementChild) hydrateRoot(root, app)
else createRoot(root).render(app)
