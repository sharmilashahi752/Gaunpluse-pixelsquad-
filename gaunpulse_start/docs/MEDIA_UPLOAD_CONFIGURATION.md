# GaunPulse — Media Upload Configuration & Streaming

## Overview
GaunPulse supports direct multimedia uploads (photographic evidence and voice recordings) from citizens, stored on the local filesystem and tracked in MySQL.

## 1. Storage Configuration
- **Disk**: `public` storage disk (`storage/app/public`).
- **Symlink**: `public/storage` linked to `storage/app/public` via `php artisan storage:link`.
- **Directories**:
  - Images: `storage/app/public/complaints/images/`
  - Audio: `storage/app/public/complaints/audio/`

## 2. Validation & Security
- **Images**:
  - Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`.
  - Max count: 5 files per complaint.
  - Max size: 5120 KB (5 MB) per image.
- **Audio Recordings**:
  - Allowed MIME types: `audio/webm`, `audio/ogg`, `audio/mpeg`, `audio/mp3`, `audio/mp4`, `audio/m4a`, `audio/wav`, `audio/x-wav`.
  - Max size: 10240 KB (10 MB).
- **Security Scoping**:
  - Media streaming endpoint `/api/citizen/media/{id}/preview` validates that the requesting actor is the complaint owner, assigned ward officer, municipality admin, or system admin.

## 3. Database Schema
- **Table**: `complaint_media`
  - `id`: Bigint primary key
  - `complaint_id`: Foreign key to `complaints.id`
  - `media_type`: Enum (`image`, `audio`, `document`)
  - `file_path`: Relative filesystem path
  - `original_name`: Client-provided original filename
  - `mime_type`: Resolved MIME type
  - `file_size`: Size in bytes
  - `created_at` / `updated_at`

## 4. Model Serialization & Accessor
- `ComplaintMedia` includes an `$appends = ['url']` accessor that automatically generates absolute URLs via `url('storage/' . $this->file_path)`:
```php
public function getUrlAttribute(): string
{
    return url('storage/' . $this->file_path);
}
```
- Frontend components safely render `item.url || '/storage/' + item.file_path` for seamless local, staging, and production compatibility.
