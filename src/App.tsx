import React, { useState, useEffect } from 'react';
import { createFastMCPClient, FastMCPClient } from './services/FastMCPClient';
import SearchComponent from './components/SearchComponent';
import './App.css';

const App: React.FC = () => {
  const [client, setClient] = useState<FastMCPClient | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    const initializeClient = async () => {
      try {
        setIsInitializing(true);
        setInitError(null);

        const fastMCPClient = createFastMCPClient();
        
        await fastMCPClient.initializeAuth();
        
        setClient(fastMCPClient);
      } catch (error) {
        console.error('Failed to initialize FastMCP client:', error);
        setInitError(error instanceof Error ? error.message : 'Failed to initialize client');
      } finally {
        setIsInitializing(false);
      }
    };

    initializeClient();

    return () => {
      if (client) {
        client.close();
      }
    };
  }, []);

  if (isInitializing) {
    return (
      <div className="app">
        <div className="loading-container">
          <div className="spinner-large"></div>
          <h2>Initializing FastMCP Client...</h2>
          <p>Setting up OAuth authentication</p>
        </div>
      </div>
    );
  }

  if (initError) {
    return (
      <div className="app">
        <div className="error-container">
          <h2>Initialization Error</h2>
          <p>{initError}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="retry-button"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="app">
        <div className="error-container">
          <h2>Client Not Available</h2>
          <p>Failed to create FastMCP client</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <SearchComponent client={client} />
    </div>
  );
};

export default App;
