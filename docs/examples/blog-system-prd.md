# Blog CMS System — Product Requirements Document (PRD)

**Version:** 1.0  
**Status:** Draft  
**Last Updated:** 2026-04-18  
**Product Owner:** Content Platform Team  
**Engineering Lead:** Platform Architecture  

---

## 1. Overview

### 1.1 Purpose

This document defines the requirements for **Blogify** — a self-hosted blog content management system (CMS) designed for individual bloggers, small editorial teams, and content creators who want full ownership and control over their publishing workflow. Blogify replaces SaaS platforms like Medium and Ghost with a lightweight, extensible, open-source alternative.

### 1.2 Problem Statement

Existing solutions suffer from:

- **Vendor lock-in**: Content lives in proprietary formats, making migration painful
- **Excessive complexity**: Over-engineered admin panels slow down daily publishing
- **Poor performance**: Server-rendered pages with no CDN integration out of the box
- **Limited extensibility**: No plugin architecture for custom functionality

### 1.3 Goals

- Deliver a sub-200ms page load experience on commodity hardware
- Enable one-click deployment via Docker and Docker Compose
- Provide a clean REST API for third-party integrations and mobile clients
- Support markdown-first editing with a live preview

---

## 2. User Segments

| Segment | Description | Primary Actions |
|---------|-------------|-----------------|
| **Visitor** | Unauthenticated user browsing the public blog | Read posts, search, browse by category/tag |
| **Author** | Creates and publishes blog content | Write/edit/delete posts, manage comments, upload media |
| **Admin** | Manages system settings and users | Manage authors, categories, tags, site config |

---

## 3. User Stories

### 3.1 Authentication: Registration & Login

#### US-001: User Registration

**As a** new visitor  
**I want to** create an account  
**So that** I can author and publish blog posts

**Acceptance Criteria:**

- [ ] User provides a valid email address, display name, and password (min. 8 chars, 1 uppercase, 1 number)
- [ ] System sends a verification email within 30 seconds of registration
- [ ] User clicks the verification link and account transitions to `active` status
- [ ] Duplicate email addresses are rejected with a clear error message
- [ ] After verification, user is automatically logged in and redirected to `/dashboard`
- [ ] Registration form is protected against CSRF attacks via token validation
- [ ] Rate limiting: max 5 registration attempts per IP per hour

**Technical Notes:**

- Passwords stored using bcrypt with cost factor 12
- Email verification tokens expire after 24 hours
- Sessions managed via signed HTTP-only cookies (7-day expiry, refreshed on activity)

---

#### US-002: User Login

**As a** registered author  
**I want to** log into my account  
**So that** I can access the admin dashboard and publish content

**Acceptance Criteria:**

- [ ] User enters email and password; system validates credentials
- [ ] Successful login sets a signed session cookie and redirects to `/dashboard`
- [ ] Failed login shows "Invalid email or password" (no information leakage about which field is wrong)
- [ ] After 5 consecutive failed attempts, account is locked for 15 minutes (with notification to email)
- [ ] "Remember me" checkbox extends session to 30 days
- [ ] Login page includes a working "Forgot password?" link

**Edge Cases:**

- Attempting to login with an unverified email shows: "Please verify your email first. <Resend verification>"
- Attempting to login to a locked account shows: "Account locked. Try again in X minutes."

---

#### US-003: Password Reset

**As a** locked-out or forgotten-password user  
**I want to** reset my password via email  
**So that** I can regain access to my account

**Acceptance Criteria:**

- [ ] User enters registered email; system sends a reset link if email exists (silent success for security)
- [ ] Reset link contains a time-limited token (15-minute expiry)
- [ ] User sets a new password meeting the same complexity rules
- [ ] After successful reset, all existing sessions are invalidated (forced re-login)
- [ ] Reset token is single-use; attempting to reuse shows an error

---

### 3.2 Blog Post CRUD

#### US-010: Create a New Post

**As an** authenticated author  
**I want to** create a new blog post  
**So that** I can share content with readers

**Acceptance Criteria:**

