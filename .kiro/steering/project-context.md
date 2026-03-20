# Project Context

## Workspace Path
/Users/ossade/Documents/VideoDownloader

## Execution Rules
- Do NOT run background processes directly from the orchestrator
- Background processes should only be run via sub-agents when needed
- Use `executeBash` for quick commands that complete instantly (like `npx vitest run`)
- Avoid `controlBashProcess` with action "start" unless delegating to a sub-agent
