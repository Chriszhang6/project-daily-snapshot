# Project Daily Snapshot

A reusable GitHub Action that automatically scans your GitHub repositories and generates a `projects.json` file containing projects with GitHub Pages enabled.

## Features

- **Daily Automatic Updates**: Runs every day at UTC 00:00 via GitHub Actions cron
- **Smart Pages Detection**: Uses multiple methods to detect GitHub Pages:
  - GitHub Pages API (when authenticated)
  - Direct URL testing
  - Naming pattern matching (fallback)
- **Configurable**: Works with any GitHub username
- **Filtering**: Automatically excludes forks and archived repositories
- **Rich Metadata**: Includes description, language, stars, forks, topics, and timestamps

## Usage

### Option 1: As a Standalone Repository

1. Fork or copy this repository
2. Configure your GitHub username (see Configuration below)
3. Add a GitHub Personal Access Token (PAT) as `PAT_TOKEN` secret
4. Enable GitHub Actions in your repository settings

### Option 2: As a Composite Action (Reusable Workflow)

Add this to your repository's workflow:

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
    uses: Chriszhang6/project-daily-snapshot/.github/workflows/daily-snapshot.yml@main
    secrets:
      pat_token: ${{ secrets.PAT_TOKEN }}
    with:
      github_username: 'your-username'
      output_path: 'projects.json'
```

## Configuration

### Required Secrets

Add the following secret to your repository (Settings → Secrets and variables → Actions):

- **`PAT_TOKEN`**: A GitHub Personal Access Token with `repo` and `public_repo` scopes

### Workflow Inputs

| Input | Description | Default |
|-------|-------------|---------|
| `github_username` | Your GitHub username | `Chriszhang6` |
| `output_path` | Where to save projects.json | `projects.json` |
| `filter_forks` | Exclude forked repositories | `true` |
| `filter_archived` | Exclude archived repositories | `true` |
| `min_stars` | Minimum star count (optional) | `0` |

### Environment Variables

You can also configure via environment variables in the script:

- `GITHUB_USERNAME`: Override the default username
- `OUTPUT_FILE`: Custom output path

## Output Format

The generated `projects.json` file contains an array of project objects:

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
    "topics": ["web", "frontend"]
  }
]
```

## Consuming projects.json in Your Project

Once the action generates `projects.json`, you can use it in your application:

```javascript
// Load projects data
async function loadProjects() {
  const response = await fetch('/projects.json');
  const projects = await response.json();
  return projects;
}

// Display projects
function renderProjects(projects) {
  const container = document.getElementById('projects-list');
  projects.forEach(project => {
    const card = document.createElement('div');
    card.innerHTML = `
      <h3><a href="${project.url}">${project.name}</a></h3>
      <p>${project.description}</p>
      <small>${project.language} | ⭐ ${project.stars}</small>
    `;
    container.appendChild(card);
  });
}
```

## Pages Detection Methods

The action uses a three-tier approach to detect GitHub Pages:

1. **GitHub Pages API** (most accurate) - Requires authentication via PAT_TOKEN
2. **Direct URL Testing** - Makes HEAD request to the potential Pages URL
3. **Pattern Matching** (fallback) - Matches common naming patterns like:
   - `*.github.io`
   - `-homepage`, `-portfolio`, `-website`, `-site`

## Development

### Local Testing

You can test the script locally:

```bash
# Install dependencies (none required - uses Node.js built-ins)
node scripts/update-projects.js
```

Set environment variables if needed:

```bash
export GITHUB_USERNAME="your-username"
export GITHUB_TOKEN="your-token"  # Optional but recommended
export OUTPUT_FILE="./projects.json"
node scripts/update-projects.js
```

## Troubleshooting

### No projects found

- Ensure your repositories have GitHub Pages enabled
- Check that `PAT_TOKEN` has the correct permissions
- Verify the GitHub username is correct

### Rate limiting

- Using a PAT_TOKEN increases rate limits
- The action caches results to minimize API calls

### Pages not detected

- Some repos may not be detected via API or URL test
- Add custom patterns to `likelyHasPages()` in `scripts/update-projects.js`

## License

MIT

## Contributing

Contributions welcome! Feel free to open issues or pull requests.