- [ ] Author navigates to `/dashboard/posts/new` and sees the editor interface
- [ ] Editor supports Markdown input with a split-pane live preview (rendered in real-time, <100ms latency)
- [ ] Required fields: `title` (5–120 chars), `slug` (auto-generated from title, editable, URL-safe), `content` (min. 100 chars), `status`
- [ ] Post statuses: `draft`, `scheduled`, `published`, `archived`
- [ ] Author can select one or more categories and tags for the post
- [ ] Author can upload a featured image (JPEG/PNG/WebP, max 5MB, auto-resized to 1200×630 for OG tags)
- [ ] Saving as draft auto-saves every 30 seconds (debounced) and shows "Draft saved at HH:MM"
- [ ] "Publish" button is disabled until all required fields are valid
- [ ] On publish, the post appears in the public feed within 60 seconds (cache invalidation)

**Technical Notes:**

- Content stored as raw Markdown; HTML is rendered at request time (or cached)
- Slug uniqueness scoped to the author (two authors can have the same slug)
- Image upload uses multipart/form-data, stored in `/uploads/{year}/{month}/{slug}-{hash}.{ext}`

---

#### US-011: Edit an Existing Post

**As an** author  
**I want to** edit my own posts  
**So that** I can correct errors or update content

**Acceptance Criteria:**

- [ ] Author navigates to `/dashboard/posts` and sees a list of their posts with status badges
- [ ] Clicking "Edit" on a post opens the editor pre-populated with existing content
- [ ] Editing a published post triggers a "Last updated" timestamp on the public page
- [ ] Changing the slug of a published post creates a 301 redirect from the old URL
- [ ] Authors can only edit their own posts; attempting to edit another's post returns 403
- [ ] Revision history stores up to 10 previous versions; author can preview and restore any version
- [ ] Autosave continues during editing; manual "Save" button available

**Edge Cases:**

- If another author edits the same post simultaneously, the second save shows: "Post was modified by [Author] at HH:MM. Please refresh and re-apply your changes."
- Editing a scheduled post changes its status back to `draft` unless the author explicitly re-schedules

---

#### US-012: Delete a Post

**As an** author  
**I want to** permanently delete my posts  
**So that** I can remove unwanted or outdated content

**Acceptance Criteria:**

- [ ] Author clicks "Delete" on a post; a confirmation modal appears: "Are you sure? This action cannot be undone."
- [ ] Deletion requires typing the post title to confirm (prevents accidental clicks)
- [ ] Deleted posts are soft-deleted (marked `deleted_at` timestamp) and recoverable by admin for 30 days
- [ ] After 30 days, a background job hard-deletes the post and associated media
- [ ] All comments on the post are also soft-deleted
- [ ] Public URLs for deleted posts return 410 Gone

---

#### US-013: Publish / Unpublish a Post

**As an** author  
**I want to** control when my posts are publicly visible  
**So that** I can maintain editorial consistency

**Acceptance Criteria:**

- [ ] "Publish" action sets `status: published` and `published_at: now()`; URL becomes publicly accessible
- [ ] "Unpublish" action sets `status: archived`; URL returns 404 but content is preserved
- [ ] "Schedule" action requires a future datetime; post goes live automatically at that time
- [ ] Scheduled posts appear in the author's dashboard with a countdown ("Publishes in 2 days")
- [ ] Author can edit the scheduled time before publication; canceling schedule returns to `draft`

---

### 3.3 Comments

#### US-020: Leave a Comment

**As a** visitor  
**I want to** leave a comment on a blog post  
**So that** I can engage in discussion with the author and other readers

**Acceptance Criteria:**

- [ ] Comment form appears below each published post
- [ ] Visitor must provide a display name (2–50 chars) and a valid email (not displayed publicly)
- [ ] Comment body: 10–2000 characters; no HTML allowed (plaintext with auto-linkified URLs)
- [ ] On submit, comment enters `pending` status (not visible until approved)
- [ ] Visitor receives an email notification when their comment is approved or rejected
- [ ] Author receives an email notification for each new pending comment
- [ ] Akismet-style spam detection: flagged comments are auto-rejected with no notification to submitter

**Technical Notes:**

- Comments are threaded (max depth: 3 levels); replies reference `parent_id`
- Rate limiting: max 3 comments per IP per post per hour
- Email notifications sent via async job queue (not blocking the response)

