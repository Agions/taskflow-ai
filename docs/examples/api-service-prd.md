# API Service Product Requirements Document (PRD)

**Version:** 1.0  
**Status:** Draft  
**Last Updated:** April 18, 2026  
**Author:** TaskFlow AI Product Team

---

## 1. Introduction

### 1.1 Purpose

This PRD defines the requirements for **CommerceAPI**, a RESTful API service that provides JWT-authenticated user management, product catalog browsing, and order processing capabilities. The service targets e-commerce platform developers who need a reliable backend foundation for building web and mobile storefronts.

### 1.2 Scope

CommerceAPI will expose a set of HTTP endpoints for:

- **Authentication** — User registration, login, JWT token management, and refresh flows
- **User Management** — Profile retrieval, update, password change, and account deletion
- **Product Catalog** — Browsing, searching, filtering, and detail retrieval for products
- **Order Management** — Cart operations, order placement, order history, and status tracking
- **API Rate Limiting** — Protection against abuse via per-user and per-endpoint throttling

### 1.3 Target Users

| User Role | Description |
|-----------|-------------|
| **End Customer** | Browses products, manages cart, places orders |
| **Store Admin** | Manages product inventory and views all orders |
| **API Consumer** | Third-party developer integrating via REST |

---

## 2. User Stories

### 2.1 Authentication

| ID | User Story |
|----|-----------|
| AUTH-001 | As a new user, I want to register with an email and password so that I can create an account |
| AUTH-002 | As a registered user, I want to log in with credentials and receive a JWT so that I can access protected endpoints |
| AUTH-003 | As an authenticated user, I want to refresh my expired access token so that I don't get logged out mid-session |
| AUTH-004 | As a user, I want to log out and invalidate my token so that my session is securely terminated |
| AUTH-005 | As a system, I want to enforce strong password rules so that user credentials are not easily compromised |

### 2.2 User Management

| ID | User Story |
|----|-----------|
| USR-001 | As an authenticated user, I want to view my profile so that I can verify my account details |
| USR-002 | As an authenticated user, I want to update my name, email, and phone number so that my profile stays current |
| USR-003 | As an authenticated user, I want to change my password so that I can maintain account security |
| USR-004 | As an authenticated user, I want to delete my account so that I can remove my data per privacy regulations |
| USR-005 | As an admin, I want to list all users with pagination so that I can manage the user base |

### 2.3 Product Catalog

| ID | User Story |
|----|-----------|
| PRD-001 | As a customer, I want to browse products with pagination so that I can discover items efficiently |
| PRD-002 | As a customer, I want to search products by keyword so that I can find specific items |
| PRD-003 | As a customer, I want to filter products by category, price range, and availability so that I can narrow my choices |
| PRD-004 | As a customer, I want to view product details including images, description, and stock level so that I can make informed decisions |
| PRD-005 | As an admin, I want to create, update, and deactivate products so that the catalog stays accurate |
| PRD-006 | As a customer, I want to view related products so that I can discover alternatives |

### 2.4 Order Management

| ID | User Story |
|----|-----------|
| ORD-001 | As a customer, I want to add items to a cart so that I can collect products before purchasing |
| ORD-002 | As a customer, I want to update item quantities or remove items from my cart so that I can adjust my order |
| ORD-003 | As a customer, I want to place an order from my cart so that I can complete a purchase |
| ORD-004 | As a customer, I want to view my order history with status so that I can track past purchases |
| ORD-005 | As a customer, I want to view order details including items, totals, and shipping info so that I can verify an order |
| ORD-006 | As an admin, I want to update order status (pending → shipped → delivered → cancelled) so that customers stay informed |
| ORD-007 | As a customer, I want to cancel an order only if it hasn't shipped yet so that I can undo mistakes |

### 2.5 Rate Limiting

