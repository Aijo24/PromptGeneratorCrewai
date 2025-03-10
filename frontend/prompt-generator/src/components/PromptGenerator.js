import React, { useState, useEffect } from 'react';
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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  InputAdornment,
  Tooltip,
  Avatar,
  Chip,
  Divider,
} from '@mui/material';
import ReactMarkdown from 'react-markdown';
import SendIcon from '@mui/icons-material/Send';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import GitHubIcon from '@mui/icons-material/GitHub';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import RefreshIcon from '@mui/icons-material/Refresh';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';

// Configure axios to include credentials in requests
axios.defaults.withCredentials = true;

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
  const [repositories, setRepositories] = useState([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [repoError, setRepoError] = useState('');
  const [githubUser, setGithubUser] = useState('');
  
  // GitHub OAuth state
  const [githubAuthLoading, setGithubAuthLoading] = useState(true);
  const [githubAuth, setGithubAuth] = useState({
    authenticated: false,
    user: null,
    avatar_url: null,
    html_url: null
  });
  const [loginError, setLoginError] = useState('');
  
  // Check if user is already authenticated with GitHub on page load
  useEffect(() => {
    checkGithubAuth();
    
    // Check URL parameters for login errors
    const urlParams = new URLSearchParams(window.location.search);
    const loginStatus = urlParams.get('login');
    const loginError = urlParams.get('error');
    
    if (loginError) {
      setLoginError(`Login failed: ${loginError}`);
    } else if (loginStatus === 'success') {
      // Clean up URL parameters
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, []);
  
  // Check GitHub authentication status
  const checkGithubAuth = async () => {
    setGithubAuthLoading(true);
    
    try {
      const response = await axios.get('/api/github/user');
      
      if (response.data.authenticated) {
        setGithubAuth({
          authenticated: true,
          user: response.data.user,
          avatar_url: response.data.avatar_url,
          html_url: response.data.html_url
        });
        
        // Automatically check for repositories
        fetchRepositories();
        
        // Enable issue creation by default when logged in
        setCreateGithubIssues(true);
      } else {
        setGithubAuth({
          authenticated: false,
          user: null,
          avatar_url: null,
          html_url: null
        });
      }
    } catch (err) {
      console.error('Failed to check GitHub authentication status:', err);
      setGithubAuth({
        authenticated: false,
        user: null,
        avatar_url: null,
        html_url: null
      });
    } finally {
      setGithubAuthLoading(false);
    }
  };
  
  // Handle GitHub login button click
  const handleGithubLogin = async () => {
    setLoginError('');
    
    try {
      const response = await axios.get('/api/github/login');
      
      if (response.data.auth_url) {
        // Redirect to GitHub OAuth authorization
        window.location.href = response.data.auth_url;
      }
    } catch (err) {
      console.error('Failed to initiate GitHub login:', err);
      setLoginError('Failed to initiate GitHub login. Please try again.');
    }
  };
  
  // Handle GitHub logout button click
  const handleGithubLogout = async () => {
    try {
      await axios.get('/api/github/logout');
      setGithubAuth({
        authenticated: false,
        user: null,
        avatar_url: null,
        html_url: null
      });
      setRepositories([]);
      setGithubRepo('');
      setGithubUser('');
      setCreateGithubIssues(false);
    } catch (err) {
      console.error('Failed to logout from GitHub:', err);
    }
  };

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

  const fetchRepositories = async (token = null) => {
    setLoadingRepos(true);
    setRepoError('');
    
    try {
      const formData = new FormData();
      
      // Use token parameter if provided, otherwise rely on session token from OAuth
      if (token) {
        formData.append('github_token', token);
      }
      
      const response = await axios.post('/api/github/repos', formData);
      
      if (response.data.success) {
        setRepositories(response.data.repositories);
        setGithubUser(response.data.user);
        
        // If there are repositories, set the first one as default selection
        if (response.data.repositories.length > 0) {
          setGithubRepo(response.data.repositories[0].full_name);
        } else {
          setRepoError('No repositories found with issue creation permissions.');
        }
        
        // Handle warnings
        if (response.data.warnings && response.data.warnings.length > 0) {
          setRepoError(response.data.warnings.join(' '));
        }
      } else {
        setRepoError(response.data.message || 'Failed to fetch repositories.');
      }
    } catch (err) {
      console.error('Error fetching repositories:', err);
      
      if (err.response) {
        setRepoError(err.response.data.message || 'Failed to fetch repositories.');
      } else if (err.request) {
        setRepoError('Network error: Unable to connect to the server.');
      } else {
        setRepoError('An unexpected error occurred while fetching repositories.');
      }
    } finally {
      setLoadingRepos(false);
    }
  };
  
  // Handle GitHub token change
  const handleGithubTokenChange = (e) => {
    const newToken = e.target.value;
    setGithubToken(newToken);
    
    // Clear repositories when token changes
    if (!newToken) {
      setRepositories([]);
      setGithubRepo('');
      setGithubUser('');
    }
  };

  // Handle GitHub token blur - fetch repositories when user finishes typing token
  const handleGithubTokenBlur = () => {
    if (githubToken) {
      fetchRepositories(githubToken);
    }
  };

  // Refresh repositories list
  const handleRefreshRepos = () => {
    if (githubToken) {
      fetchRepositories(githubToken);
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
    
    if (createGithubIssues && !githubAuth.authenticated && !githubToken) {
      setError('Please log in with GitHub or enter a GitHub token to create issues');
      setLoading(false);
      return;
    }
    
    if (createGithubIssues && !githubRepo) {
      setError('Please select a GitHub repository');
      setLoading(false);
      return;
    }
    
    // Create form data
    const formData = new FormData();
    formData.append('api_key', apiKey);
    formData.append('project_requirements', projectRequirements);
    formData.append('create_issues', createGithubIssues.toString());
    
    // Only include token if manually entered (not using OAuth)
    if (createGithubIssues && !githubAuth.authenticated && githubToken) {
      formData.append('github_token', githubToken);
    }
    
    if (createGithubIssues) {
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
          
          {githubIssues.issues_created && githubIssues.issues_created.length > 0 && (
            <>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Issues Created Before Error:
              </Typography>
              <List>
                {githubIssues.issues_created.map((issue, index) => (
                  <ListItem key={`created-${index}`} divider={index < githubIssues.issues_created.length - 1}>
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
            </>
          )}
          
          {githubIssues.issues_failed && githubIssues.issues_failed.length > 0 && (
            <>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Issues That Failed:
              </Typography>
              <List>
                {githubIssues.issues_failed.map((issue, index) => (
                  <ListItem key={`failed-${index}`} divider={index < githubIssues.issues_failed.length - 1}>
                    <ListItemIcon>
                      <ErrorIcon color="error" />
                    </ListItemIcon>
                    <ListItemText
                      primary={issue.title}
                      secondary={issue.error}
                    />
                  </ListItem>
                ))}
              </List>
            </>
          )}
          
          <Typography variant="body1" sx={{ mt: 3 }}>
            <strong>How to fix this:</strong>
          </Typography>
          <List>
            <ListItem>
              <ListItemIcon>
                <GitHubIcon />
              </ListItemIcon>
              <ListItemText primary="Use a classic token, not a fine-grained token" secondary="Fine-grained tokens often don't have the necessary permissions for issue creation." />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <GitHubIcon />
              </ListItemIcon>
              <ListItemText primary="Ensure the 'repo' scope is selected" secondary="When creating your token, make sure to check the full 'repo' scope checkbox." />
            </ListItem>
          </List>
        </Box>
      );
    }
    
    if (githubIssues.partial) {
      return (
        <Box sx={{ mt: 2 }}>
          <Alert severity="warning" sx={{ mb: 2 }}>
            {githubIssues.message}
          </Alert>
          
          <Typography variant="h6" gutterBottom>
            Successfully Created Issues:
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
          
          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
            Issues That Failed:
          </Typography>
          <List>
            {githubIssues.issues_failed.map((issue, index) => (
              <ListItem key={`failed-${index}`} divider={index < githubIssues.issues_failed.length - 1}>
                <ListItemIcon>
                  <ErrorIcon color="error" />
                </ListItemIcon>
                <ListItemText
                  primary={issue.title}
                  secondary={issue.error}
                />
              </ListItem>
            ))}
          </List>
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

  // Render repository selection
  const renderRepositorySelect = () => {
    if (!githubToken) {
      return null;
    }
    
    const isFineGrainedToken = repoError && repoError.includes("fine-grained token");
    
    return (
      <>
        {isFineGrainedToken && (
          <Alert severity="warning" sx={{ mt: 2, mb: 2 }}>
            <Typography variant="subtitle2">
              Fine-grained token detected
            </Typography>
            <Typography variant="body2">
              Fine-grained tokens typically don't work for issue creation. Please use a classic token with the 'repo' scope instead.
            </Typography>
          </Alert>
        )}
        
        <FormControl fullWidth margin="normal" size="small">
          <InputLabel id="github-repo-label">GitHub Repository</InputLabel>
          <Select
            labelId="github-repo-label"
            value={githubRepo}
            onChange={(e) => setGithubRepo(e.target.value)}
            label="GitHub Repository"
            disabled={loadingRepos || repositories.length === 0}
            endAdornment={
              <InputAdornment position="end">
                <Tooltip title="Refresh repositories">
                  <IconButton 
                    edge="end" 
                    onClick={handleRefreshRepos}
                    disabled={loadingRepos || !githubToken}
                  >
                    {loadingRepos ? <CircularProgress size={24} /> : <RefreshIcon />}
                  </IconButton>
                </Tooltip>
              </InputAdornment>
            }
          >
            {repositories.map((repo) => (
              <MenuItem key={repo.full_name} value={repo.full_name}>
                {repo.full_name}
                {!repo.has_issues && " (Issues disabled)"}
              </MenuItem>
            ))}
          </Select>
          {githubUser && (
            <Typography variant="caption" color="text.secondary">
              Connected as {githubUser}
            </Typography>
          )}
          {repoError && (
            <Typography variant="caption" color="error">
              {repoError}
            </Typography>
          )}
        </FormControl>
      </>
    );
  };

  // Render GitHub authentication section
  const renderGithubAuth = () => {
    if (githubAuthLoading) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
          <CircularProgress size={24} sx={{ mr: 2 }} />
          <Typography variant="body2">Checking GitHub authentication...</Typography>
        </Box>
      );
    }
    
    if (githubAuth.authenticated) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, mb: 2 }}>
          <Chip
            avatar={<Avatar alt={githubAuth.user} src={githubAuth.avatar_url} />}
            label={`Logged in as ${githubAuth.user}`}
            variant="outlined"
            color="primary"
            onDelete={handleGithubLogout}
            deleteIcon={<LogoutIcon />}
            sx={{ mr: 2 }}
          />
          <Link href={githubAuth.html_url} target="_blank" rel="noopener noreferrer">
            <Typography variant="body2">View Profile</Typography>
          </Link>
        </Box>
      );
    }
    
    return (
      <Box sx={{ mt: 2, mb: 2 }}>
        <Button
          variant="outlined"
          startIcon={<GitHubIcon />}
          onClick={handleGithubLogin}
          sx={{ mr: 2 }}
        >
          Login with GitHub
        </Button>
        
        <Typography variant="caption" color="text.secondary">
          Recommended for easier repository access
        </Typography>
        
        {loginError && (
          <Alert severity="error" sx={{ mt: 1 }}>
            {loginError}
          </Alert>
        )}
        
        <Divider sx={{ my: 2 }}>
          <Typography variant="caption" color="text.secondary">OR</Typography>
        </Divider>
      </Box>
    );
  };

  // Render GitHub section (for issue creation)
  const renderGithubSection = () => {
    return (
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
            {renderGithubAuth()}
            
            {!githubAuth.authenticated && (
              <TextField
                label="GitHub Token"
                type="password"
                fullWidth
                margin="normal"
                value={githubToken}
                onChange={handleGithubTokenChange}
                onBlur={handleGithubTokenBlur}
                helperText="Your GitHub personal access token with repo scope"
                size="small"
              />
            )}
            
            {renderRepositorySelect()}
          </>
        )}
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
          
          {renderGithubSection()}
          
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