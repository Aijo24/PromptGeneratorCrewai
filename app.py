import os
from flask import Flask, render_template, request, jsonify, send_from_directory
from flask_cors import CORS
from crewai import Agent, Task, Crew
from getpass import getpass
import logging
import json
import re
from github import Github, GithubException

app = Flask(__name__, static_folder='frontend/prompt-generator/build', static_url_path='')
CORS(app)  # Enable CORS for all routes

# Configure logging
logging.basicConfig(level=logging.INFO)

# Try to get API key from environment variable, or set it to an empty string
api_key = os.environ.get("OPENAI_API_KEY", "")
github_token = os.environ.get("GITHUB_TOKEN", "")
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

def create_github_issues(project_plan, ai_prompts, repo_name):
    """
    Create GitHub issues for each task in the project plan, with prompts for each agent.
    
    Args:
        project_plan (str): The project plan with tasks
        ai_prompts (str): The AI prompts for each task
        repo_name (str): The GitHub repository name in format "username/repo"
        
    Returns:
        dict: A dictionary with the result status and created issues
    """
    if not github_token:
        app.logger.warning("GitHub token not provided. Issues will not be created.")
        return {
            "success": False,
            "message": "GitHub token not provided. Set the GITHUB_TOKEN environment variable."
        }
    
    if not repo_name:
        app.logger.warning("GitHub repository not provided. Issues will not be created.")
        return {
            "success": False,
            "message": "GitHub repository not specified. Please provide a repository in the format 'username/repo'."
        }
    
    try:
        # Initialize GitHub client
        g = Github(github_token)
        
        try:
            # Try to get the repository
            repo = g.get_repo(repo_name)
            
            # Try to verify access by getting repository info
            _ = repo.full_name
        except GithubException as ge:
            if ge.status == 404:
                return {
                    "success": False,
                    "message": f"Repository '{repo_name}' not found. Please check the repository name."
                }
            elif ge.status == 403:
                return {
                    "success": False,
                    "message": "Your GitHub token doesn't have access to this repository. Make sure you have 'repo' scope enabled on your token and access to the repository."
                }
            else:
                return {
                    "success": False,
                    "message": f"GitHub API error: {str(ge)}. Status code: {ge.status}"
                }
        
        # Extract tasks from project plan
        tasks = extract_tasks_from_plan(project_plan)
        
        if not tasks:
            return {
                "success": False,
                "message": "No tasks could be extracted from the project plan. Unable to create issues."
            }
        
        # Match prompts to tasks
        prompts_by_task = match_prompts_to_tasks(ai_prompts, tasks)
        
        # Create issues
        created_issues = []
        for task in tasks:
            task_title = task.get('title', 'Unnamed Task')
            task_description = task.get('description', '')
            task_assignee = task.get('assignee', '')
            
            # Get prompt for this task
            prompt = prompts_by_task.get(task_title, "No specific prompt available for this task.")
            
            # Create issue body with task description and prompt
            issue_body = f"""
## Task Description
{task_description}

## Assignee
{task_assignee}

## AI Prompt
```
{prompt}
```
            """
            
            try:
                # Create the issue
                issue = repo.create_issue(
                    title=task_title,
                    body=issue_body,
                    labels=["ai-generated", task_assignee]
                )
                
                created_issues.append({
                    "title": task_title,
                    "url": issue.html_url,
                    "assignee": task_assignee,
                    "number": issue.number
                })
            except GithubException as ie:
                app.logger.error(f"Error creating issue '{task_title}': {str(ie)}")
                # Continue with other issues even if one fails
                continue
            
        if not created_issues:
            return {
                "success": False,
                "message": "Failed to create any issues. Please check your GitHub token permissions."
            }
            
        return {
            "success": True,
            "issues": created_issues,
            "message": f"Created {len(created_issues)} issues successfully in {repo_name}."
        }
        
    except GithubException as e:
        app.logger.error(f"GitHub API error: {str(e)}")
        error_message = str(e)
        
        if "Bad credentials" in error_message:
            return {
                "success": False,
                "message": "Invalid GitHub token. Please check your Personal Access Token."
            }
        else:
            return {
                "success": False,
                "message": f"GitHub API error: {str(e)}"
            }
    except Exception as e:
        app.logger.error(f"Error creating GitHub issues: {str(e)}")
        return {
            "success": False,
            "message": f"Error creating GitHub issues: {str(e)}"
        }