---

#### US-021: Moderate Comments

**As an** author  
**I want to** approve, reject, or delete comments  
**So that** I can keep discussions civil and on-topic

**Acceptance Criteria:**

- [ ] Author sees a comment queue at `/dashboard/comments` with filters: All / Pending / Approved / Rejected / Spam
- [ ] Each comment shows: author name, email (masked: j***@example.com), post title, timestamp, content preview
- [ ] "Approve" publishes the comment immediately on the public post
- [ ] "Reject" sends the comment to `rejected` status; visitor sees no change but author sees it in history
- [ ] "Mark as Spam" moves comment to `spam` status and optionally trains spam filter
- [ ] "Delete" permanently removes the comment (with confirmation)
- [ ] Bulk actions: select multiple comments and approve/reject/delete in one operation
- [ ] Author can enable auto-approve for comments from previously approved email addresses

---

#### US-022: Reply to a Comment

**As a** visitor or author  
**I want to** reply to an existing comment  
**So that** I can participate in threaded discussions

**Acceptance Criteria:**

- [ ] "Reply" button appears on each comment (max depth 3)
- [ ] Reply form pre-fills `@parent_author` mention
- [ ] Replies follow the same moderation workflow as top-level comments
- [ ] Author replies are auto-approved (no moderation queue needed)

---

### 3.4 Categories & Tags

#### US-030: Manage Categories

**As an** admin  
**I want to** create, edit, and delete categories  
**So that** I can organize blog content hierarchically

**Acceptance Criteria:**

- [ ] Categories support a single-level hierarchy (parent → child), max 2 levels deep
- [ ] Admin provides: `name` (2–30 chars), `slug` (URL-safe, unique), `description` (optional, max 160 chars), `parent` (optional)
- [ ] Category list in dashboard shows post count per category
- [ ] Deleting a category with posts requires reassigning those posts to another category or "Uncategorized"
- [ ] Changing a category's slug does NOT create redirects (categories are not linked from posts directly)

---

#### US-031: Manage Tags

**As an** author or admin  
**I want to** create and manage tags  
**So that** I can label posts with non-hierarchical keywords

**Acceptance Criteria:**

- [ ] Tags are flat (no hierarchy); auto-created when added to a post
- [ ] Tag name: 2–50 chars, auto-slugified (lowercase, hyphenated)
- [ ] Tags with identical slugs are merged (case-insensitive deduplication)
- [ ] Admin can view all tags at `/dashboard/tags` sorted by usage count
- [ ] Admin can rename or delete a tag; renaming updates all associated posts
- [ ] Deleting a tag removes it from all posts (no reassignment needed)
- [ ] Popular tags (used on 5+ posts) appear in the site's tag cloud widget

---

#### US-032: Assign Categories/Tags to Posts

**As an** author  
**I want to** assign categories and tags when creating or editing a post  
**So that** readers can discover my content through taxonomy

**Acceptance Criteria:**

- [ ] In the post editor, category is a single-select dropdown (one category per post)
- [ ] Tags are a multi-select input with autocomplete; existing tags appear as user types
- [ ] Creating a new tag inline (typing a new name and pressing Enter) is supported
- [ ] Post must have at least one category or one tag before publishing
- [ ] Category and tag assignment is visible in the public post's metadata section

---

### 3.5 Search

#### US-040: Search Posts

**As a** visitor  
**I want to** search for blog posts by keyword  
**So that** I can find relevant content quickly

**Acceptance Criteria:**

- [ ] Search bar is present in the site header on all public pages
- [ ] Search is triggered by pressing Enter or clicking the search icon
- [ ] Results page (`/search?q=keyword`) shows posts where the keyword matches `title`, `content`, or `tag name`
- [ ] Results are ranked: exact title match > title contains > content contains > tag match
- [ ] Results display: post title (with query term highlighted), excerpt (first 150 chars with highlights), category, date, author
- [ ] Pagination: 10 results per page; URL preserves query (`/search?q=keyword&page=2`)
- [ ] Empty state: "No posts found for 'keyword'. Try a different search term or browse by category."
- [ ] Search executes in <300ms for a database of up to 100,000 posts (using indexed full-text search)

**Technical Notes:**

