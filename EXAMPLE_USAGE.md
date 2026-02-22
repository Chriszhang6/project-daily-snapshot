# Example Usage

This document shows different ways to use the Project Daily Snapshot in your own projects.

## Option 1: Copy the Files

Copy the following files to your repository:

```
your-project/
├── .github/
│   └── workflows/
│       └── update-projects.yml
└── scripts/
    └── update-projects.js
```

### update-projects.yml

```yaml
name: Update Projects

on:
  schedule:
    - cron: '0 0 * * *'  # Run daily at UTC 00:00
  workflow_dispatch:

permissions:
  contents: write

jobs:
  update-projects:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          token: ${{ secrets.PAT_TOKEN }}

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Fetch GitHub Repos and Update projects.json
        env:
          GITHUB_TOKEN: ${{ secrets.PAT_TOKEN }}
          GITHUB_USERNAME: 'YOUR_USERNAME_HERE'
          OUTPUT_FILE: 'projects.json'
        run: node scripts/update-projects.js

      - name: Commit and push changes
        env:
          GITHUB_TOKEN: ${{ secrets.PAT_TOKEN }}
        run: |
          git config user.name 'github-actions[bot]'
          git config user.email 'github-actions[bot]@users.noreply.github.com'
          git add projects.json
          git diff --staged --quiet || git commit -m "Update GitHub projects list [skip ci]"
          git push
```

Don't forget to:
1. Replace `YOUR_USERNAME_HERE` with your actual GitHub username
2. Add `PAT_TOKEN` to your repository secrets

## Option 2: Use the Composite Action

```yaml
name: Update Projects

on:
  schedule:
    - cron: '0 0 * * *'
  workflow_dispatch:

permissions:
  contents: write

jobs:
  update-projects:
    uses: Chriszhang6/project-daily-snapshot/.github/actions/daily-snapshot@main
    with:
      github_username: 'YOUR_USERNAME_HERE'
      output_path: 'projects.json'
    secrets:
      pat_token: ${{ secrets.PAT_TOKEN }}
```

## Option 3: Fetch the Script at Runtime

```yaml
name: Update Projects

on:
  schedule:
    - cron: '0 0 * * *'
  workflow_dispatch:

permissions:
  contents: write

jobs:
  update-projects:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          token: ${{ secrets.PAT_TOKEN }}

      - name: Fetch and run snapshot script
        env:
          GITHUB_TOKEN: ${{ secrets.PAT_TOKEN }}
          GITHUB_USERNAME: 'YOUR_USERNAME_HERE'
          OUTPUT_FILE: 'projects.json'
        run: |
          curl -fsSL https://raw.githubusercontent.com/Chriszhang6/project-daily-snapshot/main/scripts/update-projects.js -o update-projects.js
          node update-projects.js
          rm update-projects.js

      - name: Commit and push changes
        env:
          GITHUB_TOKEN: ${{ secrets.PAT_TOKEN }}
        run: |
          git config user.name 'github-actions[bot]'
          git config user.email 'github-actions[bot]@users.noreply.github.com'
          git add projects.json
          git diff --staged --quiet || git commit -m "Update GitHub projects list [skip ci]"
          git push
```

## Setting Up the PAT_TOKEN

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate a new token with these scopes:
   - `repo` (for private repos)
   - `public_repo` (for public repos only)
3. Copy the token
4. Go to your repository settings → Secrets and variables → Actions
5. Add a new secret named `PAT_TOKEN` with your token value

## Consuming projects.json in Your Website

### JavaScript Example

```javascript
// Fetch and display projects
async function loadProjects() {
  try {
    const response = await fetch('/projects.json');
    const projects = await response.json();
    return projects;
  } catch (error) {
    console.error('Failed to load projects:', error);
    return [];
  }
}

// Render projects to HTML
function renderProjects(projects) {
  const container = document.getElementById('projects-grid');
  container.innerHTML = projects.map(project => `
    <div class="project-card">
      <h3><a href="${project.url}">${project.name}</a></h3>
      <p>${project.description}</p>
      <div class="meta">
        <span class="language">${project.language}</span>
        <span class="stars">⭐ ${project.stars}</span>
        <span class="forks">🔱 ${project.forks}</span>
      </div>
      <div class="topics">
        ${project.topics.map(topic => `<span class="topic">${topic}</span>`).join('')}
      </div>
    </div>
  `).join('');
}

// Usage
loadProjects().then(renderProjects);
```

### HTML Example

```html
<!DOCTYPE html>
<html>
<head>
  <title>My Projects</title>
  <style>
    .project-card {
      border: 1px solid #ccc;
      padding: 1rem;
      margin: 1rem;
      border-radius: 8px;
    }
    .project-card h3 a {
      color: #0366d6;
      text-decoration: none;
    }
    .project-card h3 a:hover {
      text-decoration: underline;
    }
    .meta {
      display: flex;
      gap: 1rem;
      color: #666;
      font-size: 0.9em;
    }
    .topics {
      margin-top: 0.5rem;
    }
    .topic {
      display: inline-block;
      background: #f1f1f1;
      padding: 0.2rem 0.5rem;
      border-radius: 12px;
      font-size: 0.8em;
      margin-right: 0.3rem;
    }
  </style>
</head>
<body>
  <h1>My GitHub Projects</h1>
  <div id="projects-grid"></div>

  <script>
    fetch('/projects.json')
      .then(r => r.json())
      .then(projects => {
        document.getElementById('projects-grid').innerHTML = projects.map(p => `
          <div class="project-card">
            <h3><a href="${p.url}">${p.name}</a></h3>
            <p>${p.description}</p>
            <div class="meta">
              <span class="language">${p.language}</span>
              <span class="stars">⭐ ${p.stars}</span>
              <span class="forks">🔱 ${p.forks}</span>
            </div>
          </div>
        `).join('');
      });
  </script>
</body>
</html>
```

### React Example

```jsx
import { useState, useEffect } from 'react';

function ProjectsList() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/projects.json')
      .then(r => r.json())
      .then(data => {
        setProjects(data);
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="projects-grid">
      {projects.map(project => (
        <div key={project.name} className="project-card">
          <h3><a href={project.url}>{project.name}</a></h3>
          <p>{project.description}</p>
          <div className="meta">
            <span>{project.language}</span>
            <span>⭐ {project.stars}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
```
