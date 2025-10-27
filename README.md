# FastMCP React Client

A modern React application that demonstrates integration with FastMCP servers using OAuth authentication. This project provides a clean, TypeScript-based interface for calling MCP tools and displaying results.

## Features

- **FastMCP Integration**: Full support for MCP (Model Context Protocol) tool calling with OAuth authentication
- **Search Interface**: Ready-to-use search component with multiple search types (hybrid, semantic, keyword)
- **Modern UI**: Responsive interface with loading states and comprehensive error handling
- **TypeScript**: Fully typed for better development experience and code safety
- **Multiple Results Display**: Shows all search results with metadata

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Access to a FastMCP server
- OAuth access token from your FastMCP provider

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd fastmcp_react_oauth_client
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
   
   Create a `.env` file in the project root:
   
   ```env
   REACT_APP_MCP_SERVER_URL=https://your-mcp-server.com/mcp
   ```
   
   Replace `https://your-mcp-server.com/mcp` with your actual FastMCP server URL.

4. Start the development server:
```bash
npm start
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

6. Enter your OAuth access token when prompted.

## Usage

### Search Interface

1. **Enter Query**: Type your search query in the search input field
2. **Select Search Type**: Choose between:
   - **Hybrid**: Combines multiple search strategies
   - **Semantic**: Semantic similarity search
   - **Keyword**: Traditional keyword matching
3. **Execute Search**: Click "Search" or press Enter
4. **View Results**: All matching results are displayed with content and scores
5. **Clear Auth**: Use "Clear Auth" to reset your stored authentication token

## Project Structure

```
src/
├── components/
│   ├── SearchComponent.tsx    # Main search interface component
│   └── SearchComponent.css    # Component styles
├── services/
│   └── FastMCPClient.ts       # FastMCP client and API integration
├── App.tsx                    # Root app component
├── App.css                    # App-level styles
├── index.tsx                  # Application entry point
└── index.css                  # Global styles
```

## Configuration

### Environment Variables

The application requires one environment variable:

- `REACT_APP_MCP_SERVER_URL`: The URL of your FastMCP server (e.g., `https://your-server.com/mcp`)

### OAuth Authentication

The application uses OAuth token-based authentication:

1. Tokens are securely stored in browser localStorage
2. Tokens expire after 1 hour by default
3. Users are prompted to re-authenticate when tokens expire
4. The "Clear Auth" button allows manual token removal

## Features

### FastMCPClient API

The `FastMCPClient` class provides:

- **`search(query, type)`**: Execute search queries with specified search type
- **`testConnection()`**: Verify connection to the MCP server
- **`callTool(name, parameters)`**: Call any MCP tool with parameters
- **`clearAuth()`**: Clear stored authentication tokens
- **`initializeAuth()`**: Initialize OAuth authentication flow

### Search Types

- **Hybrid**: Combines multiple search approaches for balanced results
- **Semantic**: Uses semantic similarity for finding related content
- **Keyword**: Traditional text matching

## Development

### Available Scripts

- `npm start` - Runs the app in development mode
- `npm run build` - Creates an optimized production build
- `npm test` - Launches the test runner
- `npm eject` - Ejects from Create React App (irreversible)

### Tech Stack

- **React 18**: Modern React with hooks
- **TypeScript**: Type safety and enhanced developer experience
- **Axios**: HTTP client for API requests
- **CSS3**: Modern styling with animations

## Production Deployment

1. Build the application:
```bash
npm run build
```

2. Deploy the `build` folder to your hosting service:
   - Netlify
   - Vercel
   - AWS S3 + CloudFront
   - Any static hosting provider

3. Set environment variables in your hosting platform's configuration.

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues and questions, please open an issue on GitHub.
