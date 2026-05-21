# Enterprise Knowledge Base Management System (EKBMS)

A full-stack enterprise-grade knowledge management platform built with **FastAPI** and **React**. It supports structured article authoring, multi-level approval workflows, role-based access control, rich-text editing, full-text search, and analytics dashboards.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Features Implemented](#features-implemented)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Running the Project](#running-the-project)
- [Demo Credentials](#demo-credentials)
- [API Reference](#api-reference)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Screenshots](#screenshots)

---

## Project Overview

EKBMS is a centralized knowledge management solution designed for enterprise teams. It provides a structured workflow for authoring, reviewing, and publishing internal knowledge articles. Authors draft content using a rich-text editor, submit for review, and once approved, articles become available to all employees. Admins manage users, categories, and have full oversight of the system via an analytics dashboard.

**Key design goals:**
- Clear separation of concerns through role-based permissions
- Full audit trail via approval workflows
- Fast content discovery through full-text search with filters
- Data-driven insights through dashboard analytics

---

## Features Implemented

### Authentication & Security
- JWT-based authentication with access token + refresh token flow
- Automatic token refresh via Axios interceptor
- bcrypt password hashing with SHA-256 pre-hash (avoids 72-byte bcrypt limit)
- Password change and forgot-password / reset-password flows
- Protected routes via React route guards (`RequireAuth`, `RequireRole`)

### Role-Based Access Control
| Role | Permissions |
|---|---|
| **Admin** | Full access — users, categories, all articles, approvals, analytics |
| **Author** | Create/edit own articles, submit for approval, publish approved articles |
| **Reviewer** | View pending approvals, approve or reject with comments |
| **Employee** | Read-only access to published articles, can comment, rate, and bookmark |

### Article Lifecycle
```
Draft → Pending Approval → Approved → Published
                         ↘ Rejected → Draft (rework)
Published → Archived
```

### Content Management
- Rich-text editor (TipTap) with bold, italic, headings, bullet lists, code blocks, and links
- Article tagging with a flexible many-to-many tag system
- Hierarchical category system (parent → child)
- File attachments (PDF, Word, Excel, PowerPoint, images) up to configurable size limit
- Article versioning via status history

### Discovery & Engagement
- Full-text search across title, content, and summary
- Filter by category, tag, or author; sort by latest, most popular, or highest rated
- Live autocomplete search suggestions
- Bookmarking for personal reading lists
- 5-star article ratings (upsert — one rating per user per article)
- Threaded comments on published articles

### Analytics Dashboard
- Total articles, published count, pending approvals, active users
- Top 5 articles by view count
- Category distribution chart
- Search trend analysis (most searched queries)
- Monthly article creation trend (last 6 months)

### User Management (Admin)
- List, view, and update all users
- Assign roles and departments
- Deactivate user accounts

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS v4, TanStack Query, Zustand, React Router v6 |
| **UI Components** | Radix UI, Framer Motion, Recharts, TipTap, Lucide React, react-hot-toast |
| **Backend** | Python 3.11, FastAPI, SQLAlchemy 2.0, Pydantic v2, Alembic |
| **Database** | MySQL 8+ via PyMySQL |
| **Auth** | JWT (python-jose), bcrypt 4.0.1 |
| **HTTP Client** | Axios with auto-refresh interceptor |

---

## Prerequisites

- Python 3.11+
- Node.js 18+
- MySQL 8.0+

---

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/ekbms.git
cd ekbms
```

### 2. Database Setup

Open MySQL and create the database:

```sql
CREATE DATABASE ekbms_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

Create a `.env` file inside the `backend/` folder:

```env
DATABASE_URL=mysql+pymysql://root:root@localhost:3306/ekbms_db
SECRET_KEY=your-super-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
```

Initialize tables and seed demo data:

```bash
# Start the server once — SQLAlchemy auto-creates all tables on first run
uvicorn app.main:app --reload

# Stop the server (Ctrl+C), then seed demo data:
python seed.py
```

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend runs at **http://localhost:5173** and proxies `/api` requests to the backend at `http://localhost:8000`.

---

## Running the Project

### Option A — Convenience Scripts (Windows)

```bash
# From the project root:
start-backend.bat
start-frontend.bat
```

### Option B — Manual

**Terminal 1 — Backend:**
```bash
cd backend
venv\Scripts\activate
uvicorn app.main:app --reload --port 8000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## Demo Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@ekbms.com | Admin@123 |
| Author | author@ekbms.com | Author@123 |
| Reviewer | reviewer@ekbms.com | Review@123 |
| Employee | employee@ekbms.com | Employee@123 |

> All accounts are pre-seeded by `backend/seed.py`. Click any role card on the login page to autofill credentials.

---

## API Reference

All endpoints are prefixed with `/api`. Interactive docs available at:
- **Swagger UI** → http://localhost:8000/api/docs
- **ReDoc** → http://localhost:8000/api/redoc

> All endpoints except `/api/auth/login`, `/api/auth/register`, `/api/auth/forgot-password`, and `/api/auth/reset-password` require a Bearer token in the `Authorization` header.

---

### Authentication — `/api/auth`

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register a new user | No |
| `POST` | `/api/auth/login` | Login and receive JWT tokens | No |
| `POST` | `/api/auth/refresh` | Refresh access token | No |
| `GET` | `/api/auth/me` | Get current user profile | Yes |
| `POST` | `/api/auth/forgot-password` | Request password reset link | No |
| `POST` | `/api/auth/reset-password` | Reset password with token | No |
| `POST` | `/api/auth/change-password` | Change own password | Yes |

**Login — Request:**
```json
POST /api/auth/login
{
  "email": "admin@ekbms.com",
  "password": "Admin@123"
}
```
**Login — Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

---

### Articles — `/api/articles`

| Method | Endpoint | Description | Auth | Roles |
|---|---|---|---|---|
| `GET` | `/api/articles` | List articles (paginated + filtered) | Yes | All |
| `POST` | `/api/articles` | Create a new article | Yes | Admin, Author, Reviewer |
| `GET` | `/api/articles/my` | List current user's own articles | Yes | All |
| `GET` | `/api/articles/{id}` | Get article detail (increments view count) | Yes | All |
| `PUT` | `/api/articles/{id}` | Update article or change status | Yes | Owner / Admin |
| `DELETE` | `/api/articles/{id}` | Delete article | Yes | Owner / Admin |

**Query params for `GET /api/articles`:**
```
page=1          Page number (default: 1)
per_page=10     Items per page (1–100)
status=         Filter by status (draft/pending_approval/approved/published/rejected/archived)
category_id=    Filter by category
author_id=      Filter by author
```

**Create Article — Request:**
```json
POST /api/articles
{
  "title": "Getting Started with FastAPI",
  "content": "<p>FastAPI is a modern web framework...</p>",
  "summary": "A beginner's guide to building APIs with FastAPI.",
  "category_id": 1,
  "tag_ids": [1, 3],
  "status": "draft"
}
```
**Create Article — Response:**
```json
{
  "id": 15,
  "title": "Getting Started with FastAPI",
  "summary": "A beginner's guide to building APIs with FastAPI.",
  "status": "draft",
  "view_count": 0,
  "published_at": null,
  "created_at": "2025-01-15T10:30:00Z",
  "updated_at": "2025-01-15T10:30:00Z",
  "author": { "id": 2, "name": "Alice Author", "email": "author@ekbms.com" },
  "category": { "id": 1, "name": "Engineering" },
  "tags": [{ "id": 1, "name": "python" }, { "id": 3, "name": "api" }],
  "avg_rating": null,
  "comment_count": 0,
  "is_bookmarked": false
}
```

---

### Approvals — `/api/approvals`

| Method | Endpoint | Description | Auth | Roles |
|---|---|---|---|---|
| `GET` | `/api/approvals/pending` | List all pending approval requests | Yes | Admin, Reviewer |
| `GET` | `/api/approvals/article/{id}` | Get approval history for an article | Yes | Admin, Reviewer, Owner |
| `POST` | `/api/approvals/{id}/action` | Approve or reject a submission | Yes | Admin, Reviewer |

**Approval Action — Request:**
```json
POST /api/approvals/3/action
{
  "status": "approved",
  "reviewer_comments": "Well-written and accurate. Approved for publishing."
}
```
**Approval Action — Response:**
```json
{
  "id": 3,
  "article_id": 7,
  "status": "approved",
  "reviewer_comments": "Well-written and accurate. Approved for publishing.",
  "submitted_at": "2025-01-14T09:00:00Z",
  "reviewed_at": "2025-01-15T11:00:00Z",
  "reviewer": { "id": 3, "name": "Ryan Reviewer" }
}
```

---

### Categories — `/api/categories`

| Method | Endpoint | Description | Auth | Roles |
|---|---|---|---|---|
| `GET` | `/api/categories` | List all categories with article counts | No | — |
| `GET` | `/api/categories/tree` | Hierarchical tree structure | No | — |
| `GET` | `/api/categories/{id}` | Get single category | No | — |
| `POST` | `/api/categories` | Create category | Yes | Admin |
| `PUT` | `/api/categories/{id}` | Update category | Yes | Admin |
| `DELETE` | `/api/categories/{id}` | Delete category (must be empty) | Yes | Admin |

---

### Tags — `/api/tags`

| Method | Endpoint | Description | Auth | Roles |
|---|---|---|---|---|
| `GET` | `/api/tags` | List all tags (alphabetical) | No | — |
| `POST` | `/api/tags` | Create tag (returns existing if duplicate) | Yes | All |
| `DELETE` | `/api/tags/{id}` | Delete tag | Yes | Admin |

---

### Users — `/api/users`

| Method | Endpoint | Description | Auth | Roles |
|---|---|---|---|---|
| `GET` | `/api/users` | List all users (paginated) | Yes | Admin |
| `GET` | `/api/users/roles` | List available roles | Yes | All |
| `GET` | `/api/users/{id}` | Get user by ID | Yes | Admin / Self |
| `PUT` | `/api/users/me` | Update own profile | Yes | All |
| `PUT` | `/api/users/{id}` | Admin update any user | Yes | Admin |
| `DELETE` | `/api/users/{id}` | Deactivate user account | Yes | Admin |

---

### Search — `/api/search`

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/search` | Full-text search with filters and sorting | Yes |
| `GET` | `/api/search/suggestions` | Autocomplete title suggestions | Yes |

**Query params for `GET /api/search`:**
```
q=              Search term (matches title, content, summary)
category_id=    Filter by category
tag_id=         Filter by tag
author_id=      Filter by author
sort_by=        latest (default) | popular | rating
page=1
per_page=10
```

---

### Dashboard — `/api/dashboard`

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/dashboard` | Full dashboard data (stats, charts, trends) | Yes |

**Response:**
```json
{
  "stats": {
    "total_articles": 14,
    "published_articles": 8,
    "pending_approvals": 2,
    "total_users": 4,
    "total_categories": 6,
    "total_views": 1240
  },
  "top_articles": [...],
  "category_distribution": [...],
  "recent_search_trends": [...],
  "monthly_articles": [...]
}
```

---

### Collaboration

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/articles/{id}/comments` | Get top-level comments for article | Yes |
| `POST` | `/api/articles/{id}/comments` | Add a comment | Yes |
| `PUT` | `/api/comments/{id}` | Edit own comment | Yes |
| `DELETE` | `/api/comments/{id}` | Delete own comment (or Admin) | Yes |
| `POST` | `/api/articles/{id}/rate` | Rate article 1–5 (upserts) | Yes |
| `GET` | `/api/bookmarks` | Get current user's bookmarks | Yes |
| `POST` | `/api/articles/{id}/bookmark` | Toggle bookmark on/off | Yes |

---

### File Attachments — `/api/files`

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/files/upload/{article_id}` | Upload file attachment to article | Yes |
| `GET` | `/api/files/download/{id}` | Download attachment | Yes |
| `DELETE` | `/api/files/{id}` | Delete attachment | Yes |

**Supported file types:** PDF, Word, Excel, PowerPoint, PNG, JPEG, GIF, WebP, plain text.

---

## Project Structure

```
ekbms/
├── backend/
│   ├── app/
│   │   ├── core/
│   │   │   ├── config.py          # App settings via pydantic-settings
│   │   │   ├── security.py        # JWT + bcrypt helpers
│   │   │   └── deps.py            # FastAPI dependency injectors
│   │   ├── models/                # SQLAlchemy ORM models
│   │   │   ├── user.py
│   │   │   ├── role.py
│   │   │   ├── article.py         # ArticleStatus enum + Article model
│   │   │   ├── category.py
│   │   │   ├── tag.py
│   │   │   ├── comment.py
│   │   │   ├── rating.py
│   │   │   ├── bookmark.py
│   │   │   ├── attachment.py
│   │   │   ├── approval.py
│   │   │   └── search_log.py
│   │   ├── schemas/               # Pydantic request/response schemas
│   │   │   ├── auth.py
│   │   │   ├── user.py
│   │   │   ├── article.py
│   │   │   ├── category.py
│   │   │   ├── tag.py
│   │   │   ├── approval.py
│   │   │   ├── comment.py
│   │   │   ├── rating.py
│   │   │   └── dashboard.py
│   │   ├── routes/                # API route handlers
│   │   │   ├── auth.py
│   │   │   ├── users.py
│   │   │   ├── articles.py
│   │   │   ├── categories.py
│   │   │   ├── tags.py
│   │   │   ├── approvals.py
│   │   │   ├── search.py
│   │   │   ├── dashboard.py
│   │   │   ├── collaboration.py
│   │   │   └── files.py
│   │   ├── database.py            # SQLAlchemy session factory
│   │   └── main.py                # FastAPI app, CORS, router registration
│   ├── seed.py                    # Demo data seeder (users, articles, comments…)
│   ├── requirements.txt
│   └── .env                       # Local config — not committed
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/            # AppLayout, Sidebar, Navbar
│   │   │   └── ui/                # Button, Input, Badge, Modal, etc.
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── ArticlesPage.jsx
│   │   │   ├── ArticleDetailPage.jsx
│   │   │   ├── CreateArticlePage.jsx
│   │   │   ├── EditArticlePage.jsx
│   │   │   ├── CategoriesPage.jsx
│   │   │   ├── UsersPage.jsx
│   │   │   ├── ApprovalsPage.jsx
│   │   │   ├── SearchPage.jsx
│   │   │   └── BookmarksPage.jsx
│   │   ├── store/
│   │   │   └── authStore.js       # Zustand auth state with persist
│   │   ├── lib/
│   │   │   └── api.js             # Axios instance + all API functions
│   │   └── App.jsx                # React Router v6 nested routes + guards
│   ├── index.html
│   ├── vite.config.js             # Vite + /api proxy config
│   └── package.json
│
├── start-backend.bat
├── start-frontend.bat
├── .gitignore
└── README.md
```

---

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `DATABASE_URL` | MySQL connection string | `mysql+pymysql://root:root@localhost:3306/ekbms_db` |
| `SECRET_KEY` | JWT signing secret | — (required) |
| `ALGORITHM` | JWT algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access token TTL | `30` |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Refresh token TTL | `7` |

---

## ETL Pipeline (Phase 2)

### Overview

The ETL pipeline imports 105 knowledge articles from a CSV dataset, cleans and normalises the data, loads it into MySQL, and refreshes four analytics tables used by the reporting dashboard.

```
datasets/articles.csv
        │
        ▼
┌───────────────┐    ┌──────────────────┐    ┌─────────────────────┐
│    EXTRACT    │───▶│    TRANSFORM     │───▶│        LOAD         │
│               │    │                  │    │                     │
│ Read CSV with │    │ • Strip whitespace│    │ • Upsert categories │
│ pandas        │    │ • Normalise cats  │    │ • Upsert tags       │
│ Validate cols │    │ • Parse tag lists │    │ • Import articles   │
│               │    │ • Cast numerics   │    │ • Refresh analytics │
│               │    │ • Derive read time│    │   tables            │
│               │    │ • Deduplicate     │    │ • Log ETL run       │
└───────────────┘    └──────────────────┘    └─────────────────────┘
                                                        │
                              ┌─────────────────────────┼──────────────────────┐
                              ▼                         ▼                      ▼
                  analytics_most_viewed   analytics_category_trends   analytics_author_stats
                  analytics_search_trends
```

### Dataset

**Location:** `datasets/articles.csv`

**105 articles** across 8 categories:

| Category | Count |
|---|---|
| Engineering | 21 |
| Security | 15 |
| DevOps | 16 |
| Data Science | 15 |
| Product Management | 11 |
| HR & Culture | 11 |
| Finance | 8 |
| Legal & Compliance | 8 |

**CSV columns:** `id, title, category, tags, author_name, author_email, views, avg_rating, word_count, status, created_date, summary`

### Running the ETL Pipeline

**Option A — From the UI (Admin only):**
1. Log in as Admin
2. Go to **ETL & Analytics** in the sidebar
3. Click **Run ETL Pipeline**
4. The page auto-refreshes and shows the run result

**Option B — From the terminal (standalone script):**
```bash
cd "Enterprise Knowledge Based Management System"
backend\venv\Scripts\activate

# Run the pipeline directly
python etl/pipeline.py
```

### ETL Scripts

| File | Stage | Description |
|---|---|---|
| `etl/extract.py` | Extract | Reads `datasets/articles.csv` with pandas; validates required columns |
| `etl/transform.py` | Transform | Cleans text, normalises categories, parses tags, casts numerics, deduplicates |
| `etl/load.py` | Load | Upserts categories/tags/authors, imports articles, refreshes all analytics tables |
| `etl/pipeline.py` | Orchestrate | Runs E→T→L in sequence; logs timing and errors to `etl_run_log` table |

### Analytics APIs

| Endpoint | Description |
|---|---|
| `GET /api/analytics/summary` | All analytics in one response |
| `GET /api/analytics/most-viewed` | Top articles by view count |
| `GET /api/analytics/category-trends` | Articles + views per category |
| `GET /api/analytics/author-activity` | Per-author article and view stats |
| `GET /api/analytics/search-keywords` | Top searched keywords |
| `POST /api/etl/run` | Trigger ETL pipeline (Admin) |
| `GET /api/etl/history` | ETL run history (Admin) |
| `GET /api/etl/status/{id}` | Single ETL run status (Admin) |

### Analytics Dashboard Features

- **Most Viewed Articles** — horizontal bar chart (top 10 by views)
- **Category Usage Trends** — donut pie chart (article count per category)
- **Author Activity Report** — bar chart + detail table (articles, views, avg rating)
- **Search Keyword Analysis** — bar chart + keyword pill badges
- **Category Views Breakdown** — stacked bar chart (total views per category)
- **ETL Run History** — table of past runs with status, counts, and duration

---

## Screenshots

> Add screenshots to a `screenshots/` folder at the project root and update the paths below.

### Dashboard
![Dashboard overview with stats cards, top articles, and charts](screenshots/dashboard.png)

### Article Listing
![Article list with filters, search bar, status badges, and pagination](screenshots/articles-list.png)

### Article Detail
![Article detail view with rich content, rating, comments, and bookmark](screenshots/article-detail.png)

### Create / Edit Article
![TipTap rich-text editor with category and tag selection](screenshots/article-editor.png)

### Approval Queue
![Pending approvals list for Reviewers with approve/reject actions](screenshots/approvals.png)

### User Management
![Admin user list with role badges and deactivation controls](screenshots/users.png)

### Search
![Full-text search page with filters by category, tag, and sort order](screenshots/search.png)

### API — Swagger UI
![Swagger interactive API documentation at /api/docs](screenshots/swagger.png)

### Login Page
![Login page with demo credential quick-fill cards for all 4 roles](screenshots/login.png)

---

## License

MIT