| ID | User Story |
|----|-----------|
| RAT-001 | As the system, I want to limit authenticated users to 1000 requests/hour so that no single user monopolizes resources |
| RAT-002 | As the system, I want to limit unauthenticated users to 100 requests/hour so that anonymous abuse is prevented |
| RAT-003 | As the system, I want to apply stricter limits (10 requests/minute) on auth-sensitive endpoints so that brute-force attacks are mitigated |
| RAT-004 | As an authenticated user, I want to receive clear 429 responses with retry-after headers so that I can handle throttling gracefully |

---

## 3. System Architecture

### 3.1 Technology Stack

| Layer | Technology |
|-------|------------|
| API Framework | Node.js + Express.js |
| Database | PostgreSQL 15 |
| ORM | Prisma |
| Authentication | JWT (access + refresh tokens) |
| Validation | Joi / Zod |
| Rate Limiting | express-rate-limit + Redis |
| Caching | Redis |
| Password Hashing | bcrypt (cost factor 12) |
| API Documentation | OpenAPI 3.0 (Swagger) |

### 3.2 High-Level Architecture

```
                    ┌─────────────────┐
  Client Request───▶│   Nginx/Envoy   │─── Rate Limit Layer
                    │   (Reverse      │
                    │    Proxy)       │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   Express API   │─── JWT Validation
                    │   (Stateless)   │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
       ┌──────▼──────┐ ┌─────▼─────┐ ┌──────▼──────┐
       │  PostgreSQL │ │   Redis   │ │  Background │
       │  (Primary)  │ │ (Cache +  │ │   Workers   │
       │             │ │  Sessions)│ │             │
       └─────────────┘ └───────────┘ └─────────────┘
```

---

## 4. Database Schema

### 4.1 Entity Relationship Diagram

```
users ────────< orders
  │              │
  │              ├──< order_items
  │              │
  │              └──< payments
  │
  └──< addresses
  │
  └──< refresh_tokens

categories ─────< products >──────< product_images
                    │
                    └──< product_reviews

carts >─────< cart_items
```

### 4.2 Tables

#### `users`

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() |
| email | VARCHAR(255) | UNIQUE, NOT NULL |
| password_hash | VARCHAR(255) | NOT NULL |
| first_name | VARCHAR(100) | NOT NULL |
| last_name | VARCHAR(100) | NOT NULL |
| phone | VARCHAR(20) | NULL |
| role | ENUM('customer', 'admin') | DEFAULT 'customer' |
| is_active | BOOLEAN | DEFAULT true |
| created_at | TIMESTAMP | DEFAULT NOW() |
| updated_at | TIMESTAMP | DEFAULT NOW() |

#### `addresses`

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| user_id | UUID | FK → users.id, NOT NULL |
| label | VARCHAR(50) | NOT NULL (e.g., "Home", "Work") |
| street | VARCHAR(255) | NOT NULL |
| city | VARCHAR(100) | NOT NULL |
| state | VARCHAR(100) | NOT NULL |
| postal_code | VARCHAR(20) | NOT NULL |
| country | VARCHAR(100) | NOT NULL |
| is_default | BOOLEAN | DEFAULT false |
| created_at | TIMESTAMP | DEFAULT NOW() |

#### `categories`

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| name | VARCHAR(100) | UNIQUE, NOT NULL |
| slug | VARCHAR(100) | UNIQUE, NOT NULL |
| description | TEXT | NULL |
| parent_id | UUID | FK → categories.id, NULL |
| sort_order | INT | DEFAULT 0 |
| is_active | BOOLEAN | DEFAULT true |
| created_at | TIMESTAMP | DEFAULT NOW() |

#### `products`

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| sku | VARCHAR(50) | UNIQUE, NOT NULL |
| name | VARCHAR(255) | NOT NULL |
| slug | VARCHAR(255) | UNIQUE, NOT NULL |
| description | TEXT | NULL |
| price | DECIMAL(12,2) | NOT NULL, CHECK(price >= 0) |
| compare_at_price | DECIMAL(12,2) | NULL |
| cost_price | DECIMAL(12,2) | NULL |
| quantity | INT | DEFAULT 0, CHECK(quantity >= 0) |
| category_id | UUID | FK → categories.id |
| is_active | BOOLEAN | DEFAULT true |
| weight | DECIMAL(8,2) | NULL (in kg) |
| created_at | TIMESTAMP | DEFAULT NOW() |
| updated_at | TIMESTAMP | DEFAULT NOW() |

