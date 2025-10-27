import React, { useState } from 'react';
import { FastMCPClient, SearchResult } from '../services/FastMCPClient';
import './SearchComponent.css';

interface SearchComponentProps {
  client: FastMCPClient;
}

const SearchComponent: React.FC<SearchComponentProps> = ({ client }) => {
  const [searchText, setSearchText] = useState('What is ControlUp for Apps?');
  const [searchType, setSearchType] = useState('hybrid');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchText.trim()) {
      setError('Please enter a search query');
      return;
    }

    setLoading(true);
    setError(null);
    setResults([]);

    try {
      console.log('Starting search with:', { searchText, searchType });
      const searchResults = await client.search(searchText, searchType);
      console.log('Search results:', searchResults);
      setResults(searchResults);
    } catch (err) {
      console.error('Search error details:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during search');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="search-container">
      <div className="search-header">
        <h1>FastMCP Search</h1>
        <p>Search using FastMCP with OAuth authentication</p>
      </div>

      <div className="search-form">
        <div className="input-group">
          <label htmlFor="searchText">Search Query:</label>
          <input
            id="searchText"
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter your search query..."
            className="search-input"
          />
        </div>

        <div className="input-group">
          <label htmlFor="searchType">Search Type:</label>
          <select
            id="searchType"
            value={searchType}
            onChange={(e) => setSearchType(e.target.value)}
            className="search-select"
          >
            <option value="hybrid">Hybrid</option>
            <option value="semantic">Semantic</option>
            <option value="keyword">Keyword</option>
          </select>
        </div>

        <div className="button-group">
          <button
            onClick={handleSearch}
            disabled={loading}
            className="search-button"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
          
          <button
            onClick={async () => {
              try {
                const isConnected = await client.testConnection();
                alert(isConnected ? 'Connection test successful!' : 'Connection test failed. Check console for details.');
              } catch (error) {
                alert(`Connection test error: ${error}`);
              }
            }}
            className="test-connection-button"
            title="Test connection to FastMCP server"
          >
            Test Connection
          </button>
          
          <button
            onClick={async () => {
              try {
                console.log('=== DEBUG SEARCH ===');
                const debugResult = await client.callTool('search', {
                  search_text: 'What is ControlUp for Apps?',
                  search_type: 'hybrid'
                });
                console.log('=== RAW DEBUG RESULT ===');
                console.log(JSON.stringify(debugResult, null, 2));
                alert('Debug search completed! Check console (F12) for detailed response structure.');
              } catch (error) {
                console.error('Debug search error:', error);
                alert(`Debug search error: ${error}`);
              }
            }}
            className="debug-button"
            title="Debug search to see raw response"
          >
            Debug Search
          </button>
          
          <button
            onClick={() => {
              client.clearAuth();
              setError(null);
              setResults([]);
              alert('Authentication cleared. You will be prompted for a new token on the next search.');
            }}
            className="clear-auth-button"
            title="Clear stored authentication token"
          >
            Clear Auth
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <h3>Error:</h3>
          <p>{error}</p>
        </div>
      )}

      {loading && (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Searching...</p>
        </div>
      )}

      {results && results.length > 0 && (
        <div className="search-results">
          <h3>Search Results ({results.length}):</h3>
          {results.map((result, index) => (
            <div key={index} className="search-result">
              <div className="result-content">
                <h4>Result #{index + 1}</h4>
                <p>{result.content || 'No content available'}</p>
                {result.score && (
                  <div className="result-score">
                    <span>Score: {result.score}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {results.length === 0 && !loading && !error && (
        <div className="no-results">
          <p>No results found.</p>
        </div>
      )}
    </div>
  );
};

export default SearchComponent;
