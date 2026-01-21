---
name: tdd-workflow
description: Use this skill when writing new features, fixing bugs, or refactoring code. Enforces test-driven development with 80%+ coverage using Vitest and Svelte Testing Library.
---

# Test-Driven Development Workflow

This skill ensures all code development follows TDD principles with comprehensive test coverage.

## When to Activate

-   Writing new features or functionality
-   Fixing bugs or issues
-   Refactoring existing code
-   Adding Hono API endpoints
-   Creating new Svelte 5 components

## Core Principles

1.  **Tests BEFORE Code**: ALWAYS write tests first (Red), then implement (Green).
2.  **Coverage**: Minimum 80% coverage goal.
3.  **Refactor**: Improve code without breaking tests.

## TDD Workflow Steps

### Step 1: Write User Journeys
"As a [role], I want to [action], so that [benefit]."

### Step 2: Generate Test Cases
Create comprehensive test cases covering happy paths and edge cases.

### Step 3: Run Tests (They Should Fail)
```bash
npm test
```

### Step 4: Implement Code
Write minimal code to make tests pass.

### Step 5: Run Tests Again & Refactor

## Testing Patterns (Svelte & Hono)

### Unit Test Pattern (Svelte Component)

```typescript
// Component.test.ts
import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import Counter from './Counter.svelte';

describe('Counter Component', () => {
  it('increments count when clicked', async () => {
    // Arrange
    render(Counter);
    const button = screen.getByRole('button');

    // Act
    await fireEvent.click(button);

    // Assert
    expect(button).toHaveTextContent('Count is 1');
  });
});
```

### API Integration Test Pattern (Hono)

```typescript
// route.test.ts
import { describe, it, expect, vi } from 'vitest';
import app from '../../index'; // Import your Hono app

describe('GET /api/devices', () => {
    it('returns list of devices', async () => {
        const res = await app.request('/api/devices');
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.success).toBe(true);
    });
});
```

### Mocking Dependencies (Vitest)

```typescript
import { vi } from 'vitest';
import * as db from '@/db';

vi.mock('@/db', () => ({
    findUser: vi.fn(() => ({ id: 1, name: 'Test' }))
}));
```

## Success Metrics
-   Tests pass (Green).
-   Code coverage > 80%.
-   No regression in existing features.