#### `product_images`

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| product_id | UUID | FK → products.id, NOT NULL |
| url | VARCHAR(500) | NOT NULL |
| alt_text | VARCHAR(255) | NULL |
| sort_order | INT | DEFAULT 0 |
| created_at | TIMESTAMP | DEFAULT NOW() |

#### `product_reviews`

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| product_id | UUID | FK → products.id, NOT NULL |
| user_id | UUID | FK → users.id, NOT NULL |
| rating | INT | NOT NULL, CHECK(rating BETWEEN 1 AND 5) |
| title | VARCHAR(255) | NULL |
| comment | TEXT | NULL |
| is_verified | BOOLEAN | DEFAULT false |
| created_at | TIMESTAMP | DEFAULT NOW() |

#### `carts`

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| user_id | UUID | FK → users.id, UNIQUE, NOT NULL |
| session_id | VARCHAR(255) | NULL (for guest carts) |
| created_at | TIMESTAMP | DEFAULT NOW() |
| updated_at | TIMESTAMP | DEFAULT NOW() |

#### `cart_items`

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| cart_id | UUID | FK → carts.id, NOT NULL |
| product_id | UUID | FK → products.id, NOT NULL |
| quantity | INT | NOT NULL, CHECK(quantity > 0) |
| created_at | TIMESTAMP | DEFAULT NOW() |
| updated_at | TIMESTAMP | DEFAULT NOW() |

**Unique constraint:** (cart_id, product_id)

#### `orders`

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| order_number | VARCHAR(20) | UNIQUE, NOT NULL |
| user_id | UUID | FK → users.id, NOT NULL |
| status | ENUM('pending','confirmed','processing','shipped','delivered','cancelled') | DEFAULT 'pending' |
| subtotal | DECIMAL(12,2) | NOT NULL |
| tax_amount | DECIMAL(12,2) | DEFAULT 0 |
| shipping_amount | DECIMAL(12,2) | DEFAULT 0 |
| discount_amount | DECIMAL(12,2) | DEFAULT 0 |
| total | DECIMAL(12,2) | NOT NULL |
| shipping_address | JSONB | NOT NULL |
| billing_address | JSONB | NOT NULL |
| notes | TEXT | NULL |
| created_at | TIMESTAMP | DEFAULT NOW() |
| updated_at | TIMESTAMP | DEFAULT NOW() |

#### `order_items`

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| order_id | UUID | FK → orders.id, NOT NULL |
| product_id | UUID | FK → products.id, NOT NULL |
| product_name | VARCHAR(255) | NOT NULL (snapshot) |
| product_sku | VARCHAR(50) | NOT NULL (snapshot) |
| unit_price | DECIMAL(12,2) | NOT NULL |
| quantity | INT | NOT NULL |
| total | DECIMAL(12,2) | NOT NULL |
| created_at | TIMESTAMP | DEFAULT NOW() |

#### `payments`

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| order_id | UUID | FK → orders.id, NOT NULL |
| provider | VARCHAR(50) | NOT NULL (e.g., 'stripe', 'paypal') |
| provider_reference | VARCHAR(255) | NULL |
| amount | DECIMAL(12,2) | NOT NULL |
| currency | VARCHAR(3) | DEFAULT 'USD' |
| status | ENUM('pending','completed','failed','refunded') | DEFAULT 'pending' |
| created_at | TIMESTAMP | DEFAULT NOW() |
| updated_at | TIMESTAMP | DEFAULT NOW() |

#### `refresh_tokens`

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| user_id | UUID | FK → users.id, NOT NULL |
| token | VARCHAR(255) | UNIQUE, NOT NULL |
| expires_at | TIMESTAMP | NOT NULL |
| revoked | BOOLEAN | DEFAULT false |
| created_at | TIMESTAMP | DEFAULT NOW() |

