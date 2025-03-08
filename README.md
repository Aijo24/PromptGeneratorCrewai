# AI Prompt Generator

A web application that generates AI agent prompts using CrewAI.

## Overview

This application allows users to generate structured prompts for AI agents by providing a basic description of their project. It uses CrewAI to create tailored prompts for various team roles and tasks.

## Features

- User-friendly interface built with React and Material UI
- Prompt generation using CrewAI framework
- Responsive design for all devices
- Project planning capabilities

## Technology Stack

- **Backend**: Flask (Python)
- **Frontend**: React with Material UI
- **AI Framework**: CrewAI

## Installation and Setup

### Prerequisites

- Python 3.8+
- Node.js 14+ and npm
- OpenAI API key

### Backend Setup

1. Clone the repository:
   ```
   git clone [repository-url]
   cd [repository-name]
   ```

2. Create and activate a virtual environment:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows, use: venv\Scripts\activate
   ```

3. Install the required Python packages:
   ```
   pip install -r requirements.txt
   ```

4. Set your OpenAI API key:
   ```
   export OPENAI_API_KEY="your-api-key-here"  # On Windows, use: set OPENAI_API_KEY="your-api-key-here"
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd frontend/prompt-generator
   ```

2. Install the required npm packages:
   ```
   npm install
   ```

3. Build the React application for production:
   ```
   npm run build
   ```

## Running the Application

1. Start the Flask application from the project root using the provided script:
   ```
   ./run.sh
   ```
   
   Or manually:
   ```
   python app.py
   ```

2. Open your browser and navigate to:
   ```
   http://localhost:8080
   ```

## Development

### Running the Frontend in Development Mode

1. Navigate to the frontend directory:
   ```
   cd frontend/prompt-generator
   ```

2. Start the development server:
   ```
   npm start
   ```

3. The React development server will run on port 3000 and proxy API requests to the Flask backend on port 8081.

## Usage

1. Enter a description of your project in the text area.
2. Click the "Generate Prompts" button.
3. View the generated prompts for different AI agent roles.
4. Copy the prompts to use with your AI agents.

## License

[MIT License](LICENSE) 