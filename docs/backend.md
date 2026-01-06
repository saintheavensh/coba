# Backend Documentation

## Architecture Patterns

The backend strictly follows the **Controller-Service-Repository** pattern organized by Feature Modules.

### 1. Controllers (`*.controller.ts`)
- **Responsibility**: Handle HTTP requests, parse inputs, validate data (Zod), format responses.
- **Rule**: NO business logic here. Delegate to Service.

### 2. Services (`*.service.ts`)
- **Responsibility**: Execute business logic, calculations, transactions, complex workflows.
- **Rule**: NO direct database queries. Delegate to Repository.

### 3. Repositories (`*.repository.ts`)
- **Responsibility**: Abstract database operations (Find, Insert, Update, Delete).
- **Rule**: Only layer allowed to import `db` instance.

---

## API Structure

All routes are prefixed with `/`.

### Auth Module (`/auth`)
- `POST /auth/login`
  - Body: `{ username, password }`
  - Response: `{ token, user: { id, name, role } }`
- `POST /auth/register` (Seed only for now)

### Inventory Module (`/inventory`)
- `GET /inventory`
  - Response: `Array<Product>`
- `POST /inventory`
  - Body: `{ name, code, categoryId, minStock }`
  - Response: `Product`
- `GET /inventory/:id`
  - Response: `Product` (with batches)

### Categories Module (`/categories`)
- `GET /categories`
  - Response: `Array<{ id, name, description }>`
- `POST /categories`
  - Body: `{ name, description }`
  - Response: `Category`

### Purchases Module (`/purchases`)
- `POST /purchases`
  - Body: `{ supplierId, items: [{ productId, brand, qty, buyPrice, sellPrice }] }`
  - Response: `Purchase`

### Sales Module (`/sales`)
- `POST /sales`
  - Body: `{ items: [{ productId, qty, ... }], ... }`
  - Response: `Sale`

---

## Response Wrapper
Refer to `docs/development-standards.md` for the strict JSON Response Standard.

**Current Implementation Target:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "meta": { ... }
}
```
All new endpoints must follow this standard. Existing endpoints returning direct Arrays/Objects should be refactored to comply.