#### `api_keys` (future / admin use)

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| user_id | UUID | FK → users.id, NOT NULL |
| name | VARCHAR(100) | NOT NULL |
| key_hash | VARCHAR(255) | UNIQUE, NOT NULL |
| last_used_at | TIMESTAMP | NULL |
| expires_at | TIMESTAMP | NULL |
| is_active | BOOLEAN | DEFAULT true |
| created_at | TIMESTAMP | DEFAULT NOW() |

### 4.3 Indexes

```sql
-- Performance indexes
CREATE INDEX idx_products_category ON products(category_id) WHERE is_active = true;
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_search ON products USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_number ON orders(order_number);
CREATE INDEX idx_cart_items_cart ON cart_items(cart_id);
CREATE INDEX idx_product_reviews_product ON product_reviews(product_id);
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
```

---

## 5. API Specification

### 5.1 Base URL

```
Production:  https://api.commerce.example.com/v1
Staging:     https://api.staging.commerce.example.com/v1
Local:       http://localhost:3000/v1
```

### 5.2 Global Headers

| Header | Required | Description |
|--------|----------|-------------|
| `Content-Type` | Yes | `application/json` |
| `Authorization` | Conditional | `Bearer <access_token>` for protected routes |
| `X-Request-ID` | Recommended | UUID for request tracing |
| `Accept-Language` | Optional | `en`, `es`, `fr`, etc. |

### 5.3 Global Response Format

**Success:**
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "requestId": "req_abc123",
    "timestamp": "2026-04-18T08:56:00.000Z"
  }
}
```

**Error:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable error message",
    "details": [ ... ]
  },
  "meta": {
    "requestId": "req_abc123",
    "timestamp": "2026-04-18T08:56:00.000Z"
  }
}
```

### 5.4 HTTP Status Codes

| Code | Usage |
|------|-------|
| 200 | Successful GET, PUT, PATCH |
| 201 | Successful POST (resource created) |
| 204 | Successful DELETE (no content) |
| 400 | Bad request / validation error |
| 401 | Missing or invalid authentication |
| 403 | Authenticated but not authorized |
| 404 | Resource not found |
| 409 | Conflict (e.g., duplicate email) |
| 422 | Business rule violation |
| 429 | Rate limit exceeded |
| 500 | Internal server error |

---

## 6. Endpoint Specifications

### 6.1 Authentication Endpoints

#### `POST /auth/register`

Register a new user account.

**Request:**
```json
{
  "email": "jane.doe@example.com",
  "password": "SecureP@ssw0rd!",
  "firstName": "Jane",
  "lastName": "Doe"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "usr_550e8400-e29b-41d4-a716-446655440000",
      "email": "jane.doe@example.com",
      "firstName": "Jane",
      "lastName": "Doe",
      "role": "customer"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 900
  }
}
```

**Validation Rules:**
- email: valid format, unique
- password: min 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special char
- firstName, lastName: 2–100 chars

---

#### `POST /auth/login`

Authenticate and receive tokens.

**Request:**
```json
{
  "email": "jane.doe@example.com",
  "password": "SecureP@ssw0rd!"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 900
  }
}
```

**Failed Login Response (401):**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Email or password is incorrect"
  }
}
```

---

#### `POST /auth/refresh`

Exchange a valid refresh token for a new access token.

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 900
  }
}
```

---

#### `POST /auth/logout`

Revoke the refresh token (single-device logout).

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (204):** No content

---

#### `POST /auth/logout-all`

Revoke all refresh tokens for the user (global logout).

**Headers:** `Authorization: Bearer <access_token>`  
**Response (204):** No content

---

#### `POST /auth/forgot-password`

Initiate password reset flow. Sends a time-limited token to the user's email.

**Request:**
```json
{
  "email": "jane.doe@example.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "If an account exists, a password reset email has been sent"
  }
}
```

---

#### `POST /auth/reset-password`

Complete password reset with token.

**Request:**
```json
{
  "token": "res_abc123def456",
  "newPassword": "NewSecureP@ss1!"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Password has been reset successfully"
  }
}
```

---

### 6.2 User Management Endpoints

#### `GET /users/me`

Get the authenticated user's profile.