- Full-text search implemented via database-level indexes (e.g., PostgreSQL `tsvector` or SQLite FTS5)
- Search is case-insensitive
- Special characters in query are escaped to prevent injection
- Minimum query length: 2 characters

---

#### US-041: Filter Posts by Category or Tag

**As a** visitor  
**I want to** click a category or tag link  
**So that** I can browse all posts in a specific topic

**Acceptance Criteria:**

- [ ] Category pages live at `/category/{slug}`; tag pages at `/tag/{slug}`
- [ ] Each page shows: category/tag name, description (if available), post list
- [ ] Post list is sorted reverse-chronologically; pagination at 20 posts per page
- [ ] Sidebar on these pages shows related categories/tags (co-occurrence sorted by frequency)

---

## 4. Non-Functional Requirements

### 4.1 Performance

| Metric | Target |
|--------|--------|
| Time to First Byte (TTFB) | < 100ms (cached), < 400ms (dynamic) |
| First Contentful Paint (FCP) | < 1.2s |
| Search query response | < 300ms |
| Editor autosave latency | < 100ms |

### 4.2 Security

- All passwords hashed with bcrypt (cost factor 12)
- All forms protected with CSRF tokens
- SQL injection prevented via parameterized queries
- XSS prevented via output encoding (HTML escaping)
- Session cookies: `HttpOnly`, `Secure`, `SameSite=Lax`
- Rate limiting on all public write endpoints
- Content Security Policy (CSP) headers configured

### 4.3 Accessibility

- WCAG 2.1 AA compliance target
- Keyboard navigation for all interactive elements
- ARIA labels on form inputs and buttons
- Sufficient color contrast (4.5:1 minimum)
- Screen reader tested on post editor and comment forms

### 4.4 Data & Backup

- Database backups: daily incremental, weekly full; retained for 30 days
- Media files backed up alongside database (or via object storage)
- One-click export of all content as JSON (portability)
- GDPR-compliant: users can request data export or account deletion

---

## 5. Out of Scope (v1.0)

The following are deferred to future releases:

- Multi-author blogs with per-author analytics
- Custom themes and theme marketplace
- Plugin / extension system
- Email digest / newsletter integration
- Social sharing automation
- Full-text RSS feed
- Two-factor authentication (2FA)
- LDAP / OAuth SSO integration

---

## 6. Glossary

| Term | Definition |
|------|------------|
| **Author** | Authenticated user who creates and publishes blog posts |
| **Status** | Lifecycle state of a post: draft, scheduled, published, archived |
| **Slug** | URL-safe identifier derived from a post or category title |
| **Soft delete** | Marking a record as deleted without physically removing it from the database |
| **CSRF** | Cross-Site Request Forgery — attack vector mitigated via token validation |
| **FTS** | Full-Text Search — database feature for keyword-based content search |

---

## 7. Appendix: API Endpoints (v1)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Authenticate and receive session cookie |
| POST | `/api/auth/logout` | Invalidate session |
| POST | `/api/auth/forgot-password` | Send password reset email |
| POST | `/api/auth/reset-password` | Reset password with token |
| GET | `/api/posts` | List published posts (paginated) |
| POST | `/api/posts` | Create a new post |
| GET | `/api/posts/{slug}` | Get single post by slug |
| PUT | `/api/posts/{id}` | Update a post |
| DELETE | `/api/posts/{id}` | Soft-delete a post |
| GET | `/api/comments?post_id={id}` | List approved comments for a post |
| POST | `/api/comments` | Submit a new comment |
| PUT | `/api/comments/{id}/moderate` | Approve/reject/delete comment (author only) |
| GET | `/api/categories` | List all categories |
| POST | `/api/categories` | Create a category (admin only) |
| PUT | `/api/categories/{id}` | Update a category (admin only) |
| DELETE | `/api/categories/{id}` | Delete a category (admin only) |
| GET | `/api/tags` | List all tags |
| POST | `/api/tags` | Create a tag |
| DELETE | `/api/tags/{id}` | Delete a tag (admin only) |
| GET | `/api/search?q={query}` | Full-text search |

---

*Document prepared for internal engineering review. Questions? Contact the Platform Architecture team.*
