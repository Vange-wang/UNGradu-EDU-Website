# M5 API Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the remaining M1-M4 local test data paths behind CloudBase-backed server APIs with verifiable ownership checks and contact privacy rules.

**Architecture:** Add small server modules per business boundary, then bind them to Next.js route handlers. Keep public view models separate from internal records so owner identifiers and contact fields do not leak through list/detail APIs.

**Tech Stack:** Next.js App Router, TypeScript, CloudBase Node SDK, Vitest.

---

### Task 1: Contact Exchange Authorization API

**Files:**
- Create: `Code文档/server/contact-exchange.ts`
- Create: `Code文档/server/contact-exchange-api.ts`
- Create: `Code文档/app/api/contact-exchange/route.ts`
- Create: `Code文档/tests/contact-exchange-server.test.ts`
- Create: `Code文档/tests/contact-exchange-api.test.ts`
- Modify: `Code文档/README.md`
- Modify: `Code文档/开发员工作记录.md`

- [ ] Write failing tests for request creation, approve with second confirmation, reject, withdraw, expiry, participant-only listing, and authorized contact reads.
- [ ] Implement the minimal server module using `conversations`, `contact_exchange_requests`, and `contact_profiles`.
- [ ] Implement route handlers that reject missing auth and reject temporary test login in production.
- [ ] Run targeted tests until green.
- [ ] Commit after full verification.

### Task 2: Conversations And Messages API

**Files:**
- Create: `Code文档/server/conversations.ts`
- Create: `Code文档/server/conversation-api.ts`
- Create: `Code文档/app/api/conversations/route.ts`
- Create: `Code文档/app/api/conversations/[id]/route.ts`
- Create: `Code文档/app/api/conversations/[id]/messages/route.ts`
- Create: `Code文档/tests/conversation-server.test.ts`
- Create: `Code文档/tests/conversation-api.test.ts`
- Modify: `Code文档/app/chats/[id]/page.tsx`
- Modify: `Code文档/app/profile/chats/page.tsx`

- [ ] Write failing tests for source-based conversation creation, participant-only read/list, message sending, message listing, and non-participant denial.
- [ ] Implement server-side conversation and message ownership checks.
- [ ] Migrate chat pages to API clients without exposing participant phone numbers.
- [ ] Run targeted and full verification.
- [ ] Commit after verification.

### Task 3: Parent Needs API

**Files:**
- Create: `Code文档/server/parent-needs.ts`
- Create: `Code文档/server/parent-need-api.ts`
- Create: `Code文档/app/api/parent-needs/route.ts`
- Create: `Code文档/app/api/parent-needs/[id]/route.ts`
- Create: `Code文档/tests/parent-need-server.test.ts`
- Create: `Code文档/tests/parent-need-api.test.ts`
- Modify: `Code文档/app/parent-needs/page.tsx`
- Modify: `Code文档/app/parent-needs/[id]/page.tsx`
- Modify: `Code文档/app/parent-needs/new/page.tsx`
- Modify: `Code文档/app/profile/parent-needs/page.tsx`

- [ ] Write failing tests for save, owner-only personal list, public list/detail without owner phone, filters, and IDOR denial.
- [ ] Implement server module with public view whitelisting.
- [ ] Migrate pages to API clients.
- [ ] Run targeted and full verification.
- [ ] Commit after verification.

### Task 4: Tutor Profiles API

**Files:**
- Create: `Code文档/server/tutor-profiles.ts`
- Create: `Code文档/server/tutor-profile-api.ts`
- Create: `Code文档/app/api/tutor-profiles/route.ts`
- Create: `Code文档/app/api/tutor-profiles/[id]/route.ts`
- Create: `Code文档/tests/tutor-profile-server.test.ts`
- Create: `Code文档/tests/tutor-profile-api.test.ts`
- Modify: `Code文档/app/tutor-profiles/page.tsx`
- Modify: `Code文档/app/tutor-profiles/[id]/page.tsx`
- Modify: `Code文档/app/tutor-profiles/new/page.tsx`
- Modify: `Code文档/app/profile/tutor-profiles/page.tsx`

- [ ] Write failing tests for save, owner-only personal list, public list/detail without owner phone, filters, proof image metadata, and IDOR denial.
- [ ] Implement server module with public view whitelisting.
- [ ] Migrate pages to API clients.
- [ ] Run targeted and full verification.
- [ ] Commit after verification.

### Task 5: M5 Security Verification Sweep

**Files:**
- Create or modify focused tests under `Code文档/tests`.
- Modify: `Code文档/README.md`
- Modify: `Code文档/开发员工作记录.md`

- [ ] Add interface-level M5 regression tests for production disabling temporary login, unauthorized contact unreadability, non-participant chat denial, and public list/detail field whitelisting.
- [ ] Run `npm run typecheck`, `npm test`, `npm run lint`, `npm run build`, production-simulated build, and `npm run cloudbase:check`.
- [ ] Update code docs and commit the final M5 migration sweep.