def extract_tasks_from_plan(project_plan):
    """Extract tasks from the project plan text"""
    tasks = []
    
    # Try to find tasks in various formats
    # Look for numbered tasks, tasks with headers, or tasks in lists
    task_patterns = [
        r'(?:Task|TASK)\s+\d+:?\s*(.*?)(?=(?:Task|TASK)\s+\d+:|$)',  # Task 1: Do something
        r'(?:\d+\.|\-|\*)\s+(.*?)(?=(?:\d+\.|\-|\*)|$)',  # 1. Do something or - Do something
        r'(?:Milestone|Phase)\s+\d+:?\s*(.*?)(?=(?:Milestone|Phase)\s+\d+:|$)'  # Milestone 1: Planning
    ]
    
    for pattern in task_patterns:
        matches = re.findall(pattern, project_plan, re.DOTALL)
        if matches:
            for match in matches:
                lines = match.strip().split('\n')
                if not lines:
                    continue
                    
                # The first line is the task title
                title = lines[0].strip()
                
                # The rest is the description
                description = '\n'.join(lines[1:]).strip() if len(lines) > 1 else ""
                
                # Try to extract assignee if present
                assignee = "Unassigned"
                assignee_patterns = [
                    r'(?:Assigned to|Assignee|Responsible):\s*(.*?)(?=\n|$)',
                    r'(?:Assigned to|Assignee|Responsible):\s*(.*?)(?=\n|$)'
                ]
                
                for a_pattern in assignee_patterns:
                    a_match = re.search(a_pattern, match, re.IGNORECASE)
                    if a_match:
                        assignee = a_match.group(1).strip()
                        break
                
                tasks.append({
                    "title": title,
                    "description": description,
                    "assignee": assignee
                })
    
    # If no tasks found, try to split by common section markers
    if not tasks:
        sections = re.split(r'\n\s*#+\s*|(?:\n\s*){2,}', project_plan)
        for section in sections:
            if len(section.strip()) > 10:  # Avoid empty or very short sections
                title = section.split('\n')[0].strip()
                description = '\n'.join(section.split('\n')[1:]).strip()
                tasks.append({
                    "title": title,
                    "description": description,
                    "assignee": "Unassigned"
                })
    
    return tasks

def match_prompts_to_tasks(ai_prompts, tasks):
    """Match AI prompts to tasks based on similarity of titles"""
    prompts_by_task = {}
    
    # Try to split prompts by task or section
    prompt_sections = re.split(r'\n\s*#+\s*|\n\s*Task\s+\d+:|\n\s*Prompt\s+\d+:', ai_prompts)
    
    # If we have about the same number of sections as tasks, try to match them
    if len(prompt_sections) >= len(tasks):
        for i, task in enumerate(tasks):
            if i < len(prompt_sections):
                prompts_by_task[task["title"]] = prompt_sections[i].strip()
    else:
        # Otherwise, just assign the whole prompt to each task
        for task in tasks:
            prompts_by_task[task["title"]] = ai_prompts.strip()
    
    return prompts_by_task