**Headers:** `Authorization: Bearer <access_token>`  
**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "usr_550e8400-e29b-41d4-a716-446655440000",
    "email": "jane.doe@example.com",
    "firstName": "Jane",
    "lastName": "Doe",
    "phone": "+1-555-123-4567",
    "role": "customer",
    "addresses": [
      {
        "id": "addr_123",
        "label": "Home",
        "street": "123 Main St",
        "city": "San Francisco",
        "state": "CA",
        "postalCode": "94102",
        "country": "USA",
        "isDefault": true
      }
    ],
    "createdAt": "2026-01-15T10:30:00.000Z"
  }
}
```

---

#### `PATCH /users/me`

Update the authenticated user's profile.

**Request:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "phone": "+1-555-987-6543"
}
```

**Response (200):** Updated user object

---

#### `POST /users/me/change-password`

Change password while authenticated.

**Request:**
```json
{
  "currentPassword": "OldP@ssw0rd!",
  "newPassword": "NewP@ssw0rd!"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Password changed successfully"
  }
}
```

---

#### `DELETE /users/me`

Soft-delete the authenticated user's account.

**Headers:** `Authorization: Bearer <access_token>`  
**Response (204):** No content

**Note:** The user's `is_active` flag is set to `false`. Data is retained for 90 days per GDPR compliance before permanent deletion by a background job.

---

#### `GET /admin/users`

Admin-only: List all users with pagination.

**Headers:** `Authorization: Bearer <access_token>` (role: admin)  
**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| page | int | 1 | Page number |
| limit | int | 20 | Items per page (max 100) |
| sort | string | createdAt | Sort field |
| order | string | desc | Sort order (asc/desc) |
| search | string | null | Search by name or email |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "users": [ ... ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1542,
      "totalPages": 78
    }
  }
}
```

---

### 6.3 Product Catalog Endpoints

#### `GET /products`

List products with search, filter, and pagination.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| page | int | Page number (default: 1) |
| limit | int | Items per page (default: 20, max: 100) |
| search | string | Full-text search on name/description |
| category | uuid | Filter by category ID |
| minPrice | decimal | Minimum price |
| maxPrice | decimal | Maximum price |
| inStock | boolean | Filter only in-stock items |
| sort | string | Sort: price_asc, price_desc, newest, name_asc, relevance |
| fields | string | Comma-separated list of fields to return |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "prd_abc123",
        "name": "Wireless Bluetooth Headphones",
        "slug": "wireless-bluetooth-headphones",
        "price": 79.99,
        "compareAtPrice": 99.99,
        "quantity": 142,
        "category": {
          "id": "cat_electronics",
          "name": "Electronics"
        },
        "thumbnail": "https://cdn.example.com/images/headphones-thumb.jpg",
        "rating": 4.5,
        "reviewCount": 328
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 458,
      "totalPages": 23
    },
    "filters": {
      "categories": [ ... ],
      "priceRange": { "min": 4.99, "max": 1299.00 }
    }
  }
}
```

---

#### `GET /products/:slug`

