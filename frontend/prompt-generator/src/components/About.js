import React from 'react';
import { Box, Typography, Paper, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import CodeIcon from '@mui/icons-material/Code';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ScheduleIcon from '@mui/icons-material/Schedule';
import SecurityIcon from '@mui/icons-material/Security';
import PeopleIcon from '@mui/icons-material/People';
import GitHubIcon from '@mui/icons-material/GitHub';

const About = () => {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        About AI Prompt Generator
      </Typography>
      <Typography variant="subtitle1" gutterBottom align="center" sx={{ mb: 4 }}>
        Streamlining project planning and prompt engineering with AI
      </Typography>

      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          What does this tool do?
        </Typography>
        <Typography variant="body1" paragraph>
          The AI Prompt Generator helps you create well-structured project plans and AI prompts for different roles and tasks in your project. It uses CrewAI to generate:
        </Typography>
        <List>
          <ListItem>
            <ListItemIcon>
              <AutoAwesomeIcon color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary="Detailed project plans" 
              secondary="Get a comprehensive project plan with milestones, resource allocations, and task breakdowns." 
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <CodeIcon color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary="AI prompts for each task" 
              secondary="Receive specific, well-crafted prompts that you can use with AI systems to execute each task in your project." 
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <GitHubIcon color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary="GitHub issues integration" 
              secondary="Automatically create GitHub issues for each task in your project plan, complete with detailed prompts for each assignee." 
            />
          </ListItem>
        </List>
      </Paper>

      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          How it works
        </Typography>
        <Typography variant="body1" paragraph>
          Our system uses CrewAI, a framework for orchestrating role-playing AI agents. When you submit your project requirements:
        </Typography>
        <List>
          <ListItem>
            <ListItemIcon>
              <PeopleIcon color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary="Project Manager Agent" 
              secondary="First, a Project Manager agent analyzes your requirements and creates a detailed project plan." 
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <CodeIcon color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary="Prompt Engineer Agent" 
              secondary="Next, a Prompt Engineer agent takes the project plan and creates specific prompts for each task." 
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <GitHubIcon color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary="GitHub Issues Agent" 
              secondary="Finally, if enabled, a GitHub Issues agent creates detailed issues in your repository with task-specific prompts." 
            />
          </ListItem>
        </List>
      </Paper>

      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          GitHub Integration Guide
        </Typography>
        <Typography variant="body1" paragraph>
          To use the GitHub issues feature, you'll need to:
        </Typography>
        <List>
          <ListItem>
            <ListItemIcon>
              <GitHubIcon color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary="Create a Personal Access Token (PAT)" 
              secondary={
                <>
                  Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token. 
                  Make sure to select the "repo" scope to allow issue creation. Without this scope, you'll get permission errors.
                </>
              }
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <GitHubIcon color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary="Specify your repository" 
              secondary={
                <>
                  Enter your repository in the format "username/repository". For example: "your-username/project-name". 
                  You must have access to create issues in this repository, and it must exist.
                </>
              }
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <SecurityIcon color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary="Keep your token secure" 
              secondary="Your token is like a password. We don't store it, but transmit it securely only when creating issues." 
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <AutoAwesomeIcon color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary="Check the 'Create GitHub Issues' option" 
              secondary="Enable this option in the prompt generator form, enter your repository name and token to automatically create issues." 
            />
          </ListItem>
        </List>
      </Paper>

      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Privacy and Security
        </Typography>
        <List>
          <ListItem>
            <ListItemIcon>
              <SecurityIcon color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary="Your data is secure" 
              secondary="We don't store your API keys or project information. All processing is done in the current session only."
            />
          </ListItem>
        </List>
      </Paper>

      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Troubleshooting Common Issues
        </Typography>
        
        <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>
          Connection Errors
        </Typography>
        <Typography variant="body1" paragraph>
          If you're experiencing connection errors when using the OpenAI API, try these steps:
        </Typography>
        <List>
          <ListItem>
            <ListItemIcon>
              <CodeIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Verify your API key" 
              secondary="Ensure you're using a valid OpenAI API key with sufficient credits. You can check your API key in the OpenAI dashboard." 
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <SecurityIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Check your network connection" 
              secondary="Make sure your internet connection is stable and that you don't have any firewall or proxy settings blocking the connection to OpenAI's servers." 
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <ScheduleIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Check OpenAI status" 
              secondary="Verify that OpenAI services are operational by checking their status page at status.openai.com." 
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <AutoAwesomeIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Try again later" 
              secondary="If the issue persists, OpenAI might be experiencing high traffic or temporary service disruptions. Try again in a few minutes." 
            />
          </ListItem>
        </List>
      </Paper>

      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom>
          Get Started
        </Typography>
        <Typography paragraph>
          To begin generating project plans and AI prompts:
        </Typography>
        <List sx={{ listStyleType: 'decimal', pl: 4 }}>
          <ListItem sx={{ display: 'list-item' }}>
            <ListItemText primary="Enter your OpenAI API key" />
          </ListItem>
          <ListItem sx={{ display: 'list-item' }}>
            <ListItemText primary="Describe your project requirements in detail" />
          </ListItem>
          <ListItem sx={{ display: 'list-item' }}>
            <ListItemText primary="Click 'Generate Prompts' and wait for the AI to work its magic" />
          </ListItem>
          <ListItem sx={{ display: 'list-item' }}>
            <ListItemText primary="View and copy your project plan and task prompts" />
          </ListItem>
        </List>
      </Paper>
    </Box>
  );
};

export default About; 