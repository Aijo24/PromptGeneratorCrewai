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
  FormControlLabel,
  Checkbox,
  Link,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import ReactMarkdown from 'react-markdown';
import SendIcon from '@mui/icons-material/Send';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import GitHubIcon from '@mui/icons-material/GitHub';
import TaskAltIcon from '@mui/icons-material/TaskAlt';

const PromptGenerator = () => {
  const [apiKey, setApiKey] = useState('');
  const [projectRequirements, setProjectRequirements] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [apiKeyStatus, setApiKeyStatus] = useState({ checked: false, valid: false, message: '' });
  const [results, setResults] = useState({
    projectPlan: '',
    aiPrompts: '',
    githubIssues: null,
  });
  const [activeTab, setActiveTab] = useState(0);
  const [createGithubIssues, setCreateGithubIssues] = useState(false);
  const [githubToken, setGithubToken] = useState('');
  const [githubRepo, setGithubRepo] = useState('');

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
    
    if (createGithubIssues) {
      if (!githubToken) {
        setError('Please enter your GitHub token to create issues');
        setLoading(false);
        return;
      }
      
      if (!githubRepo) {
        setError('Please enter your GitHub repository in the format "username/repo"');
        setLoading(false);
        return;
      }
    }
    
    // Create form data
    const formData = new FormData();
    formData.append('api_key', apiKey);
    formData.append('project_requirements', projectRequirements);
    formData.append('create_issues', createGithubIssues.toString());
    
    if (createGithubIssues) {
      formData.append('github_token', githubToken);
      formData.append('github_repo', githubRepo);
    }
    
    try {
      const response = await axios.post('/api/generate-prompts', formData);
      
      setResults({
        projectPlan: response.data.project_plan,
        aiPrompts: response.data.ai_prompts,
        githubIssues: response.data.github_issues || null,
      });
      
      setActiveTab(0); // Switch to project plan tab after successful generation
      
      // If GitHub issues were created successfully, switch to the GitHub issues tab
      if (response.data.github_issues && response.data.github_issues.success) {
        setActiveTab(2);
      }
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

  // Render GitHub issues tab content
  const renderGitHubIssuesTab = () => {
    const { githubIssues } = results;
    
    if (!githubIssues) {
      return (
        <Box sx={{ mt: 2, p: 2 }}>
          <Typography variant="body1" color="text.secondary">
            Enable "Create GitHub Issues" to automatically create issues for each task in your project plan.
          </Typography>
        </Box>
      );
    }
    
    if (!githubIssues.success) {
      return (
        <Box sx={{ mt: 2 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {githubIssues.message}
          </Alert>
        </Box>
      );
    }
    
    return (
      <Box sx={{ mt: 2 }}>
        <Alert severity="success" sx={{ mb: 2 }}>
          {githubIssues.message}
        </Alert>
        
        <Typography variant="h6" gutterBottom>
          Created Issues:
        </Typography>
        
        <List>
          {githubIssues.issues.map((issue, index) => (
            <ListItem key={index} divider={index < githubIssues.issues.length - 1}>
              <ListItemIcon>
                <TaskAltIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Link href={issue.url} target="_blank" rel="noopener noreferrer">
                    #{issue.number}: {issue.title}
                  </Link>
                }
                secondary={`Assignee: ${issue.assignee}`}
              />
            </ListItem>
          ))}
        </List>
      </Box>
    );
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        AI Prompt Generator
      </Typography>
      <Typography variant="subtitle1" gutterBottom align="center" sx={{ mb: 4 }}>
        Generate AI agent prompts for your project
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Generate Prompts
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            label="OpenAI API Key"
            type="password"
            fullWidth
            margin="normal"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            helperText="Your API key is only used for this request and never stored"
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
            multiline
            rows={8}
            fullWidth
            margin="normal"
            value={projectRequirements}
            onChange={(e) => setProjectRequirements(e.target.value)}
            placeholder="Describe your project and requirements in detail..."
          />
          
          <Box sx={{ mt: 2, mb: 2 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={createGithubIssues}
                  onChange={(e) => setCreateGithubIssues(e.target.checked)}
                  icon={<GitHubIcon />}
                  checkedIcon={<GitHubIcon />}
                />
              }
              label="Create GitHub Issues"
            />
            
            {createGithubIssues && (
              <>
                <TextField
                  label="GitHub Repository"
                  fullWidth
                  margin="normal"
                  value={githubRepo}
                  onChange={(e) => setGithubRepo(e.target.value)}
                  helperText="Enter in the format 'username/repository'"
                  size="small"
                />
                <TextField
                  label="GitHub Token"
                  type="password"
                  fullWidth
                  margin="normal"
                  value={githubToken}
                  onChange={(e) => setGithubToken(e.target.value)}
                  helperText="Your GitHub personal access token with repo scope"
                  size="small"
                />
              </>
            )}
          </Box>
          
          <Button
            type="submit"
            variant="contained"
            color="primary"
            size="large"
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
            disabled={loading}
            sx={{ mt: 2 }}
          >
            {loading ? 'Generating...' : 'Generate Prompts'}
          </Button>
        </form>
      </Paper>

      {(results.projectPlan || results.aiPrompts || results.githubIssues) && (
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h5" gutterBottom>
            Results
          </Typography>
          
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs 
              value={activeTab} 
              onChange={handleTabChange} 
              aria-label="result tabs"
              variant="fullWidth"
            >
              <Tab label="Project Plan" id="tab-0" />
              <Tab label="AI Prompts" id="tab-1" />
              <Tab label="GitHub Issues" id="tab-2" />
            </Tabs>
          </Box>
          
          <div role="tabpanel" hidden={activeTab !== 0}>
            {activeTab === 0 && (
              <>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                  <Button 
                    startIcon={<ContentCopyIcon />} 
                    onClick={() => handleCopy(results.projectPlan)}
                    size="small"
                  >
                    Copy
                  </Button>
                </Box>
                <Box sx={{ backgroundColor: '#f5f5f5', p: 2, borderRadius: 1 }}>
                  <ReactMarkdown>{results.projectPlan}</ReactMarkdown>
                </Box>
              </>
            )}
          </div>
          
          <div role="tabpanel" hidden={activeTab !== 1}>
            {activeTab === 1 && (
              <>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                  <Button 
                    startIcon={<ContentCopyIcon />} 
                    onClick={() => handleCopy(results.aiPrompts)}
                    size="small"
                  >
                    Copy
                  </Button>
                </Box>
                <Box sx={{ backgroundColor: '#f5f5f5', p: 2, borderRadius: 1 }}>
                  <ReactMarkdown>{results.aiPrompts}</ReactMarkdown>
                </Box>
              </>
            )}
          </div>
          
          <div role="tabpanel" hidden={activeTab !== 2}>
            {activeTab === 2 && renderGitHubIssuesTab()}
          </div>
        </Paper>
      )}
    </Box>
  );
};

export default PromptGenerator; 