# Database Schema

## Database Principles

- Database menggunakan `SQLite`.
- Semua tabel utama menyertakan `created_at` dan `updated_at` bila relevan.
- Soft delete dipakai pada `tasks`, `activities`, dan `routines` melalui `deleted_at`.
- Semua datetime absolut disimpan dalam UTC ISO 8601 text.
- Tanggal lokal memakai `YYYY-MM-DD`.
- Jam lokal memakai `HH:mm`.

## 1. `users`

Purpose:

- Menyimpan akun tunggal aplikasi.

Columns:

- `id` `INTEGER PRIMARY KEY`
- `username` `TEXT NOT NULL UNIQUE`
- `email` `TEXT NOT NULL UNIQUE`
- `password_hash` `TEXT NOT NULL`
- `display_name` `TEXT NOT NULL`
- `theme` `TEXT NOT NULL DEFAULT 'system'`
- `timezone` `TEXT NOT NULL DEFAULT 'Asia/Jakarta'`
- `last_login_at` `TEXT NULL`
- `created_at` `TEXT NOT NULL`
- `updated_at` `TEXT NOT NULL`

Constraints:

- `theme IN ('light', 'dark', 'system')`

## 2. `sessions`

Purpose:

- Menyimpan sesi login server-side.

Columns:

- `id` `TEXT PRIMARY KEY`
- `user_id` `INTEGER NOT NULL`
- `ip_address` `TEXT NULL`
- `user_agent` `TEXT NULL`
- `created_at` `TEXT NOT NULL`
- `last_seen_at` `TEXT NOT NULL`
- `expires_at` `TEXT NOT NULL`
- `idle_expires_at` `TEXT NOT NULL`

Foreign keys:

- `user_id -> users.id`

Indexes:

- `idx_sessions_user_id`
- `idx_sessions_expires_at`
- `idx_sessions_idle_expires_at`

## 3. `tasks`

Purpose:

- Menyimpan pekerjaan pengguna.

Columns:

- `id` `INTEGER PRIMARY KEY`
- `user_id` `INTEGER NOT NULL`
- `title` `TEXT NOT NULL`
- `description` `TEXT NULL`
- `status` `TEXT NOT NULL DEFAULT 'in_progress'`
- `priority` `TEXT NOT NULL DEFAULT 'medium'`
- `start_at` `TEXT NOT NULL`
- `deadline_at` `TEXT NOT NULL`
- `completed_at` `TEXT NULL`
- `created_at` `TEXT NOT NULL`
- `updated_at` `TEXT NOT NULL`
- `deleted_at` `TEXT NULL`

Constraints:

- `status IN ('in_progress', 'completed', 'paused', 'cancelled')`
- `priority IN ('low', 'medium', 'high', 'urgent')`
- `deadline_at >= start_at`

Foreign keys:

- `user_id -> users.id`

Indexes:

- `idx_tasks_user_id`
- `idx_tasks_status`
- `idx_tasks_priority`
- `idx_tasks_start_at`
- `idx_tasks_deadline_at`
- `idx_tasks_user_deadline`
- `idx_tasks_deleted_at`

## 4. `activities`

Purpose:

- Menyimpan aktivitas harian non-rutinitas.

Columns:

- `id` `INTEGER PRIMARY KEY`
- `user_id` `INTEGER NOT NULL`
- `title` `TEXT NOT NULL`
- `category` `TEXT NOT NULL`
- `activity_date` `TEXT NOT NULL`
- `start_time` `TEXT NOT NULL`
- `end_time` `TEXT NOT NULL`
- `status` `TEXT NOT NULL DEFAULT 'scheduled'`
- `notes` `TEXT NULL`
- `confirmed_at` `TEXT NULL`
- `created_at` `TEXT NOT NULL`
- `updated_at` `TEXT NOT NULL`
- `deleted_at` `TEXT NULL`

Constraints:

- `category IN ('pekerjaan', 'belajar', 'olahraga', 'sosial', 'pribadi')`
- `status IN ('scheduled', 'completed', 'cancelled')`
- `end_time > start_time`

Foreign keys:

- `user_id -> users.id`

Indexes:

- `idx_activities_user_id`
- `idx_activities_status`
- `idx_activities_category`
- `idx_activities_activity_date`
- `idx_activities_user_date`
- `idx_activities_deleted_at`

## 5. `routines`

Purpose:

- Menyimpan template rutinitas berulang.

Columns:

- `id` `INTEGER PRIMARY KEY`
- `user_id` `INTEGER NOT NULL`
- `title` `TEXT NOT NULL`
- `start_time` `TEXT NOT NULL`
- `end_time` `TEXT NOT NULL`
- `priority` `TEXT NOT NULL DEFAULT 'medium'`
- `notes` `TEXT NULL`
- `is_active` `INTEGER NOT NULL DEFAULT 1`
- `created_at` `TEXT NOT NULL`
- `updated_at` `TEXT NOT NULL`
- `deleted_at` `TEXT NULL`

Constraints:

- `priority IN ('low', 'medium', 'high', 'urgent')`
- `is_active IN (0, 1)`
- `end_time > start_time`

Foreign keys:

- `user_id -> users.id`

Indexes:

- `idx_routines_user_id`
- `idx_routines_is_active`
- `idx_routines_priority`
- `idx_routines_deleted_at`

## 6. `routine_days`

Purpose:

- Menyimpan hari aktif dari template rutinitas.

Columns:

