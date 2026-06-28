# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

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
