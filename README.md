# Project Daily Snapshot

A centralized GitHub project data source that automatically scans a GitHub account and publishes a `projects.json` file for public consumption.

## How It Works

This repository runs a GitHub Action daily that:
1. Scans all repositories for a given GitHub user
2. Detects which repositories have GitHub Pages enabled
3. Generates a `projects.json` file with project metadata
4. Commits the JSON file to this repository

Since this repository is **public**, any other project can fetch and use the `projects.json` data.

## Fetch the Data

Other projects can consume the projects data in several ways:

### Option 1: Direct Raw URL (Recommended)

```javascript
fetch('https://raw.githubusercontent.com/Chriszhang6/project-daily-snapshot/main/projects.json')
  .then(r => r.json())
  .then(projects => console.log(projects));
```

### Option 2: jsDelivr CDN (Faster, with CDN caching)

```javascript
fetch('https://cdn.jsdelivr.net/gh/Chriszhang6/project-daily-snapshot@main/projects.json')
  .then(r => r.json())
  .then(projects => console.log(projects));
```

### Option 3: Import as ES Module

```javascript
// Using dynamic import
const { default: projects } = await import(
  'https://cdn.jsdelivr.net/gh/Chriszhang6/project-daily-snapshot@main/projects.json'
);
```

## Data Format

```json
[
  {
    "name": "my-project",
    "description": "A sample project",
    "url": "https://username.github.io/my-project/",
    "github": "https://github.com/username/my-project",
    "language": "TypeScript",
    "stars": 42,
    "forks": 5,
    "updatedAt": "2024-01-15T10:30:00Z",
    "createdAt": "2023-06-01T08:00:00Z",
    "topics": ["web", "frontend"],
    "homepage": "https://example.com"
  }
]
```

## Usage Examples

### HTML/JavaScript

```html
<!DOCTYPE html>
<html>
<body>
  <h1>My Projects</h1>
  <div id="projects"></div>

  <script>
    fetch('https://cdn.jsdelivr.net/gh/Chriszhang6/project-daily-snapshot@main/projects.json')
      .then(r => r.json())
      .then(projects => {
        document.getElementById('projects').innerHTML = projects.map(p => `
          <div class="project">
            <h3><a href="${p.url}">${p.name}</a></h3>
            <p>${p.description}</p>
            <small>${p.language} | ⭐ ${p.stars}</small>
          </div>
        `).join('');
      });
  </script>
</body>
</html>
```

### React

```jsx
import { useState, useEffect } from 'react';

function Projects() {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    fetch('https://cdn.jsdelivr.net/gh/Chriszhang6/project-daily-snapshot@main/projects.json')
      .then(r => r.json())
      .then(setProjects);
  }, []);

  return (
    <div>
      {projects.map(p => (
        <div key={p.name}>
          <h3><a href={p.url}>{p.name}</a></h3>
          <p>{p.description}</p>
        </div>
      ))}
    </div>
  );
}
```

### Vue.js

```vue
<template>
  <div>
    <div v-for="project in projects" :key="project.name" class="project">
      <h3><a :href="project.url">{{ project.name }}</a></h3>
      <p>{{ project.description }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const projects = ref([]);

onMounted(async () => {
  const response = await fetch(
    'https://cdn.jsdelivr.net/gh/Chriszhang6/project-daily-snapshot@main/projects.json'
  );
  projects.value = await response.json();
});
</script>
```

### Python (FastAPI/Flask)

```python
import httpx
from fastapi import FastAPI

app = FastAPI()

@app.get("/projects")
async def get_projects():
    async with httpx.AsyncClient() as client:
        response = await client.get(
            'https://cdn.jsdelivr.net/gh/Chriszhang6/project-daily-snapshot@main/projects.json'
        )
        return response.json()
```

## Setting Up Your Own

To create your own centralized project snapshot:

1. **Fork this repository**

2. **Configure your GitHub username**:
   - Edit `.github/workflows/daily-snapshot.yml`
   - Change `GITHUB_USERNAME: 'Chriszhang6'` to your username

3. **Add PAT_TOKEN secret**:
   - Go to Settings → Secrets and variables → Actions
   - Add `PAT_TOKEN` with `repo` and `public_repo` scopes

4. **Enable GitHub Actions**:
   - Go to Actions → Settings
   - Enable "Allow all actions and reusable workflows"

5. **Test the workflow**:
   - Go to Actions → "Daily Project Snapshot"
   - Click "Run workflow" to test manually

Then other projects can fetch from your repo:
```
https://raw.githubusercontent.com/YOUR_USERNAME/project-daily-snapshot/main/projects.json
```

## License

MIT
