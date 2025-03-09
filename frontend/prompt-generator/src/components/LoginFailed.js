import React from 'react';
import { Box, Typography, Paper, Button, Alert } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import GitHubIcon from '@mui/icons-material/GitHub';
import ErrorIcon from '@mui/icons-material/Error';

const LoginFailed = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const errorCode = searchParams.get('error') || 'unknown';
  
  const getErrorMessage = (code) => {
    switch (code) {
      case 'invalid_state':
        return 'Session validation failed. This could be due to an expired session or a security issue.';
      case 'bad_verification_code':
        return 'The authorization code was invalid or expired. Please try again.';
      case 'access_denied':
        return 'You denied access to your GitHub account. To use GitHub integration, you need to authorize this application.';
      case 'no_token':
        return 'No access token was received from GitHub. Please try again.';
      case 'server_error':
        return 'An internal server error occurred while processing your request. Please try again later.';
      default:
        return 'An unknown error occurred during GitHub login. Please try again.';
    }
  };
  
  const handleRetry = () => {
    navigate('/');
  };
  
  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      pt: 8 
    }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        GitHub Login Failed
      </Typography>
      
      <Paper elevation={3} sx={{ p: 4, maxWidth: 600, mt: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <ErrorIcon color="error" sx={{ fontSize: 36, mr: 2 }} />
          <Typography variant="h5">
            Unable to complete GitHub login
          </Typography>
        </Box>
        
        <Alert severity="error" sx={{ mb: 3 }}>
          {getErrorMessage(errorCode)}
        </Alert>
        
        <Typography variant="body1" paragraph>
          You can try the following:
        </Typography>
        
        <Box component="ul">
          <Box component="li" sx={{ mb: 1 }}>
            Try logging in again
          </Box>
          <Box component="li" sx={{ mb: 1 }}>
            Use a personal access token instead
          </Box>
          <Box component="li" sx={{ mb: 1 }}>
            Clear your browser cookies and cache, then try again
          </Box>
        </Box>
        
        <Button 
          variant="contained" 
          startIcon={<GitHubIcon />} 
          onClick={handleRetry}
          sx={{ mt: 3 }}
        >
          Return to Homepage
        </Button>
      </Paper>
    </Box>
  );
};

export default LoginFailed; 