# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

## [0.8.0] - 2026-07-01

### Added
- Added authenticated report summary, task, activity, and routine endpoints with daily, weekly, monthly, and custom date filters.
- Added server-generated PDF exports and UTF-8 CSV exports, including ZIP output for multiple datasets.
- Added responsive report UI with period filters, statistics, rule-based productivity summary, charts, data tables, and export links.
- Added automated report tests covering period filtering, export consistency, PDF/CSV/ZIP responses, and validation.

## [0.7.0] - 2026-07-01

### Added
- Added authenticated dashboard summary, today agenda, deadline countdown, and chart endpoints.
- Added responsive dashboard UI with summary cards, server-time countdowns, combined activity and routine agenda, and weekly or monthly charts.
- Added automated dashboard tests covering authentication, summary counts, agenda labels, countdowns, chart data, and query validation.

## [0.6.0] - 2026-07-01

### Added
- Added authenticated routine management with CRUD, active weekday editing, active or inactive toggling, confirmation, and soft delete.
- Added daily routine-history reconciliation with Jakarta-local occurrence generation, idempotent duplicate prevention, and automatic missed processing.
- Added responsive Rutinitas interfaces for list, detail, create, edit, delete, conflict warnings, and routine-history confirmation.
- Added automated routine tests covering validation, ownership isolation, filters, sorting, pagination, scheduler stability, snapshot preservation, and confirmation rules.

## [0.5.1] - 2026-06-29

### Added
- Added a root `launcher.sh` helper to run install-checked app startup, development mode, migrations, setup, lint, and tests from one entry point.

## [0.5.0] - 2026-06-29

### Added
- Added authenticated activity management with CRUD, status confirmation, soft delete, search, filters, sorting, and pagination.
- Added fixed activity categories, Jakarta date and time validation, and server-derived computed activity statuses.
- Added schedule conflict warnings for overlapping activities and routines without blocking saves.
- Added responsive Aktivitas interfaces for list, detail, create, edit, confirmation, and deletion flows.
- Added automated activity tests covering validation, ownership isolation, computed statuses, warnings, and response metadata.

## [0.4.1] - 2026-06-28

### Changed
- Redesigned the authenticated application UI with a modern SaaS dashboard layout, stronger task hierarchy, compact metrics, and a more polished mobile experience.

## [0.4.0] - 2026-06-28

### Added
- Added authenticated task management endpoints with CRUD, status updates, soft delete, search, filters, sorting, pagination, and overdue computation.
- Added responsive Pekerjaan views for task listing, task detail, creation, editing, deletion, status changes, and password management within the authenticated shell.
- Added automated task-management tests covering authentication, validation, ownership isolation, overdue logic, completed timestamps, filtering, sorting, pagination, and soft delete behavior.

## [0.3.0] - 2026-06-28

### Added
- Added single-user account setup, login, logout, password change, and persistent server-side session management.
- Added authentication-protected application pages, rate-limited login handling, and responsive login/security flows for desktop and mobile.
- Added automated authentication tests covering setup, session lifecycle, password changes, cookie policy, and rate limiting.

## [0.2.0] - 2026-06-28

### Added
- Added the Node.js, Express.js, and SQLite project foundation with scripts, environment configuration, and a responsive application shell.
- Added database migrations, initial schema creation, centralized error handling, structured logging, and Asia/Jakarta time utilities.
- Added automated foundation tests for app startup, configuration, time formatting, and migration bootstrap.

## [0.1.0] - 2026-06-28

### Added
- Added Phase 0 technical planning documents for technical decisions, API contract, and database schema.