Get full product details by slug.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "prd_abc123",
    "sku": "WBH-001",
    "name": "Wireless Bluetooth Headphones",
    "slug": "wireless-bluetooth-headphones",
    "description": "Premium noise-cancelling wireless headphones with 30-hour battery life...",
    "price": 79.99,
    "compareAtPrice": 99.99,
    "quantity": 142,
    "weight": 0.25,
    "category": {
      "id": "cat_electronics",
      "name": "Electronics",
      "path": ["Electronics", "Audio", "Headphones"]
    },
    "images": [
      {
        "id": "img_001",
        "url": "https://cdn.example.com/images/headphones-1.jpg",
        "altText": "Headphones front view",
        "sortOrder": 0
      }
    ],
    "attributes": {
      "color": "Matte Black",
      "connectivity": "Bluetooth 5.2",
      "batteryLife": "30 hours"
    },
    "rating": 4.5,
    "reviewCount": 328,
    "relatedProducts": [ ... ]
  }
}
```

---

#### `GET /products/:slug/reviews`

Get reviews for a product.

**Query Parameters:** `page`, `limit`, `rating` (filter by stars)  
**Response (200):**
```json
{
  "success": true,
  "data": {
    "reviews": [
      {
        "id": "rev_001",
        "user": { "id": "usr_123", "firstName": "John", "lastName": "D." },
        "rating": 5,
        "title": "Best headphones I've ever owned",
        "comment": "The noise cancellation is incredible...",
        "isVerified": true,
        "createdAt": "2026-03-10T14:22:00.000Z"
      }
    ],
    "pagination": { ... },
    "summary": {
      "averageRating": 4.5,
      "totalReviews": 328,
      "distribution": { "5": 210, "4": 72, "3": 31, "2": 10, "1": 5 }
    }
  }
}
```

---

#### `POST /products` (Admin)

Create a new product.

**Headers:** `Authorization: Bearer <access_token>` (role: admin)  
**Request:**
```json
{
  "sku": "WBH-002",
  "name": "Wireless Bluetooth Headphones Pro",
  "description": "Advanced version with ANC...",
  "price": 129.99,
  "compareAtPrice": 149.99,
  "quantity": 50,
  "categoryId": "cat_electronics",
  "weight": 0.28,
  "images": [
    { "url": "https://cdn.example.com/images/pro-1.jpg", "altText": "Front view", "sortOrder": 0 }
  ]
}
```

**Response (201):** Created product object

---

#### `PUT /products/:id` (Admin)

Full update of a product.

#### `PATCH /products/:id` (Admin)

Partial update (only changed fields).

---

#### `DELETE /products/:id` (Admin)

Soft-delete a product (sets `is_active = false`).

**Response (204):** No content

---

### 6.4 Order Management Endpoints

#### `GET /cart`

Get the current user's cart.

**Headers:** `Authorization: Bearer <access_token>`  
**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "cart_abc123",
    "items": [
      {
        "id": "ci_001",
        "product": {
          "id": "prd_abc123",
          "name": "Wireless Bluetooth Headphones",
          "slug": "wireless-bluetooth-headphones",
          "thumbnail": "https://cdn.example.com/images/headphones-thumb.jpg",
          "price": 79.99,
          "quantity": 5
        },
        "quantity": 1,
        "subtotal": 79.99
      }
    ],
    "subtotal": 79.99,
    "itemCount": 1
  }
}
```

---

#### `POST /cart/items`

Add an item to the cart.

**Request:**
```json
{
  "productId": "prd_abc123",
  "quantity": 2
}
```

**Response (201):** Updated cart

**Business Rules:**
- If product already in cart, increment quantity
- If quantity exceeds available stock, return 422 with available quantity
- Guest users must provide a `sessionId`; authenticated users use their persistent cart

---

#### `PATCH /cart/items/:itemId`

Update quantity of a cart item.

**Request:**
```json
{
  "quantity": 3
}
```

**Response (200):** Updated cart

---

#### `DELETE /cart/items/:itemId`

Remove an item from the cart.

**Response (200):** Updated cart  
**Response (404):** If item not found in cart

---

#### `DELETE /cart`

Clear all items from the cart.

**Response (204):** No content

---

#### `POST /orders`

Place an order from the current cart.

**Request:**
```json
{
  "shippingAddressId": "addr_123",
  "billingAddressId": "addr_123",
  "paymentProvider": "stripe",
  "paymentToken": "tok_visa_xxxx",
  "notes": "Please leave at door"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "order": {
      "id": "ord_xyz789",
      "orderNumber": "ORD-20260418-0001",
      "status": "pending",
      "subtotal": 79.99,
      "taxAmount": 6.80,
      "shippingAmount": 5.99,
      "discountAmount": 0.00,
      "total": 92.78,
      "items": [ ... ],
      "shippingAddress": { ... },
      "billingAddress": { ... }
    },
    "payment": {
      "id": "pay_abc",
      "provider": "stripe",
      "status": "pending"
    }
  }
}
```

