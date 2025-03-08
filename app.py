import os
from flask import Flask, render_template, request, jsonify, send_from_directory
from flask_cors import CORS
from crewai import Agent, Task, Crew
from getpass import getpass
import logging
import json

app = Flask(__name__, static_folder='frontend/prompt-generator/build', static_url_path='')
CORS(app)  # Enable CORS for all routes

# Configure logging
logging.basicConfig(level=logging.INFO)

# Try to get API key from environment variable, or set it to an empty string
api_key = os.environ.get("OPENAI_API_KEY", "")
os.environ["OPENAI_MODEL"] = "gpt-4o-mini"

# Helper function to extract content from CrewOutput objects
def process_crew_output(crew_output):
    if crew_output is None:
        return "No output generated."
    
    try:
        # First attempt to get the raw output
        result = str(crew_output)
        
        # Try to extract more meaningful information if available
        # Different versions of CrewAI might have different attributes
        for attr in ['raw_output', 'result', 'output', 'value', 'content']:
            if hasattr(crew_output, attr):
                value = getattr(crew_output, attr)
                if value:
                    return str(value)
        
        return result
    except Exception as e:
        app.logger.error(f"Error processing CrewOutput: {str(e)}")
        return str(crew_output)

def create_project_plan(project_requirements):
    # Project Manager Agent
    project_manager = Agent(
        role="Project Manager",
        goal=(
            "Oversee the app development by coordinating multiple AI agents, managing schedules, "
            "allocating resources, and ensuring milestones are met on time and within scope."
        ),
        backstory=(
            "With over 10 years of experience in technology project management, I have successfully led "
            "cross-functional teams in building innovative software solutions. My expertise includes agile "
            "methodologies, risk management, and strategic planning, ensuring projects deliver optimum "
            "quality while adhering to deadlines and budgets."
        ),
        verbose=True,
        llm="gpt-4o-mini",
    )

    # Project Planning Task
    planning_task = Task(
        agent=project_manager,
        description=(
            f"Analyze the following project requirements and create a detailed project plan:\n\n"
            f"{project_requirements}\n\n"
            "The plan should include: 1) Major milestones and timeline, 2) Resource allocation, "
            "3) Tasks for different phases (design, implementation, testing, deployment), "
            "4) Roles and responsibilities. Make the plan specific enough for other agents to use."
        ),
        expected_output=(
            "A comprehensive project plan that includes milestones, resource allocation details, "
            "and specific tasks for each development phase."
        ),
    )

    # Create planning crew
    planning_crew = Crew(
        agents=[project_manager],
        tasks=[planning_task],
        verbose=True
    )

    # Run planning task
    project_plan = planning_crew.kickoff()
    return project_plan

def create_ai_prompts(project_plan):
    # Prompt Engineer Agent
    prompt_engineer = Agent(
        role="Prompt Engineer",
        goal=(
            "Create effective, detailed AI prompts for each task in the project plan that will "
            "guide various AI systems to produce high-quality outputs aligned with project requirements."
        ),
        backstory=(
            "As an expert prompt engineer with deep understanding of AI language models, "
            "I have crafted thousands of prompts that effectively guide AI systems to produce "
            "precise, relevant, and creative outputs. I understand how to structure prompts with "
            "the right context, constraints, and instructions to get optimal results for different use cases."
        ),
        verbose=True,
        llm="gpt-4o-mini",
    )

    # Prompt Engineering Task
    prompt_engineering_task = Task(
        agent=prompt_engineer,
        description=(
            f"Based on this project plan:\n\n{project_plan}\n\n"
            "Create detailed AI prompts for each main task in the plan. Each prompt should contain: "
            "1) Context about the project and task, 2) Clear instructions on what output is needed, "
            "3) Constraints and requirements, 4) Evaluation criteria for good output, and 5) Examples "
            "of desired outputs where appropriate."
        ),
        expected_output=(
            "A collection of well-crafted AI prompts for each task in the project plan, ready to be used "
            "by AI systems or agents to execute the project tasks effectively."
        ),
    )

    # Create prompt engineering crew
    prompt_crew = Crew(
        agents=[prompt_engineer],
        tasks=[prompt_engineering_task],
        verbose=True
    )

    # Run prompt engineering task
    ai_prompts = prompt_crew.kickoff()
    return ai_prompts

@app.route('/api/health')
def health_check():
    return jsonify({
        'status': 'ok', 
        'message': 'API is running',
        'static_folder': app.static_folder,
        'static_folder_exists': os.path.exists(app.static_folder),
        'index_html_exists': os.path.exists(os.path.join(app.static_folder, 'index.html'))
    })

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(app.static_folder + '/' + path):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

