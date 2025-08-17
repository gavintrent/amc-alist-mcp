import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { AMCClient } from './amcClient';
import { MCPTools } from './mcpTools';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? false : true,
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Initialize AMC client
const amcApiKey = process.env.AMC_API_KEY;
if (!amcApiKey) {
  console.error('AMC_API_KEY environment variable is required');
  process.exit(1);
}

const amcClient = new AMCClient(amcApiKey);
const mcpTools = new MCPTools(amcClient);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'AMC MCP Server'
  });
});

// MCP Tools endpoints
app.post('/tools/list_theaters', async (req, res) => {
  try {
    const result = await mcpTools.listTheaters(req.body);
    res.json(result);
  } catch (error: any) {
    console.error('Error in list_theaters:', error);
    res.status(400).json({
      error: error.error || 'UNKNOWN_ERROR',
      message: error.message || 'An unknown error occurred'
    });
  }
});

app.post('/tools/list_movies', async (req, res) => {
  try {
    const result = await mcpTools.listMovies(req.body);
    res.json(result);
  } catch (error: any) {
    console.error('Error in list_movies:', error);
    res.status(400).json({
      error: error.error || 'UNKNOWN_ERROR',
      message: error.message || 'An unknown error occurred'
    });
  }
});

app.post('/tools/list_showtimes', async (req, res) => {
  try {
    const result = await mcpTools.listShowtimes(req.body);
    res.json(result);
  } catch (error: any) {
    console.error('Error in list_showtimes:', error);
    res.status(400).json({
      error: error.error || 'UNKNOWN_ERROR',
      message: error.message || 'An unknown error occurred'
    });
  }
});

app.post('/tools/reserve_tickets', async (req, res) => {
  try {
    const result = await mcpTools.reserveTickets(req.body);
    res.json(result);
  } catch (error: any) {
    console.error('Error in reserve_tickets:', error);
    res.status(400).json({
      error: error.error || 'UNKNOWN_ERROR',
      message: error.message || 'An unknown error occurred'
    });
  }
});

// MCP manifest endpoint
app.get('/manifest.json', (req, res) => {
  res.json({
    name: 'amc-mcp-server',
    version: '0.1.0',
    description: 'MCP server for AMC Theatres APIs',
    tools: mcpTools.getToolDefinitions()
  });
});

// API key validation endpoint
app.get('/validate', async (req, res) => {
  try {
    const isValid = await amcClient.validateApiKey();
    res.json({ 
      valid: isValid,
      message: isValid ? 'API key is valid' : 'API key validation failed'
    });
  } catch (error) {
    console.error('Error validating API key:', error);
    res.status(500).json({ 
      valid: false,
      message: 'Failed to validate API key'
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'NOT_FOUND',
    message: `Route ${req.originalUrl} not found`
  });
});

// Global error handler
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'INTERNAL_SERVER_ERROR',
    message: 'An internal server error occurred'
  });
});

// Start server
async function startServer() {
  try {
    // Validate API key on startup
    console.log('Validating AMC API key...');
    const isValid = await amcClient.validateApiKey();
    if (!isValid) {
      console.error('AMC API key validation failed. Please check your API key.');
      process.exit(1);
    }
    console.log('AMC API key validated successfully');

    app.listen(PORT, () => {
      console.log(`🚀 AMC MCP Server running on port ${PORT}`);
      console.log(`📋 Health check: http://localhost:${PORT}/health`);
      console.log(`📋 MCP Manifest: http://localhost:${PORT}/manifest.json`);
      console.log(`🔑 API Validation: http://localhost:${PORT}/validate`);
      console.log(`🎬 Available tools:`);
      mcpTools.getToolDefinitions().forEach(tool => {
        console.log(`   - ${tool.name}: ${tool.description}`);
      });
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

startServer(); 