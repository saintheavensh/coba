# Refactoring Guidelines

## The Golden Rule
**NEVER refactor without passing tests.**
Refactoring changes structure, not behavior. Tests ensure behavior is preserved.

## Workflow
1.  **Red**: Write a failing test for new functionality (if adding features).
2.  **Green**: Make it pass (even if ugly).
3.  **Refactor**: Clean it up.

## When to Refactor
-   **Rule of Three**: If you copy-paste code three times, extract it.
-   **Code Smells**:
    -   **Long Functions**: > 50 lines? Split it.
    -   **Deep Nesting**: > 4 levels? Use early returns/guard clauses.
    -   **Large Classes/Files**: > 800 lines? Extract modules.
    -   **Magic Numbers**: Replace `86400` with `SECONDS_IN_DAY`.
    -   **Parameter Creep**: Function taking > 3 args? Use an object.

## Safe Refactoring Techniques
-   **Extract Function**: Move a block of code into a named function.
-   **Rename Symbol**: Use VS Code's F2 to rename safely across the project.
-   **Simplify Conditional**: merge nested `if`s or use guard clauses.
-   **Replace Loop with Pipeline**: Use `.map`, `.filter`, `.reduce`.
