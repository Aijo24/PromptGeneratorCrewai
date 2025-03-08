import React from 'react';
import { Box, Typography, Paper, List, ListItem, ListItemIcon, ListItemText, Divider } from '@mui/material';
import CodeIcon from '@mui/icons-material/Code';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ScheduleIcon from '@mui/icons-material/Schedule';
import SecurityIcon from '@mui/icons-material/Security';
import PeopleIcon from '@mui/icons-material/People';

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
        <Typography paragraph>
          The AI Prompt Generator is a powerful tool that leverages advanced AI models to transform your project requirements into:
        </Typography>
        <List>
          <ListItem>
            <ListItemIcon>
              <ScheduleIcon color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary="Comprehensive Project Plans" 
              secondary="Detailed plans with milestones, resource allocation, and task assignments"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <AutoAwesomeIcon color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary="AI Task Prompts" 
              secondary="Well-crafted prompts for each task that can be used with AI systems"
            />
          </ListItem>
        </List>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h5" gutterBottom>
          How it works
        </Typography>
        <Typography paragraph>
          Behind the scenes, we use a system of AI agents powered by CrewAI:
        </Typography>
        <List>
          <ListItem>
            <ListItemIcon>
              <PeopleIcon color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary="Project Manager Agent" 
              secondary="Creates a structured project plan based on your requirements"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <CodeIcon color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary="Prompt Engineer Agent" 
              secondary="Designs effective prompts for each task identified in the project plan"
            />
          </ListItem>
        </List>

        <Divider sx={{ my: 3 }} />

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