**Business Rules:**
- Cart must not be empty
- All items must be in stock at time of order
- Order number is auto-generated: `ORD-YYYYMMDD-XXXX`
- Order items snapshot product name, SKU, and price at time of purchase

---

#### `GET /orders`

Get the current user's order history.

**Query Parameters:** `page`, `limit`, `status`  
**Response (200):**
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": "ord_xyz789",
        "orderNumber": "ORD-20260418-0001",
        "status": "delivered",
        "total": 92.78,
        "itemCount": 1,
        "createdAt": "2026-04-18T08:30:00.000Z"
      }
    ],
    "pagination": { ... }
  }
}
```

---

#### `GET /orders/:orderNumber`

Get full order details.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "order": {
      "id": "ord_xyz789",
      "orderNumber": "ORD-20260418-0001",
      "status": "shipped",
      "trackingNumber": "1Z999AA10123456784",
      "subtotal": 79.99,
      "taxAmount": 6.80,
      "shippingAmount": 5.99,
      "discountAmount": 0.00,
      "total": 92.78,
      "items": [
        {
          "id": "oi_001",
          "productId": "prd_abc123",
          "productName": "Wireless Bluetooth Headphones",
          "productSku": "WBH-001",
          "unitPrice": 79.99,
          "quantity": 1,
          "total": 79.99
        }
      ],
      "shippingAddress": { ... },
      "billingAddress": { ... },
      "payment": {
        "id": "pay_abc",
        "provider": "stripe",
        "status": "completed",
        "amount": 92.78
      },
      "timeline": [
        { "status": "pending", "timestamp": "2026-04-18T08:30:00.000Z" },
        { "status": "confirmed", "timestamp": "2026-04-18T08:31:00.000Z" },
        { "status": "shipped", "timestamp": "2026-04-19T14:00:00.000Z" }
      ]
    }
  }
}
```

---

#### `POST /orders/:orderNumber/cancel`

Cancel an order (only if status is `pending` or `confirmed`).

**Request:**
```json
{
  "reason": "Ordered wrong size"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "order": {
      "id": "ord_xyz789",
      "status": "cancelled"
    },
    "message": "Order cancelled. Refund will be processed within 5-10 business days."
  }
}
```

---

#### `PATCH /admin/orders/:orderNumber/status` (Admin)

Update order status.

**Request:**
```json
{
  "status": "shipped",
  "trackingNumber": "1Z999AA10123456784",
  "notifyCustomer": true
}
```

**Response (200):** Updated order

---

### 6.5 Category Endpoints

#### `GET /categories`

List all active categories (hierarchical).

**Response (200):**
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "id": "cat_electronics",
        "name": "Electronics",
        "slug": "electronics",
        "productCount": 142,
        "children": [
          {
            "id": "cat_audio",
            "name": "Audio",
            "slug": "audio",
            "productCount": 38,
            "children": [ ... ]
          }
        ]
      }
    ]
  }
}
```

---

#### `GET /categories/:slug`

Get category details with subcategories and product listing.

---

## 7. Rate Limiting Specification

### 7.1 Limits by Tier

| Tier | Scope | Limit | Window |
|------|-------|-------|--------|
| **Free** | Authenticated user | 1,000 requests | 1 hour |
| **Free** | Unauthenticated | 100 requests | 1 hour |
| **Premium** | Authenticated user | 10,000 requests | 1 hour |
| **Auth Endpoints** | All users | 10 requests | 1 minute |
| **Search** | All users | 30 requests | 1 minute |

### 7.2 Rate Limit Response Headers

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 847
X-RateLimit-Reset: 1744963200
Retry-After: 3600
```

