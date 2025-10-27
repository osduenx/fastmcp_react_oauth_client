import axios, { AxiosInstance, AxiosResponse } from 'axios';

export interface SearchResult {
  content?: string;
  score?: number;
  [key: string]: any;
}

export interface SearchResponse {
  data?: {
    results: SearchResult[];
  };
  results?: SearchResult[];
  content?: any;
  [key: string]: any;
}

export interface JsonRpcError {
  code: number;
  message: string;
  data?: any;
}

export interface JsonRpcResponse {
  id?: number;
  result?: any;
  error?: JsonRpcError;
  jsonrpc?: string;
}

export interface FastMCPClientConfig {
  baseUrl: string;
  auth: 'oauth';
}

export class FastMCPClient {
  private client: AxiosInstance;
  private baseUrl: string;
  private authType: string;
  private accessToken: string | null = null;

  constructor(config: FastMCPClientConfig) {
    this.baseUrl = config.baseUrl;
    this.authType = config.auth;
    
    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
        'User-Agent': 'FastMCP-React-Client/1.0',
      },
      withCredentials: false,
    });

    this.client.interceptors.request.use(
      (config) => {
        if (this.accessToken) {
          config.headers.Authorization = `Bearer ${this.accessToken}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
  }

  async initializeAuth(): Promise<void> {
    console.log('Initializing OAuth authentication...');
    
    try {
      const storedToken = localStorage.getItem('fastmcp_access_token');
      const tokenExpiry = localStorage.getItem('fastmcp_token_expiry');
      
      if (storedToken && tokenExpiry && new Date().getTime() < parseInt(tokenExpiry)) {
        this.accessToken = storedToken;
        console.log('Using existing OAuth token');
        return;
      }
      
      const userToken = prompt(
        'Please enter your FastMCP OAuth access token.\n\n' +
        'To get your token:\n' +
        '1. Go to your FastMCP dashboard\n' +
        '2. Navigate to API Keys/Authentication settings\n' +
        '3. Generate or copy your OAuth access token\n' +
        '4. Paste it here:'
      );
      
      
      if (!userToken || userToken.trim() === '') {
        throw new Error('OAuth token is required to access FastMCP');
      }
      
      this.accessToken = userToken.trim();
      
      localStorage.setItem('fastmcp_access_token', this.accessToken);
      localStorage.setItem('fastmcp_token_expiry', (new Date().getTime() + 3600000).toString());
      
      console.log('OAuth authentication initialized successfully');
    } catch (error) {
      console.error('OAuth initialization failed:', error);
      throw new Error('Failed to initialize OAuth authentication: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  async callTool(toolName: string, parameters: Record<string, any>): Promise<SearchResponse> {
    if (!this.accessToken) {
      await this.initializeAuth();
    }

    try {
      const requestBody = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
          name: toolName,
          arguments: parameters,
        },
      };

      console.log('Making FastMCP JSON-RPC request:', {
        url: `${this.baseUrl}/mcp`,
        body: requestBody,
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/event-stream',
        }
      });

      const response: AxiosResponse<string | JsonRpcResponse | SearchResponse> = await this.client.post('/mcp', requestBody);
      
      console.log('FastMCP response type:', typeof response.data);
      console.log('FastMCP response:', response.data);
      
      if (typeof response.data === 'string') {
        console.log('Response is a string, parsing SSE format...');
        
        const lines = response.data.split('\n');
        let dataLine = '';
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            dataLine = line.substring(6);
            break;
          }
        }
        
        if (dataLine) {
          console.log('Found data line:', dataLine);
          try {
            const parsedSSE: JsonRpcResponse = JSON.parse(dataLine);
            console.log('Parsed SSE data:', parsedSSE);
            
            if (parsedSSE.error) {
              throw new Error(`JSON-RPC Error: ${parsedSSE.error.message} (Code: ${parsedSSE.error.code})`);
            }
            
            if (parsedSSE.result && (parsedSSE.result as any).content) {
              console.log('Found SSE content array');
              const contentArray = (parsedSSE.result as any).content;
              
              if (Array.isArray(contentArray) && contentArray.length > 0) {
                const firstContent = contentArray[0];
                if (firstContent.text) {
                  console.log('Parsing nested JSON from text content...');
                  const finalData = JSON.parse(firstContent.text);
                  console.log('Final parsed data:', finalData);
                  return finalData as SearchResponse;
                }
              }
            }
            
            return parsedSSE.result as SearchResponse || parsedSSE as any;
          } catch (parseError) {
            console.error('Failed to parse SSE data:', parseError);
            throw new Error(`Failed to parse SSE response: ${parseError}`);
          }
        } else {
          throw new Error('No data line found in SSE response');
        }
      }
      
      // At this point, response.data is JsonRpcResponse or SearchResponse (not a string)
      const responseData = response.data as JsonRpcResponse | SearchResponse;
      
      if (typeof responseData === 'object' && responseData !== null && 'error' in responseData) {
        const errorData = (responseData as JsonRpcResponse).error;
        throw new Error(`JSON-RPC Error: ${errorData!.message} (Code: ${errorData!.code})`);
      }
      
      if ('result' in responseData) {
        return (responseData as JsonRpcResponse).result as SearchResponse;
      }
      
      return responseData as SearchResponse;
      
    } catch (error) {
      console.error('FastMCP call_tool error:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
          throw new Error(`Network error connecting to FastMCP server at ${this.baseUrl}. Please check if the server is running and accessible.`);
        } else if (error.response) {
          const status = error.response.status;
          const statusText = error.response.statusText;
          const responseData = error.response.data;
          
          console.error('Server response:', {
            status,
            statusText,
            data: responseData,
            headers: error.response.headers
          });
          
          throw new Error(
            `FastMCP server returned error ${status}: ${statusText}\n` +
            `Response: ${JSON.stringify(responseData)}\n` +
            `Please check your OAuth token and API documentation.`
          );
        } else if (error.request) {
          throw new Error(`No response received from FastMCP server. Please check the server URL: ${this.baseUrl}`);
        }
      }
      
      throw new Error(`Failed to call tool ${toolName}: ${error}`);
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      console.log('Testing FastMCP connection...');
      
      const testResult = await this.search('test connection', 'hybrid');
      
      if (testResult) {
        console.log('Connection test successful - received results');
        return true;
      } else {
        console.log('Connection test successful - no results but API responded');
        return true;
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      
      try {
        console.log('Trying basic server ping...');
        const pingResponse = await this.client.get('/');
        console.log('Server ping successful:', pingResponse.status);
        return true;
      } catch (pingError) {
        console.error('Server ping also failed:', pingError);
        return false;
      }
    }
  }

  async search(searchText: string, searchType: string = 'hybrid'): Promise<SearchResult[]> {
    try {
      const result = await this.callTool('search', {
        search_text: searchText,
        search_type: searchType,
      });

      console.log('=== SEARCH METHOD DEBUG ===');
      console.log('Search result structure:', result);
      console.log('Search result type:', typeof result);
      console.log('Search result keys:', Object.keys(result || {}));
      console.log('Full result JSON:', JSON.stringify(result, null, 2));

      let results: SearchResult[] = [];
      
      if (result && typeof result === 'object') {
        console.log('Result is an object, checking for results...');
        
        if (result.results && Array.isArray(result.results)) {
          console.log('Found result.results array with', result.results.length, 'items');
          results = result.results;
        }
        else if (result.data && result.data.results) {
          console.log('Found result.data.results array with', result.data.results.length, 'items');
          results = result.data.results;
        }
        else if (Array.isArray(result)) {
          console.log('Result is directly an array with', result.length, 'items');
          results = result;
        }
        else if (result.content) {
          console.log('Found result.content, converting to array');
          results = [result as SearchResult];
        }
        else {
          console.log('No recognizable results structure found');
          console.log('Available properties:', Object.keys(result));
        }
      } else {
        console.log('Result is not an object or is null/undefined');
      }

      console.log('Extracted results:', results);
      console.log('Results type:', typeof results);
      console.log('Results length:', results.length);

      if (results.length > 0) {
        console.log('=== ALL RESULTS ===');
        results.forEach((result, index) => {
          console.log(`Result ${index + 1}:`, result);
          console.log(`Content:`, result.content);
          console.log(`Score:`, result.score);
          console.log(`Metadata:`, result.metadata);
        });
        console.log('=== END ALL RESULTS ===');
        return results;
      } else {
        console.log('No results found in response');
        return [];
      }
    } catch (error) {
      console.error('Search error:', error);
      throw error;
    }
  }

  clearAuth(): void {
    localStorage.removeItem('fastmcp_access_token');
    localStorage.removeItem('fastmcp_token_expiry');
    this.accessToken = null;
    console.log('Authentication tokens cleared');
  }

  async close(): Promise<void> {
    this.accessToken = null;
    console.log('FastMCP client closed');
  }
}

export const createFastMCPClient = (baseUrl?: string): FastMCPClient => {
  const mcpServerUrl = process.env.REACT_APP_MCP_SERVER_URL || baseUrl || 'https://escalationbot.fastmcp.app/mcp';
  const cleanUrl = mcpServerUrl.replace(/\/mcp$/, '');
  const isDevelopment = process.env.NODE_ENV === 'development';
  const clientBaseUrl = isDevelopment ? '' : cleanUrl;
  console.log('Creating FastMCP client with URL:', clientBaseUrl || cleanUrl);
  return new FastMCPClient({
    baseUrl: clientBaseUrl,
    auth: 'oauth',
  });
};
