# API Contract

## Base Rules

- Base path API adalah `/api`.
- Semua endpoint privat memerlukan session cookie yang valid.
- Semua request dan response JSON memakai `Content-Type: application/json`, kecuali endpoint ekspor file.
- Semua response JSON memakai envelope yang sama.

## JSON Envelope

```json
{
  "data": {},
  "meta": {
    "server_time": "2026-06-28T05:00:00Z",
    "request_id": "req_123",
    "pagination": {
      "page": 1,
      "page_size": 20,
      "total_items": 120,
      "total_pages": 6
    }
  },
  "errors": [],
  "warnings": []
}
```

## Error Shape

```json
{
  "data": null,
  "meta": {
    "server_time": "2026-06-28T05:00:00Z",
    "request_id": "req_123"
  },
  "errors": [
    {
      "code": "VALIDATION_ERROR",
      "message": "Deadline must be greater than or equal to start time.",
      "field": "deadline_at"
    }
  ],
  "warnings": []
}
```

## Common Conventions

- Semua datetime respons memakai UTC ISO 8601.
- Semua tanggal lokal memakai `YYYY-MM-DD`.
- Semua jam lokal memakai `HH:mm`.
- Semua enum API memakai lowercase slug yang stabil.
- Sebagian nilai tetap memakai istilah Indonesia bila sudah menjadi domain tetap dari PRD, seperti kategori aktivitas.
- Label UI tetap dipisahkan dari enum API.
- Soft-deleted records tidak muncul pada endpoint daftar atau detail normal.

## Authentication

### `POST /api/auth/login`

Request:

```json
{
  "login": "user@example.com",
  "password": "secret"
}
```

Success `200`:

- `data.user`
- `data.session`

Rules:

- `login` menerima username atau email.
- Jika gagal karena kredensial salah, kembalikan `401`.
- Jika kena rate limit, kembalikan `429`.

### `POST /api/auth/logout`

Success `200`:

- `data.logged_out = true`

### `GET /api/auth/session`

Success `200`:

- `data.authenticated`
- `data.user`
- `data.session.expires_at`
- `data.session.idle_expires_at`

### `PUT /api/auth/password`

Request:

```json
{
  "current_password": "old-secret",
  "new_password": "new-secret",
  "confirm_password": "new-secret"
}
```

Success `200`:

- `data.updated = true`

## Dashboard

### `GET /api/dashboard/summary`

Query:

- `period=weekly|monthly`

Response `data`:

- `task_counts.total`
- `task_counts.in_progress`
- `task_counts.completed`
- `task_counts.paused`
- `task_counts.overdue`
- `activity_counts.today`
- `routine_counts.today`
- `task_completion_percentage`

### `GET /api/dashboard/today`

Response `data`:

- `items[]`

Item fields:

- `id`
- `entity_type`
- `title`
- `label`
- `category`
- `priority`
- `status`
- `computed_status`
- `start_time`
- `end_time`
- `scheduled_date`
- `actionable`

### `GET /api/dashboard/deadlines`

Query:

- `limit` optional, default `5`, max `20`

Response `data`:

- `items[]`

Item fields:

- `id`
- `title`
- `priority`
- `status`
- `deadline_at`
- `is_overdue`
- `countdown_seconds`

### `GET /api/dashboard/charts`

Query:

- `period=weekly|monthly`

Response `data`:

- `tasks_by_status`
- `activities_by_status`
- `activities_by_category`

## Tasks

### `GET /api/tasks`

Query:

- `page`
- `page_size`
- `search`
- `status`
- `priority`
- `start_from`
- `start_to`
- `deadline_from`
- `deadline_to`
- `is_overdue`
- `sort`
- `order`

Allowed `sort`:

- `deadline_at`
- `priority`
- `created_at`
- `title`

Response item fields:

- `id`
- `title`
- `description`
- `status`
- `priority`
- `start_at`
- `deadline_at`
- `completed_at`
- `is_overdue`
- `created_at`
- `updated_at`

### `POST /api/tasks`

Request:

```json
{
  "title": "Finish proposal",
  "description": "Send final version",
  "status": "in_progress",
  "priority": "high",
  "start_at": "2026-06-28T02:00:00Z",
  "deadline_at": "2026-06-29T10:00:00Z"
}
```

Rules:

- `title` required.
- `status` default `in_progress`.
- `deadline_at` must be `>= start_at`.

### `GET /api/tasks/:id`

Response `data`:

- fields item task penuh

### `PUT /api/tasks/:id`

Rules:

- Validasi sama seperti create.

### `DELETE /api/tasks/:id`

Success `200`:

- `data.deleted = true`

Behavior:

- Melakukan soft delete.

### `PATCH /api/tasks/:id/status`

Request:

```json
{
  "status": "completed"
}
```

Rules:

- Saat `status=completed`, backend mengisi `completed_at`.

## Activities

### `GET /api/activities`

Query:

- `page`
- `page_size`
- `search`
- `category`
- `status`
- `date_from`
- `date_to`
- `start_time_from`
- `start_time_to`
- `end_time_from`
- `end_time_to`
- `sort`
- `order`

Allowed `sort`:

