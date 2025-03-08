import React, { useState } from 'react';
import axios from 'axios';
import {
  Box,
  TextField,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Divider,
} from '@mui/material';
import ReactMarkdown from 'react-markdown';
import SendIcon from '@mui/icons-material/Send';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';

const PromptGenerator = () => {
  const [apiKey, setApiKey] = useState('');
  const [projectRequirements, setProjectRequirements] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [apiKeyStatus, setApiKeyStatus] = useState({ checked: false, valid: false, message: '' });
  const [results, setResults] = useState({
    projectPlan: '',
    aiPrompts: '',
  });
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text).then(
      () => {
        // Success
        alert('Copied to clipboard!');
      },
      (err) => {
        // Error
        console.error('Could not copy text: ', err);
      }
    );
  };

  const handleValidateApiKey = async () => {
    if (!apiKey) {
      setApiKeyStatus({ checked: true, valid: false, message: 'Please enter an API key' });
      return;
    }

    setLoading(true);
    setError('');
    setApiKeyStatus({ checked: false, valid: false, message: '' });

    // Create form data
    const formData = new FormData();
    formData.append('api_key', apiKey);

    try {
      const response = await axios.post('/api/validate-key', formData);
      setApiKeyStatus({ 
        checked: true, 
        valid: response.data.valid, 
        message: response.data.message 
      });
    } catch (err) {
      console.error('Error validating API key:', err);
      
      if (err.response) {
        setApiKeyStatus({ 
          checked: true, 
          valid: false, 
          message: err.response.data.message || 'Failed to validate API key' 
        });
      } else if (err.request) {
        setApiKeyStatus({ 
          checked: true, 
          valid: false, 
          message: 'Network error: Unable to connect to the server. Please check your internet connection.' 
        });
      } else {
        setApiKeyStatus({ 
          checked: true, 
          valid: false, 
          message: 'An unexpected error occurred while validating the API key.' 
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Validate inputs
    if (!apiKey) {
      setError('Please enter your OpenAI API key');
      setLoading(false);
      return;
    }
    
    if (!projectRequirements) {
      setError('Please enter your project requirements');
      setLoading(false);
      return;
    }
    
    // Create form data
    const formData = new FormData();
    formData.append('api_key', apiKey);
    formData.append('project_requirements', projectRequirements);
    
    try {
      const response = await axios.post('/api/generate-prompts', formData);
      setResults({
        projectPlan: response.data.project_plan,
        aiPrompts: response.data.ai_prompts,
      });
      setActiveTab(0); // Switch to project plan tab after successful generation
    } catch (err) {
      console.error('Error:', err);
      
      // Handle different types of errors
      if (err.response) {
        // The request was made and the server responded with an error
        setError(err.response.data.error || 'An error occurred during prompt generation');
      } else if (err.request) {
        // The request was made but no response was received (network error)
        setError('Network error: Unable to connect to the server. Please check your internet connection and try again.');
      } else {
        // Something else caused the error
        setError('An unexpected error occurred. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        AI-Powered Project Prompt Generator
      </Typography>
      <Typography variant="subtitle1" gutterBottom align="center" sx={{ mb: 4 }}>
        Enter your project requirements and get AI-generated prompts for each task
      </Typography>

      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Generate Prompts
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            label="OpenAI API Key"
            variant="outlined"
            fullWidth
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            margin="normal"
            required
            helperText="Your API key is used securely and not stored"
            InputProps={{
              endAdornment: (
                <Button 
                  variant="outlined" 
                  size="small" 
                  onClick={handleValidateApiKey} 
                  disabled={loading || !apiKey}
                  sx={{ ml: 1 }}
                >
                  Test Key
                </Button>
              )
            }}
          />
          
          {apiKeyStatus.checked && (
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, mb: 2 }}>
              {apiKeyStatus.valid ? (
                <>
                  <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                  <Typography variant="body2" color="success.main">
                    {apiKeyStatus.message}
                  </Typography>
                </>
              ) : (
                <>
                  <ErrorIcon color="error" sx={{ mr: 1 }} />
                  <Typography variant="body2" color="error">
                    {apiKeyStatus.message}
                  </Typography>
                </>
              )}
            </Box>
          )}

          <TextField
            label="Project Requirements"
            variant="outlined"
            fullWidth
            multiline
            rows={6}
            value={projectRequirements}
            onChange={(e) => setProjectRequirements(e.target.value)}
            margin="normal"
            required
            helperText="Be as detailed as possible to get better results"
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            size="large"
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
            disabled={loading}
            sx={{ mt: 2 }}
            fullWidth
          >
            {loading ? 'Generating...' : 'Generate Prompts'}
          </Button>
        </form>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      {(results.projectPlan || results.aiPrompts) && (
        <Paper elevation={3} sx={{ p: 0, mb: 4 }}>
          <Tabs value={activeTab} onChange={handleTabChange} centered>
            <Tab label="Project Plan" />
            <Tab label="AI Prompts" />
          </Tabs>
          <Divider />

          {/* Tab panels */}
          <Box sx={{ p: 3 }} hidden={activeTab !== 0}>
            {results.projectPlan && (
              <Box sx={{ position: 'relative' }}>
                <Button
                  size="small"
                  startIcon={<ContentCopyIcon />}
                  onClick={() => handleCopy(results.projectPlan)}
                  sx={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    zIndex: 1,
                  }}
                >
                  Copy
                </Button>
                <Box sx={{ p: 2, backgroundColor: '#f5f5f5', borderRadius: 1, mt: 4 }}>
                  <ReactMarkdown>{results.projectPlan}</ReactMarkdown>
                </Box>
              </Box>
            )}
          </Box>

          <Box sx={{ p: 3 }} hidden={activeTab !== 1}>
            {results.aiPrompts && (
              <Box sx={{ position: 'relative' }}>
                <Button
                  size="small"
                  startIcon={<ContentCopyIcon />}
                  onClick={() => handleCopy(results.aiPrompts)}
                  sx={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    zIndex: 1,
                  }}
                >
                  Copy
                </Button>
                <Box sx={{ p: 2, backgroundColor: '#f5f5f5', borderRadius: 1, mt: 4 }}>
                  <ReactMarkdown>{results.aiPrompts}</ReactMarkdown>
                </Box>
              </Box>
            )}
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default PromptGenerator; 