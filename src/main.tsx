import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App'
import '@/index.css'
import { StyledEngineProvider } from "@mui/material";

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <StyledEngineProvider injectFirst>
      <App />
    </StyledEngineProvider>
  </React.StrictMode>,
)
