# Project-Wide UX, UI, and Accessibility Audit

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds.

This plan must be maintained in accordance with `/.agent/PLANS.md` from the repository root.

## Purpose / Big Picture

Deliver a comprehensive audit of the entire Books Manager project, covering UI consistency, UX flows, accessibility, and component-level quality. After this audit, the user should have a prioritized, actionable list of issues and recommendations, with references to concrete screens, components, and design tokens, and no code changes made until the user approves.

## Progress

- [x] (2026-02-02 01:15Z) Inventory routes, key flows, and shared components to establish audit coverage.
- [x] (2026-02-02 01:15Z) Review global design language and theme usage for consistency with the literary warm style.
- [x] (2026-02-02 01:15Z) Evaluate core user flows for ease-of-use and clarity (add book, edit book, search, filters, settings).
- [x] (2026-02-02 01:15Z) Audit components for accessibility and interaction affordances (labels, focus states, keyboard navigation).
- [x] (2026-02-02 01:16Z) Produce a consolidated issue list with severity, reproduction notes, and recommended fixes; request user approval before changes.

## Surprises & Discoveries

- None yet.

## Decision Log

- Decision: Focus first on coverage and documentation of issues before proposing code edits.
  Rationale: The user explicitly asked for an extensive audit and to ask questions before making changes.
  Date/Author: 2026-02-02 / Codex

## Outcomes & Retrospective

- Audit completed with a consolidated issue list covering routing, accessibility, and design consistency. Awaiting user prioritization before code changes.

## Context and Orientation

This repository is a Next.js 15 App Router project with Chakra UI v3 and Tailwind (`tw-` prefixed) utilities. Authenticated routes live under `src/app/[locale]/(authenticated)`. Shared UI wrappers are under `src/components/ui`. Domain components such as book and author tooling live under `src/components/books` and `src/components/authors`. Translation strings are in `src/messages/en.json` and `src/messages/fr.json`.

## Plan of Work

First, build a coverage map by listing all pages under `src/app` and all shared UI components under `src/components/ui`, plus domain components under `src/components`. Second, evaluate the global design language implementation by inspecting theme usage and common patterns in pages and components, noting deviations from the intended warm/literary aesthetic. Third, step through critical flows in the UI (add/edit books, library filtering, authors, series, settings) and document friction points or confusing elements. Fourth, audit accessibility and interaction patterns, focusing on labels, focus visibility, keyboard navigation, and color contrast (especially in form controls and dialogs). Finally, compile findings into a ranked list with issue category, affected file(s), and proposed fixes, and ask the user for approval before any code changes.

## Concrete Steps

Run the following commands from `c:\Users\loicb\Programming\books-manager` to gather coverage and context:

  - `rg --files "src/app" -g "*.tsx"`
  - `rg --files "src/components" -g "*.tsx"`
  - `rg -n "Dialog|Modal|Combobox|Select|Checkbox|Radio" src/components src/app -g "*.tsx"`
  - `rg -n "useTranslations" src/app src/components -g "*.tsx"`

Open and review key entry points:

  - `src/app/[locale]/(authenticated)/dashboard/page.tsx`
  - `src/app/[locale]/(authenticated)/library/page.tsx`
  - `src/app/[locale]/(authenticated)/authors/page.tsx`
  - `src/app/[locale]/(authenticated)/series/page.tsx`
  - `src/app/[locale]/(authenticated)/settings/page.tsx`
  - `src/components/books/add-book-modal.tsx`
  - `src/components/books/author-select.tsx`
  - `src/components/ui/*` (focus on input/selection components)

## Validation and Acceptance

The audit is complete when there is a structured report listing issues by severity (critical, major, minor), mapped to files and components, with suggested remediations and UX rationale. The report should be readable without code changes and should cover both authenticated and public/auth pages. No code edits should be made until the user confirms the issue list and priorities.

## Idempotence and Recovery

All steps are read-only and can be repeated safely. If a review step is interrupted, resume by re-opening the specific file and continuing the audit notes.

## Artifacts and Notes

The primary artifact will be the written audit report in the conversation. If the user wants it persisted, create a new `/.agent/audit-report.md` after approval.

## Interfaces and Dependencies

No new dependencies are required. The audit will rely on existing UI components, translations, and the Chakra theme definitions already present in the repository.

Plan Update Note: Initial ExecPlan created to guide a full project UX/UI/accessibility audit prior to any code changes.
