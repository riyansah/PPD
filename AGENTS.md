# AGENTS.md

## Purpose

Work on this project efficiently, safely, and with minimal token usage. Use `PRD.md` as the primary product requirement source and the existing codebase as the primary implementation reference.

## Work Order

1. Read this file.
2. Read only the relevant sections of `PRD.md`.
3. Check `git status`, the main project structure, and only the files related to the task.
4. Make the smallest complete change that satisfies the request.
5. Run the most relevant checks or tests.
6. Update versioning and changelog files when required.
7. Report the result briefly.

## Token Efficiency Rules

- Do not repeat the user's request.
- Do not provide long plans unless explicitly requested.
- Do not scan or print the entire repository unless necessary.
- Search files by relevant feature, route, component, model, function, or filename.
- Do not copy full file contents into the final response.
- Report only the summary, changed files, verification results, version update, and important blockers.
- Do not create extra documentation unless requested or required by this file.
- Avoid comments that explain obvious code.
- Avoid large refactors when a local change is sufficient.
- Run targeted tests before broader test suites.
- Do not ask questions when the answer can be safely inferred from `PRD.md`, existing code patterns, tests, or common practice.

## Source of Truth

Use this priority order:

1. The user's latest request.
2. `PRD.md`.
3. `AGENTS.md`.
4. Existing tests.
5. Existing project architecture and code patterns.
6. The simplest safe common practice.

When instructions conflict, follow the higher-priority source.

## Implementation Rules

- Preserve the existing architecture, naming, formatting, and folder structure.
- Do not replace the framework, database, package manager, authentication method, or major architecture unless explicitly requested.
- Do not add dependencies when the task can be completed with existing dependencies.
- Do not modify unrelated files.
- Do not remove existing functionality only to simplify implementation.
- Keep backward compatibility whenever practical.
- Validate user input on the server side.
- Never commit passwords, tokens, secrets, or credentials.
- Use environment variables for sensitive configuration.
- Handle errors with safe and understandable messages.
- Use `Asia/Jakarta` for date and time behavior unless the project explicitly requires another timezone.
- Keep the interface usable on desktop and mobile devices.

## Database Rules

- Use SQLite unless the project requirements say otherwise.
- Do not make destructive schema changes without a clear requirement.
- When the schema changes, create a safe migration or equivalent upgrade mechanism.
- Preserve existing user data whenever possible.
- Avoid unnecessary queries and retrieve only required data.

## Code Quality

- Prefer the simplest solution that fully satisfies the requirement.
- Keep functions and components focused.
- Remove meaningful duplication, but avoid premature abstraction.
- Use clear types when the project supports type checking.
- Fix lint, type, or test failures caused by your own changes.
- Do not fix unrelated legacy issues unless they block the requested task.

## Versioning

The project must use Semantic Versioning:

`MAJOR.MINOR.PATCH`

Examples:

- `1.0.0`
- `1.2.0`
- `1.2.3`

Maintain the current version in a root-level file named:

`VERSION`

The file must contain only the version number followed by a newline.

### Version Increment Rules

Increment the version only once per completed task.

- `PATCH`: bug fixes, internal improvements, small UI fixes, performance improvements, refactoring without breaking behavior, or minor documentation changes tied to code.
- `MINOR`: new backward-compatible features, new pages, new endpoints, new user-visible settings, or meaningful feature enhancements.
- `MAJOR`: breaking changes, incompatible API changes, destructive behavior changes, or major architecture changes requiring migration.

Do not increment the version for:

- analysis-only work;
- unanswered or incomplete tasks;
- changes that were not applied;
- temporary debugging;
- generated build files;
- formatting-only changes with no functional impact.

If the `VERSION` file does not exist, create it with:

`0.1.0`

If an existing project version is already defined in `package.json`, `pyproject.toml`, `Cargo.toml`, or another primary manifest, use that version as the starting value and keep `VERSION` synchronized with it.

When the project manifest contains a version field, update both the manifest and `VERSION`.

## Changelog

Maintain a root-level file named:

`CHANGELOG.md`

Use the Keep a Changelog structure with newest entries first.

If the file does not exist, create it with this structure:

```md
# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

## [0.1.0] - YYYY-MM-DD

### Added
- Initial project version.
```

### Changelog Rules

For every completed code or product change:

1. Add a concise entry under `## [Unreleased]` while work is in progress.
2. After verification succeeds, create a new version section using the updated version.
3. Use the current date in `YYYY-MM-DD` format.
4. Move the relevant entries from `Unreleased` into the new version section.
5. Keep `## [Unreleased]` at the top and empty after release preparation.
6. Do not include implementation details that are not useful to users or maintainers.
7. Do not add duplicate entries for the same task.

Use only the sections that apply:

- `Added`
- `Changed`
- `Deprecated`
- `Removed`
- `Fixed`
- `Security`

Example:

```md
## [Unreleased]

## [0.2.0] - 2026-06-28

### Added
- Added user login support.

### Changed
- Improved mobile dashboard layout.
```

## Automatic Version and Changelog Workflow

For every task that changes code, behavior, schema, configuration, or user-facing documentation:

1. Determine whether the change is `PATCH`, `MINOR`, or `MAJOR`.
2. Read the current version from `VERSION` or the primary project manifest.
3. Update the version once.
4. Update `VERSION`.
5. Synchronize the version in the project manifest when applicable.
6. Update `CHANGELOG.md`.
7. Run relevant tests.
8. Verify version values are consistent.
9. Include the final version in the task report.

Do not create a Git tag, commit, release, or push unless explicitly requested.

## Testing

Test in this order:

1. Tests for the changed file or feature.
2. Relevant type checking or linting.
3. Build only when the change can affect the build.
4. Broader tests only when necessary.

If tests cannot run, state the reason briefly. Never claim tests passed unless they were actually executed.

A version may still be updated when testing is unavailable, but the changelog and final report must clearly state that verification was not completed.

## Git Rules

- Check `git status` before and after changes.
- Never overwrite or delete the user's existing changes.
- Do not commit, push, rebase, reset, tag, or force-update without explicit permission.
- Do not add build output, caches, logs, local databases, or secrets to Git.
- Review the diff to ensure no unrelated changes were introduced.

## Final Report Format

Use this concise format:

### Completed
- Main result.

### Files
- `path/to/file`: short description.

### Version
- `x.y.z` → `x.y.z`

### Verification
- Command and result.

### Notes
- Only include important assumptions, blockers, or follow-up work.

Keep the report brief unless the user requests more detail.

## Stop Conditions

Stop and report the issue when:

- required credentials or secrets are unavailable;
- the requested change risks destructive data loss;
- the request conflicts with `PRD.md` and cannot be resolved safely;
- the repository is broken for reasons unrelated to the task;
- an important decision cannot be inferred from the code, tests, or documentation.

For minor uncertainty, use the safest reasonable assumption and continue.