@app.route('/api/key')
def get_api_key():
    return jsonify({'api_key': api_key})

@app.route('/api/generate-prompts', methods=['POST'])
def generate_prompts():
    # Get the OpenAI API key and project requirements from the form
    api_key = request.form.get('api_key', '')
    project_requirements = request.form.get('project_requirements', '')
    
    # Check if we have the required information
    if not api_key or not project_requirements:
        return jsonify({
            'error': 'OpenAI API key and project requirements are required'
        }), 400
    
    # Set the API key in the environment
    os.environ["OPENAI_API_KEY"] = api_key
    
    try:
        # Generate the project plan
        project_plan_output = create_project_plan(project_requirements)
        
        # Process the CrewOutput object to extract meaningful content
        project_plan = process_crew_output(project_plan_output)
        
        # Generate the AI prompts
        ai_prompts_output = create_ai_prompts(project_plan)
        
        # Process the CrewOutput object to extract meaningful content
        ai_prompts = process_crew_output(ai_prompts_output)
        
        # Return the results as strings (which are JSON serializable)
        return jsonify({
            'project_plan': project_plan,
            'ai_prompts': ai_prompts
        })
    except Exception as e:
        error_message = str(e)
        if "APIError: OpenAIException - Connection error" in error_message:
            # Handle connection error specifically
            error_message = "Could not connect to OpenAI API. Please check your internet connection and verify your API key is correct."
            app.logger.error(f"OpenAI API connection error: {str(e)}")
        elif "Incorrect API key" in error_message or "Invalid API key" in error_message:
            error_message = "Invalid OpenAI API key provided. Please check your API key and try again."
            app.logger.error(f"Invalid API key error: {str(e)}")
        elif "Rate limit" in error_message:
            error_message = "OpenAI API rate limit exceeded. Please try again later."
            app.logger.error(f"Rate limit error: {str(e)}")
        elif "Object of type CrewOutput is not JSON serializable" in error_message:
            error_message = "Error processing the AI response. This has been fixed. Please try again."
            app.logger.error(f"JSON serialization error: {str(e)}")
        else:
            app.logger.error(f"Error during prompt generation: {str(e)}")
        
        return jsonify({
            'error': error_message
        }), 500

@app.route('/api/validate-key', methods=['POST'])
def validate_api_key():
    # Get the OpenAI API key from the form
    api_key = request.form.get('api_key', '')
    
    if not api_key:
        return jsonify({
            'valid': False,
            'message': 'API key is required'
        }), 400
    
    # Set the API key in the environment
    os.environ["OPENAI_API_KEY"] = api_key
    
    try:
        # Create a minimal agent to test the API key
        test_agent = Agent(
            role="Tester",
            goal="Test the API key validity",
            backstory="I am a test agent used to verify API key validity.",
            verbose=True,
            llm="gpt-4o-mini",
        )
        
        # Create a minimal task that should be quick to execute
        test_task = Task(
            agent=test_agent,
            description="Respond with 'API key is valid' if you can read this message.",
            expected_output="A simple confirmation message."
        )
        
        # Create a minimal crew
        test_crew = Crew(
            agents=[test_agent],
            tasks=[test_task],
            verbose=False
        )
        
        # Run a quick test - this will fail fast if the API key is invalid
        # Use our helper function to process the CrewOutput object
        result = test_crew.kickoff()
        processed_result = process_crew_output(result)
        
        return jsonify({
            'valid': True,
            'message': 'API key is valid'
        })
    except Exception as e:
        error_message = str(e)
        app.logger.error(f"API key validation error: {error_message}")
        
        if "APIError: OpenAIException - Connection error" in error_message:
            message = "Could not connect to OpenAI API. Please check your internet connection."
        elif "Incorrect API key" in error_message or "Invalid API key" in error_message:
            message = "Invalid API key provided. Please check your API key and try again."
        elif "Rate limit" in error_message:
            message = "OpenAI API rate limit exceeded. Please try again later."
        elif "Object of type CrewOutput is not JSON serializable" in error_message:
            message = "Error processing the AI response. Please try again."
        else:
            message = f"Error validating API key: {error_message}"
        
        return jsonify({
            'valid': False,
            'message': message
        }), 400

if __name__ == '__main__':
    print(f"Static folder: {app.static_folder}")
    print(f"Static folder exists: {os.path.exists(app.static_folder)}")
    print(f"Index.html exists: {os.path.exists(os.path.join(app.static_folder, 'index.html'))}")
    app.run(debug=True, host='0.0.0.0', port=8080) 