- `activity_date`
- `start_time`
- `end_time`
- `created_at`
- `title`

Response item fields:

- `id`
- `title`
- `category`
- `activity_date`
- `start_time`
- `end_time`
- `status`
- `computed_status`
- `notes`
- `confirmed_at`
- `created_at`
- `updated_at`

### `POST /api/activities`

Request:

```json
{
  "title": "Gym",
  "category": "olahraga",
  "activity_date": "2026-06-28",
  "start_time": "18:00",
  "end_time": "19:00",
  "status": "scheduled",
  "notes": "Leg day"
}
```

Rules:

- `title`, `category`, `activity_date`, `start_time`, `end_time` required.
- `category` hanya boleh salah satu dari:
  - `pekerjaan`
  - `belajar`
  - `olahraga`
  - `sosial`
  - `pribadi`
- `end_time` must be greater than `start_time`.
- Benturan dikembalikan sebagai `warnings`.

### `GET /api/activities/:id`

### `PUT /api/activities/:id`

### `DELETE /api/activities/:id`

Behavior:

- Melakukan soft delete.

### `PATCH /api/activities/:id/status`

Request:

```json
{
  "status": "completed"
}
```

Rules:

- Hanya menerima `completed` atau `cancelled`.
- Saat status diubah dari `scheduled`, backend mengisi `confirmed_at`.

## Routines

### `GET /api/routines`

Query:

- `page`
- `page_size`
- `search`
- `is_active`
- `priority`
- `day_of_week`
- `sort`
- `order`

Allowed `sort`:

- `start_time`
- `end_time`
- `priority`
- `created_at`
- `title`

Response item fields:

- `id`
- `title`
- `day_of_week[]`
- `start_time`
- `end_time`
- `priority`
- `notes`
- `is_active`
- `created_at`
- `updated_at`

### `POST /api/routines`

Request:

```json
{
  "title": "Morning workout",
  "day_of_week": [1, 3, 5],
  "start_time": "06:00",
  "end_time": "07:00",
  "priority": "high",
  "notes": "Cardio"
}
```

Rules:

- `day_of_week` uses `1=Monday` through `7=Sunday`.
- `end_time` must be greater than `start_time`.
- Benturan dikembalikan sebagai `warnings`.

### `GET /api/routines/:id`

Response `data`:

- detail rutinitas
- `upcoming_history[]` optional

### `PUT /api/routines/:id`

### `DELETE /api/routines/:id`

Behavior:

- Melakukan soft delete pada template, tidak menghapus `routine_histories`.

### `PATCH /api/routines/:id/toggle`

Request:

```json
{
  "is_active": false
}
```

### `POST /api/routines/:id/confirm`

Request:

```json
{
  "scheduled_date": "2026-06-28",
  "status": "completed",
  "notes": "Done"
}
```

Rules:

- `status` hanya boleh `completed` atau `cancelled`.
- Backend mencari `routine_history` aktif untuk tanggal tersebut.

## Reports

### `GET /api/reports/summary`

Query:

- `period=daily|weekly|monthly|custom`
- `date`
- `start_date`
- `end_date`

Response `data`:

- `period`
- `task_summary`
- `activity_summary`
- `routine_summary`
- `activity_most_frequent`
- `generated_summary_text`

### `GET /api/reports/tasks`

### `GET /api/reports/activities`

### `GET /api/reports/routines`

Rules:

- Mengikuti filter periode yang sama dengan summary.

### `GET /api/reports/export/pdf`

Response:

- file `application/pdf`

### `GET /api/reports/export/csv`

Query:

- `datasets=tasks,activities,routines,summary`

Response:

- satu file CSV jika hanya satu dataset
- file ZIP jika lebih dari satu dataset

## Settings

### `GET /api/settings`

Response `data`:

- `profile`
- `appearance`
- `notifications`
- `backup`

### `PUT /api/settings`

Request sections:

- `display_name`
- `theme`
- `notification_enabled`
- `task_notification_enabled`
- `activity_notification_enabled`
- `routine_notification_enabled`
- `task_reminder_minutes`
- `activity_reminder_minutes`
- `routine_reminder_minutes`
- `browser_notification_enabled`

### `POST /api/settings/backup`

Response:

- file JSON backup

### `POST /api/settings/restore`

Request:

- `multipart/form-data` dengan satu file backup

Rules:

- Validasi metadata dan checksum.
- `POST /api/settings/restore` menerima field form `mode` dengan nilai `preview` atau `apply`.
- `mode=preview` hanya memvalidasi file dan mengembalikan ringkasan isi backup.
- `mode=apply` menjalankan restore setelah file lolos validasi.

### `DELETE /api/settings/all-data`

Request:

```json
{
  "password": "secret",
  "confirmation_text": "HAPUS SEMUA DATA"
}
```

Rules:

- Menghapus data user tanpa menghapus akun login.

## HTTP Status Summary

- `200` success
- `201` resource created
- `400` malformed request
- `401` unauthenticated
- `403` forbidden
- `404` not found
- `409` conflict for incompatible state transition when applicable
- `422` validation error
- `429` rate limited
- `500` internal server error