- `id` `INTEGER PRIMARY KEY`
- `routine_id` `INTEGER NOT NULL`
- `day_of_week` `INTEGER NOT NULL`

Constraints:

- `day_of_week BETWEEN 1 AND 7`
- `UNIQUE (routine_id, day_of_week)`

Foreign keys:

- `routine_id -> routines.id`

Indexes:

- `idx_routine_days_routine_id`
- `idx_routine_days_day_of_week`

## 7. `routine_histories`

Purpose:

- Menyimpan setiap kemunculan rutinitas dan hasil pelaksanaannya.

Columns:

- `id` `INTEGER PRIMARY KEY`
- `routine_id` `INTEGER NOT NULL`
- `user_id` `INTEGER NOT NULL`
- `routine_title_snapshot` `TEXT NOT NULL`
- `scheduled_date` `TEXT NOT NULL`
- `scheduled_start` `TEXT NOT NULL`
- `scheduled_end` `TEXT NOT NULL`
- `status` `TEXT NOT NULL DEFAULT 'missed_pending'`
- `confirmed_at` `TEXT NULL`
- `notes` `TEXT NULL`
- `created_at` `TEXT NOT NULL`

Constraints:

- `status IN ('missed_pending', 'completed', 'missed', 'cancelled')`
- `UNIQUE (routine_id, scheduled_date)`

Foreign keys:

- `routine_id -> routines.id`
- `user_id -> users.id`

Indexes:

- `idx_routine_histories_user_id`
- `idx_routine_histories_routine_id`
- `idx_routine_histories_scheduled_date`
- `idx_routine_histories_status`
- `idx_routine_histories_user_date`

Note:

- `missed_pending` adalah status internal sebelum scheduler menandai riwayat menjadi `missed`. Ini menghindari kehilangan jejak kemunculan yang belum dikonfirmasi.

## 8. `notifications`

Purpose:

- Menyimpan notifikasi in-app dan status pengirimannya.

Columns:

- `id` `INTEGER PRIMARY KEY`
- `user_id` `INTEGER NOT NULL`
- `entity_type` `TEXT NOT NULL`
- `entity_id` `INTEGER NOT NULL`
- `notification_type` `TEXT NOT NULL`
- `title` `TEXT NOT NULL`
- `message` `TEXT NOT NULL`
- `scheduled_at` `TEXT NOT NULL`
- `sent_at` `TEXT NULL`
- `read_at` `TEXT NULL`
- `status` `TEXT NOT NULL DEFAULT 'pending'`
- `created_at` `TEXT NOT NULL`

Constraints:

- `entity_type IN ('task', 'activity', 'routine_history')`
- `status IN ('pending', 'sent', 'read', 'dismissed', 'failed')`
- `UNIQUE (user_id, entity_type, entity_id, notification_type)`

Foreign keys:

- `user_id -> users.id`

Indexes:

- `idx_notifications_user_id`
- `idx_notifications_status`
- `idx_notifications_scheduled_at`
- `idx_notifications_read_at`

## 9. `settings`

Purpose:

- Menyimpan preferensi akun dan notifikasi.

Columns:

- `id` `INTEGER PRIMARY KEY`
- `user_id` `INTEGER NOT NULL UNIQUE`
- `notification_enabled` `INTEGER NOT NULL DEFAULT 1`
- `task_notification_enabled` `INTEGER NOT NULL DEFAULT 1`
- `activity_notification_enabled` `INTEGER NOT NULL DEFAULT 1`
- `routine_notification_enabled` `INTEGER NOT NULL DEFAULT 1`
- `browser_notification_enabled` `INTEGER NOT NULL DEFAULT 0`
- `task_reminder_minutes` `INTEGER NOT NULL DEFAULT 1440`
- `activity_reminder_minutes` `INTEGER NOT NULL DEFAULT 15`
- `routine_reminder_minutes` `INTEGER NOT NULL DEFAULT 15`
- `created_at` `TEXT NOT NULL`
- `updated_at` `TEXT NOT NULL`

Constraints:

- semua field boolean `IN (0, 1)`
- `task_reminder_minutes IN (0, 5, 15, 30, 60, 1440)`
- `activity_reminder_minutes IN (0, 5, 15, 30, 60)`
- `routine_reminder_minutes IN (0, 5, 15, 30, 60)`

Foreign keys:

- `user_id -> users.id`

## 10. `login_rate_limits`

Purpose:

- Menyimpan jejak percobaan login gagal untuk rate limiting sederhana di SQLite.

Columns:

- `id` `INTEGER PRIMARY KEY`
- `login_identifier` `TEXT NOT NULL`
- `ip_address` `TEXT NOT NULL`
- `failed_count` `INTEGER NOT NULL DEFAULT 0`
- `window_started_at` `TEXT NOT NULL`
- `last_failed_at` `TEXT NOT NULL`

Constraints:

- `UNIQUE (login_identifier, ip_address)`

Indexes:

- `idx_login_rate_limits_window_started_at`

## Tables Explicitly Deferred

- Tidak ada tabel `saved_reports` pada Phase 0.
- Tidak ada tabel `backup_files`; metadata backup cukup ditulis di file JSON dan log aplikasi.

## Suggested Migration Order

1. `users`
2. `sessions`
3. `tasks`
4. `activities`
5. `routines`
6. `routine_days`
7. `routine_histories`
8. `notifications`
9. `settings`
10. `login_rate_limits`