# GitHub Issues Agent
def create_github_issues_agent(project_plan, ai_prompts):
    # GitHub Issues Agent
    github_agent = Agent(
        role="GitHub Issues Manager",
        goal=(
            "Create well-structured GitHub issues for each task in the project plan, "
            "including appropriate AI prompts for each task."
        ),
        backstory=(
            "As a dedicated project organizer with extensive experience in GitHub issue management, "
            "I excel at converting project plans into actionable tasks with clear instructions. "
            "I ensure that each issue contains all necessary information for successful completion."
        ),
        verbose=True,
        llm="gpt-4o-mini",
    )
    
    # GitHub Issues Task
    github_task = Task(
        agent=github_agent,
        description=(
            f"Based on this project plan:\n\n{project_plan}\n\n"
            f"And these AI prompts:\n\n{ai_prompts}\n\n"
            "1. Extract all tasks from the project plan\n"
            "2. Identify the appropriate AI agent for each task\n"
            "3. Match the relevant AI prompt to each task\n"
            "4. Format each task as a GitHub issue with clear title, description, and prompt\n"
            "5. Create a summary of all issues created"
        ),
        expected_output=(
            "A collection of well-structured GitHub issues with appropriate assignees and AI prompts."
        ),
    )
    
    # Create GitHub Issues crew
    github_crew = Crew(
        agents=[github_agent],
        tasks=[github_task],
        verbose=True
    )
    
    # Run GitHub Issues task
    result = github_crew.kickoff()
    return result

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
    create_issues = request.form.get('create_issues', 'false').lower() == 'true'
    github_token_input = request.form.get('github_token', '')
    github_repo_input = request.form.get('github_repo', '')
    
    # Check if we have the required information
    if not api_key or not project_requirements:
        return jsonify({
            'error': 'OpenAI API key and project requirements are required'
        }), 400
    
    # Set the API key in the environment
    os.environ["OPENAI_API_KEY"] = api_key
    
    # Set GitHub token if provided
    if github_token_input:
        os.environ["GITHUB_TOKEN"] = github_token_input
        global github_token
        github_token = github_token_input
    
    try:
        # Generate the project plan
        project_plan_output = create_project_plan(project_requirements)
        
        # Process the CrewOutput object to extract meaningful content
        project_plan = process_crew_output(project_plan_output)
        
        # Generate the AI prompts
        ai_prompts_output = create_ai_prompts(project_plan)
        
        # Process the CrewOutput object to extract meaningful content
        ai_prompts = process_crew_output(ai_prompts_output)
        
        # Create GitHub issues if requested
        github_issues_result = None
        if create_issues and github_token and github_repo_input:
            github_issues_result = create_github_issues(project_plan, ai_prompts, github_repo_input)
        elif create_issues and (not github_token or not github_repo_input):
            github_issues_result = {
                "success": False,
                "message": "GitHub token and repository are required to create issues."
            }
        
        # Return the results as strings (which are JSON serializable)
        response = {
            'project_plan': project_plan,
            'ai_prompts': ai_prompts
        }
        
        if github_issues_result:
            response['github_issues'] = github_issues_result
        
        return jsonify(response)
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

@app.route('/api/github/repos', methods=['POST'])
def get_github_repos():
    """Fetch repositories the user has access to with their GitHub token"""
    github_token_input = request.form.get('github_token', '')
    
    if not github_token_input:
        return jsonify({
            'success': False,
            'message': 'GitHub token is required'
        }), 400
    
    try:
        # Initialize GitHub client
        g = Github(github_token_input)
        
        # Get authenticated user
        user = g.get_user()
        
        # Try to get user login to verify token is valid
        user_login = user.login
        
        # Get repositories the user has access to
        repos = []
        
        # First get user's own repositories
        for repo in user.get_repos():
            # Only include repositories where the user can create issues
            # (has push access or is owner)
            if repo.permissions.push or user_login == repo.owner.login:
                repos.append({
                    'full_name': repo.full_name,
                    'name': repo.name,
                    'owner': repo.owner.login,
                    'is_owner': user_login == repo.owner.login,
                    'has_issues': repo.has_issues,
                    'private': repo.private,
                    'url': repo.html_url
                })
        
        # Get repositories from organizations the user belongs to
        for org in user.get_orgs():
            for repo in org.get_repos():
                # Check if this repo is already in our list
                if not any(r['full_name'] == repo.full_name for r in repos):
                    # Only include if the user has push access (can create issues)
                    if repo.permissions.push:
                        repos.append({
                            'full_name': repo.full_name,
                            'name': repo.name,
                            'owner': repo.owner.login,
                            'is_owner': False,
                            'has_issues': repo.has_issues,
                            'private': repo.private,
                            'url': repo.html_url
                        })
        
        # Sort repositories: first user's own repos, then alphabetically
        repos = sorted(repos, key=lambda r: (not r['is_owner'], r['full_name'].lower()))
        
        return jsonify({
            'success': True,
            'user': user_login,
            'repositories': repos
        })
    
    except GithubException as e:
        app.logger.error(f"GitHub API error: {str(e)}")
        error_message = str(e)
        
        if "Bad credentials" in error_message:
            return jsonify({
                'success': False,
                'message': "Invalid GitHub token. Please check your Personal Access Token."
            }), 401
        else:
            return jsonify({
                'success': False,
                'message': f"GitHub API error: {str(e)}"
            }), 400
    
    except Exception as e:
        app.logger.error(f"Error fetching repositories: {str(e)}")
        return jsonify({
            'success': False,
            'message': f"Error fetching repositories: {str(e)}"
        }), 500

if __name__ == '__main__':
    print(f"Static folder: {app.static_folder}")
    print(f"Static folder exists: {os.path.exists(app.static_folder)}")
    print(f"Index.html exists: {os.path.exists(os.path.join(app.static_folder, 'index.html'))}")
    app.run(debug=True, host='0.0.0.0', port=8080) 