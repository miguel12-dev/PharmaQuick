# PharmaQuick Skill Registry

## Active Skills

| Skill | Trigger | Source |
|-------|---------|--------|
| branch-pr | Creating a pull request, opening a PR, or preparing changes for review | Global |
| go-testing | Writing Go tests, using teatest, or adding test coverage | Global |
| issue-creation | Creating a GitHub issue, reporting a bug, or requesting a feature | Global |
| judgment-day | user says "judgment day", "judgment-day", "review adversarial", "dual review", "doble review", "juzgar", "que lo juzguen" | Global |
| skill-creator | Creating a new skill, adding agent instructions, or documenting patterns for AI | Global |

## Project Standards (Compact Rules)

### Backend (PHP)
- Use PSR-4 namespacing.
- Follow the Repository pattern for database access.
- API endpoints should return JSON and handle errors gracefully (no HTML output on errors).
- Use `PharmaQuick\API\Response` if available for consistent responses.

### Frontend (Vanilla JS SPA)
- Component-based architecture.
- Use `App.router` for navigation.
- All API calls should be made via dedicated Service classes (e.g., `PublicCatalogService`).
- Use interactive elements (loaders, transitions) for better UX.

### AJAX / Interactivity
- Use `fetch` for AJAX requests.
- Implement loading states (spinners or skeletons).
- Handle network errors and display user-friendly messages.