### 7.3 Rate Limit Exceeded Response (429)

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please retry after 3600 seconds.",
    "retryAfter": 3600
  }
}
```

### 7.4 Implementation Notes

- Rate limit counters are stored in **Redis** with per-user sliding window
- Auth endpoints (`/auth/*`) have a separate rate limit pool from general API
- Burst allowance: up to 1.5x limit for up to 10 seconds during traffic spikes
- IP-based fallback if user identification fails
- Admin users are exempt from standard rate limits

---

## 8. Security Specification

### 8.1 JWT Configuration

| Parameter | Value |
|-----------|-------|
| Algorithm | HS256 |
| Access Token TTL | 15 minutes |
| Refresh Token TTL | 7 days |
| Token issuer | `commerce-api` |
| Token audience | `commerce-clients` |

**Access Token Payload:**
```json
{
  "sub": "usr_550e8400-e29b-41d4-a716-446655440000",
  "email": "jane.doe@example.com",
  "role": "customer",
  "iat": 1744963200,
  "exp": 1744964100,
  "iss": "commerce-api",
  "aud": "commerce-clients"
}
```

### 8.2 Password Requirements

- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 digit
- At least 1 special character (`!@#$%^&*()_+-=[]{}|;:'",.<>?/~`)
- No more than 3 consecutive identical characters
- Not in list of top 10,000 common passwords

### 8.3 Security Headers

All responses include:
```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'
```

### 8.4 Input Validation

- All inputs are validated using Zod schemas
- SQL injection prevention via parameterized queries (Prisma)
- XSS prevention via output encoding
- CSRF tokens not required for pure REST APIs (JWT in header)
- Request body size limit: 1MB
- Maximum URL length: 8192 characters

---

## 9. Error Codes Reference

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Request body/params failed validation |
| `INVALID_CREDENTIALS` | 401 | Email/password mismatch |
| `TOKEN_EXPIRED` | 401 | JWT access token has expired |
| `TOKEN_INVALID` | 401 | JWT is malformed or tampered |
| `TOKEN_REVOKED` | 401 | Refresh token has been revoked |
| `FORBIDDEN` | 403 | User lacks permission for this action |
| `NOT_FOUND` | 404 | Requested resource does not exist |
| `EMAIL_ALREADY_EXISTS` | 409 | Email is already registered |
| `INSUFFICIENT_STOCK` | 422 | Not enough inventory for requested quantity |
| `ORDER_NOT_CANCELLABLE` | 422 | Order status does not allow cancellation |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

## 10. Acceptance Criteria

### 10.1 Authentication

- [ ] New users can register and immediately log in
- [ ] Login returns valid JWT access + refresh tokens
- [ ] Access tokens expire after 15 minutes
- [ ] Refresh tokens can be exchanged for new access tokens
- [ ] Logout invalidates the refresh token
- [ ] Invalid credentials return 401 without leaking whether email exists
- [ ] Passwords are hashed with bcrypt (cost factor 12)

### 10.2 User Management

- [ ] Authenticated users can view and update their profile
- [ ] Password change requires current password
- [ ] Account deletion is soft-delete with 90-day retention
- [ ] Admins can list all users with pagination and search

### 10.3 Product Catalog

- [ ] Products can be listed with pagination (max 100 per page)
- [ ] Full-text search returns relevant results ranked by relevance
- [ ] Products can be filtered by category, price range, and stock status
- [ ] Product detail includes all images, description, and stock level
- [ ] Admins can create, update, and deactivate products

### 10.4 Order Management

- [ ] Cart persists across sessions for authenticated users
- [ ] Adding an existing product increments quantity
- [ ] Order placement validates stock and clears cart
- [ ] Order items snapshot product info at time of purchase
- [ ] Customers can cancel orders only in pending/confirmed status
- [ ] Order history shows all past orders with pagination
- [ ] Admins can update order status and add tracking numbers

### 10.5 Rate Limiting

- [ ] Authenticated users are limited to 1000 req/hour
- [ ] Auth endpoints are limited to 10 req/minute
- [ ] 429 responses include proper headers and retry-after value
- [ ] Rate limit counters reset correctly after the window expires

---

## 11. Out of Scope (v1.0)

- Payment processing integration (Stripe/PayPal gateway)
- Email/SMS notifications
- Multi-currency support
- Third-party OAuth providers (Google, Apple)
- WebSocket / real-time updates
- Multi-tenancy
- Advanced analytics / reporting
- Product variants (size, color)
- Coupon/discount codes
- Inventory low-stock alerts
- Content Delivery Network (CDN) integration
