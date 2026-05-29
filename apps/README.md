# Ubuntu Sales — NestJS API

## Stack
- **NestJS 11** — framework
- **Prisma 7** — ORM
- **PostgreSQL** — database
- **JWT + Passport** — authentication
- **bcrypt** — password hashing

---

## Setup

### 1. Install the one missing package
```bash
npm install @nestjs/config
```

### 2. Configure your database
Edit `.env` and set your PostgreSQL connection string:
```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/ubuntu_sales?schema=public"
JWT_SECRET="change_this_to_a_long_random_string"
JWT_EXPIRES_IN="7d"
```

### 3. Update package.json — add the seed script
Add this inside `"prisma"` key (create it if it doesn't exist):
```json
"prisma": {
  "seed": "ts-node prisma/seed.ts"
}
```
And add to `"scripts"`:
```json
"seed": "ts-node prisma/seed.ts"
```

### 4. Run migrations
```bash
npx prisma migrate dev --name init
```

### 5. Seed the database (creates the first SUPER_ADMIN)
```bash
npm run seed
```

### 6. Start the API
```bash
npm run start:dev
```

API runs at: `http://localhost:3000/api/v1`

---

## API Endpoints

### Auth (public)
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/v1/auth/login` | Login, returns JWT |
| GET  | `/api/v1/auth/me` | Get current user profile (JWT required) |

**Login request:**
```json
{ "username": "superadmin", "password": "Admin@1234" }
```
**Login response:**
```json
{
  "accessToken": "eyJ...",
  "user": { "id": "...", "username": "superadmin", "role": "SUPER_ADMIN", ... }
}
```

### Users (JWT required)
| Method | Route | Roles allowed |
|--------|-------|---------------|
| POST   | `/api/v1/users` | SUPER_ADMIN, ADMIN |
| GET    | `/api/v1/users` | SUPER_ADMIN, ADMIN, SUPERVISOR |
| GET    | `/api/v1/users/:id` | SUPER_ADMIN, ADMIN, SUPERVISOR |
| PATCH  | `/api/v1/users/:id` | SUPER_ADMIN, ADMIN |
| DELETE | `/api/v1/users/:id` | SUPER_ADMIN only (soft delete) |

**Authorization header format:**
```
Authorization: Bearer <accessToken>
```

---

## Roles
| Role | Access level |
|------|-------------|
| `SUPER_ADMIN` | Full access — manage all users, soft delete |
| `ADMIN` | Create/update users, view all |
| `SUPERVISOR` | View users only |
| `SALES_REP` | Their own profile via /auth/me |

---

## File Structure
```
src/
├── main.ts                          # Bootstrap, CORS, ValidationPipe
├── app.module.ts                    # Root module
├── prisma/
│   ├── prisma.service.ts            # PrismaClient wrapper
│   └── prisma.module.ts             # Global module
├── auth/
│   ├── dto/login.dto.ts
│   ├── strategies/jwt.strategy.ts   # Validates Bearer tokens
│   ├── guards/
│   │   ├── jwt-auth.guard.ts        # Requires valid JWT
│   │   └── roles.guard.ts           # Enforces @Roles()
│   ├── auth.service.ts              # Login logic
│   ├── auth.controller.ts           # /auth routes
│   └── auth.module.ts
├── users/
│   ├── dto/
│   │   ├── create-user.dto.ts
│   │   └── update-user.dto.ts
│   ├── users.service.ts             # CRUD + soft delete
│   ├── users.controller.ts          # /users routes
│   └── users.module.ts
└── common/
    └── decorators/
        ├── roles.decorator.ts       # @Roles(Role.ADMIN, ...)
        └── current-user.decorator.ts # @CurrentUser()
```
