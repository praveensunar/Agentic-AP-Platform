import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

// Find the root DOM element and mount the React application
const rootDOMElement = document.getElementById('root')!;
createRoot(rootDOMElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
