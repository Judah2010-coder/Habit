# Security Specification for Habit Hustle (Zero-Trust Model)

## 1. Data Invariants

1. **User Ownership Isolation**: Any doc in `/users/{userId}` or its subcollections (habits, threats, logs) can only be read, created, updated, or deleted by the authenticated user matching `{userId}`.
2. **Personal Profile Protection**:
   - `uid` must match the authenticated `request.auth.uid`.
   - `email` must match the authenticated user's email.
   - `createdAt` is immutable.
   - `updatedAt` is updated to exactly `request.time`.
3. **Habit Data Constraints**:
   - `createdAt` is immutable.
   - `streak` and `completions` must be positive integers.
4. **Threat Core Integrities**:
   - Integrity and health cannot exceed maximum integrity.
   - Lock/unlock requirements must conform to verified thresholds.
5. **No Cross-User Access**: Unauthenticated requests and users reading/writing arbitrary other user IDs must return `PERMISSION_DENIED`.

## 2. The "Dirty Dozen" Attack Payloads

1. **Payload 01: Hostile Identity Spoofing**
   - User `attacker_uid` attempts to write a UserProfile at path `/users/victim_uid`.
   - Result: Fail (`request.auth.uid != userId`).
2. **Payload 02: Shadow Field Injection**
   - Attempting to slide administrative system status (e.g., `isAdmin: true` or `role: "system_commander"`) into a UserProfile update.
   - Result: Fail (`hasOnly()` field restriction and strict schema check).
3. **Payload 03: Experience/XP Overclock Injection**
   - Attempting to set integer values to out-of-bound quantities (e.g., `xp: 9999999` with string properties).
   - Result: Fail (`isValidUserProfile()`).
4. **Payload 04: Temporal Corruption (createdAt spoofing)**
   - Attempting to overwrite historic profile creation timestamps (`createdAt`) with prehistoric dates to skew streaks.
   - Result: Fail (`incoming().createdAt == existing().createdAt`).
5. **Payload 05: Spoofed User Email Identity**
   - Attempting to register a profile under an email address not corresponding to `request.auth.token.email`.
   - Result: Fail (`incoming().email == request.auth.token.email`).
6. **Payload 06: Zero-Cost Token Reclamation**
   - Attempting to set local wallet balance (`crystals`) to arbitrarily high amounts without registering proper transactions.
   - Result: Fail (validation rules check `affectedKeys().hasOnly()`).
7. **Payload 07: Unauthenticated Database Scrape**
   - Probing `/users/some_user/habits` with a general list query by a non-logged-in guest player.
   - Result: Fail (`request.auth != null && request.auth.uid == userId`).
8. **Payload 08: ID Poisoning of Habit Record**
   - Submitting a habit with a 50KB ID representation filled with shell escape characters to crash indexes.
   - Result: Fail (`isValidId(habitId)` checks length and pattern match).
9. **Payload 09: Threat Integrity Spoofing**
   - Sending an update to `/users/{userId}/threats/scavenger_swarm` to artificially deplete Integrity directly to `0` from client-side without actually documenting habit logs.
   - Result: Fail (`affectedKeys()` matches strict transaction rules).
10. **Payload 10: State Bypass (Unlocked Level Bypass)**
    - Forcing level unlock variables (`unlocked: true`) on high-difficulty threat vectors (like `singularity_overlord`) while having `0 XP`.
    - Result: Fail (strict unlock formulas verified in validators).
11. **Payload 11: Negative Streak Valuation**
    - Submitting a negative habit streak modifier (e.g. `streak: -100`) to glitch status mechanics.
    - Result: Fail (`type check` and schema bounds).
12. **Payload 12: Phantom Log Fabrication**
    - Spurring continuous fake activity log entries containing invalid parameters at `/users/{userId}/logs/{logId}`.
    - Result: Fail (`request.auth.uid == userId` and `isValidLog()`).
