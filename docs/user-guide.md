# User Guide

A comprehensive guide for users of the Tournament App — covering all use cases, tournament types, and step-by-step workflows.

## Table of Contents

- [Overview](#overview)
- [Getting Started](#getting-started)
- [Tournament Types](#tournament-types)
- [Use Cases](#use-cases)
- [Step-by-Step Guides](#step-by-step-guides)
- [Admin Panel](#admin-panel)
- [QR Code Match System](#qr-code-match-system)
- [Language Support](#language-support)
- [FAQ](#faq)

---

## Overview

The Tournament App is a web application for managing fencing tournaments for Helsingin Miekkailijat (Helsinki Fencers). It supports:

- **Round-based tournament model** — tournaments are composed of ordered rounds, each typed as `pools` (round-robin) or `elimination` (bracket)
- **Round-robin pools** — every player in a pool fences every other player; multiple pools share a single ranking
- **Bracket (elimination) rounds** — single-elimination brackets with seeding
- **QR code match submissions** — external devices submit match results by scanning QR codes
- **Multi-language interface** — Finnish, English, Swedish, Estonian

### User Roles

| Role    | Capabilities |
|---------|-------------|
| **Admin** | Full access: create/edit/delete tournaments, matches, players, users, devices |
| **User**  | View tournaments and results (read-only access) |

---

## Getting Started

### Logging In

1. Open the app in your browser
2. Enter your username and password on the home page
3. Click **Login**
4. You'll be redirected to the tournament selection page

### Changing Language

Click any of the flag icons in the top-right corner to switch languages:
- 🇫🇮 Finnish
- 🇬🇧 English
- 🇸🇪 Swedish
- 🇪🇪 Estonian

The URL updates to reflect the language (e.g., `/fi/select`, `/en/select`).

---

## Tournament Types

Tournaments are structured as an ordered list of **rounds**. Each round has a type:

| Round type    | Description |
|---------------|-------------|
| `pools`       | Round-robin group phase — every player in a pool plays every other player |
| `elimination` | Single-elimination bracket — losers are out, winners advance |

By combining rounds you can model many common tournament formats:

### Single Pool Round (simple round-robin)

One `pools` round, all players in a single pool. Every player fences every other player.

**Best for**: Club practice sessions, small to medium groups (4–16 players).

**Features**:
- Matrix table showing all matchups
- Live leaderboard with win percentage ranking
- Bulk match entry for quick data input

### Multi-Pool Round-Robin

One or two `pools` rounds, with players divided into groups. Each pool has its own match table, but all players share a single unified ranking.

**Best for**: Large groups (16+ players), qualifying rounds, club nights with many fencers.

**Features**:
- Create 2+ pools with auto-generated names (Pool 1, Pool 2, ...)
- Assign players to pools
- Each pool shows its own match matrix
- Single leaderboard ranks all players across all pools
- Players can be reassigned between pools

A **double round-robin** is represented as two separate `pools` rounds — players fence the same opponents twice, once in each round.

### Bracket (Elimination)

One `elimination` round. Players are seeded based on results from a previous tournament (typically a round-robin qualifier).

**Best for**: Finals and championship rounds, follow-up to round-robin qualifiers, quick resolution with a clear winner.

**Features**:
- Automatic seeding from qualifying tournament results
- Proper bye calculation for non-power-of-2 player counts
- Visual bracket display with round-by-round navigation
- Winners advance automatically

### Pools + Elimination (common club championship format)

Run pool round(s) first, then seed an elimination bracket from the standings. This is done by creating two separate tournaments — a round-robin for the group stage and a brackets tournament for the finals — and using the seeding tool to transfer results.

---

## Use Cases

### Use Case 1: Weekly Club Practice (Simple Round-Robin)

**Scenario**: 8 fencers at a Wednesday practice want to fence each other.

1. Admin creates a "Round Robin" tournament named "Wednesday Practice"
2. Add all 8 players to the tournament
3. Fencers fence their matches on the piste
4. Admin enters results after each match using the matrix table
5. Leaderboard updates in real-time showing standings

### Use Case 2: Club Championship (Round-Robin + Bracket)

**Scenario**: 16 fencers compete in a club championship with group stage and elimination finals.

**Phase 1 — Group Stage**:
1. Admin creates a "Round Robin" tournament: "Club Championship — Groups"
2. Create 2 pools (Pool 1 and Pool 2)
3. Assign 8 players to each pool
4. Each pool completes all matches (28 matches per pool)
5. Leaderboard shows all 16 players ranked by win percentage

**Phase 2 — Elimination**:
1. Admin creates a "Brackets" tournament: "Club Championship — Finals"
2. Seeds the bracket from the group stage results (top players get favorable draws)
3. Bracket matches are entered as they occur
4. Winners advance through the bracket to determine the champion

### Use Case 3: Quick Tournament with QR Codes

**Scenario**: Multiple pistes running simultaneously, with a dedicated scorer at each piste using a tablet.

1. Admin creates a round-robin tournament
2. Adds all players
3. For each match:
   - Admin clicks "QR Match" and selects two players
   - QR code is generated and displayed on screen (or printed)
   - The scorer at the piste scans the QR code with their registered device
   - After the match, the scorer submits the result through their device
   - The result automatically appears in the tournament

### Use Case 4: Open Practice with Public Results

**Scenario**: Club members want to check results on their phones without logging in.

1. Admin creates a round-robin tournament with **Public results** enabled
2. Shares the tournament URL with all participants
3. Anyone with the link can view the match table and leaderboard
4. Only admins can enter or edit results

### Use Case 5: Large Group with Pool Rotation

**Scenario**: 24 fencers at a training camp, divided into 3 groups of 8.

1. Admin creates a round-robin tournament
2. Creates 3 pools (auto-named: Pool 1, Pool 2, Pool 3)
3. Assigns 8 players to each pool
4. Each pool completes their matches
5. Between rounds, admin can reassign players to different pools for the next rotation
6. Overall leaderboard tracks performance across all pools

### Use Case 6: Inter-Club Friendly Match

**Scenario**: Two clubs meet for a friendly team competition.

1. Admin creates a round-robin tournament
2. Creates 2 pools — one per club (or mixed pools)
3. Adds all players and assigns to pools
4. Enter match results as they happen
5. Compare team performance using the leaderboard

---

## Step-by-Step Guides

### Creating a Tournament

1. Navigate to the **tournament selection page** (after login)
2. At the top of the page, you'll see the tournament creation form (admin only)
3. **Select format**:
   - **Round Robin** — matrix-style, every player vs. every player
   - **Brackets** — single-elimination bracket
4. **Enter a name** (optional — defaults to format + today's date)
5. **Set options**:
   - **Require submitter identity**: If checked, QR match submissions must include a registered device token
   - **Public results** (round-robin only): If checked, unauthenticated users can view the tournament
6. Click **Create**
7. You'll be redirected to the new tournament page

### Adding Players to a Tournament

1. Open the tournament
2. Click **"New Player"** in the navigation bar
3. Enter the player's name (max 16 characters)
4. For round-robin tournaments with pools: select which pool to assign the player to
5. Click **Add**
6. The player appears in the match table

**Tip**: Start typing a name to see autocomplete suggestions from the global player list.

### Entering a Match Result

#### Single Match Entry

1. In the round-robin table, find the intersection of the two players
2. Click the **"+"** button in that cell
3. Enter hit counts for each player (0-99)
4. If the hit counts are equal, select the **priority winner** using the radio buttons
5. Click **Submit**
6. The result appears in the table and the leaderboard updates

#### Editing a Match

1. Click on an existing match result in the table
2. Modify the hit counts or winner
3. Click **Save** to update, or **Delete** to remove the match entirely

#### Bulk Match Entry (DT Mode)

For entering many results at once:

1. Click **"DT Entry"** button
2. A matrix table appears with input fields for every matchup
3. Enter hit counts in each cell
4. For drawn matches, select the priority winner
5. Click **Submit All**
6. All matches are saved at once

### Managing Pools

1. Click **"Manage Pools"** button (round-robin tournaments, admin only)
2. **Create a pool**: Click "Add Pool" — pools are auto-named (Pool 1, Pool 2, ...)
3. **Assign players**: Use the dropdown next to each player's name to select their pool
4. **Unassign**: Select the empty option in the dropdown to remove a player from their pool
5. **Delete a pool**: Click the delete button next to the pool name
6. Close the modal when done

### Viewing the Leaderboard

1. Click the **"Leaderboard"** toggle button to show/hide the full standings
2. The leaderboard shows:
   - **Position** — rank based on win percentage
   - **Name** — player name
   - **Win%** — percentage of matches won
   - **W/L** — wins and losses count
   - **AO** — hits given (total)
   - **VO** — hits received (total)
   - **Index** — AO minus VO (net hit difference)
3. Click column headers to sort by different criteria
4. Top 3 positions are marked with trophy icons (gold, silver, bronze)
5. Players with fewer than 2 matches appear grayed out

### Navigating Rounds

- Use the **round indicator** to see which round you're viewing
- Click **Next** / **Previous** to switch between rounds
- Round 1 uses blue highlighting; round 2+ uses violet

### Seeding a Bracket from Round-Robin Results

1. Create a new bracket tournament
2. Click the seeding option and select the source tournament
3. Players are automatically sorted by win percentage from the source tournament
4. The bracket is generated with proper seeding (best players get byes and favorable draws)
5. Bracket matches can then be entered normally

---

## Admin Panel

Access the admin panel by clicking the **Admin** link in the navigation bar (admin users only).

### User Management

**Location**: Admin → Users

- **View all users**: Table showing username and role
- **Create user**: Click "Create User", fill in username, password, and role (user or admin)
- **Edit user**: Click "Edit" to change a user's role or password
- **Delete user**: Click "Delete" and confirm. Note: the last admin user cannot be deleted

### Device Management

**Location**: Admin → Devices

Devices are external tablets/phones that register to submit QR match results.

- **View devices**: Table showing device token, name, creation date, and last usage
- **Delete device**: Revoke a device by clicking "Delete" and confirming
- **Note**: Devices self-register via the API — they cannot be created from the admin panel

### Player Management

**Location**: Admin → Players

Manage the global player registry (independent of tournaments).

- **View all players**: Complete list of registered players
- **Create player**: Add a new player to the system (max 16 characters)
- **Rename player**: Click "Edit" to change a player's name

### QR Audit

**Location**: Admin → QR Audit

View the history of QR code match submissions. (Currently a placeholder for future implementation.)

---

## QR Code Match System

The QR code system enables decentralized match result submission — referees or scorers at each piste can submit results directly.

### How It Works

1. **Generate**: Admin selects two players and generates a QR code for their match
2. **Scan**: A registered device (tablet/phone) scans the QR code
3. **Submit**: The device submits the match result (hit counts and winner)
4. **Record**: The result is automatically saved to the tournament

### Setting Up External Devices

1. An external app calls the device registration API with a friendly name
2. The system generates a unique device token
3. The device stores this token for future submissions
4. Admins can view and revoke devices in the Admin → Devices panel

### Requiring Submitter Identity

When creating a tournament, you can check **"Require submitter identity"**. When enabled:
- QR match submissions must include a valid device token
- The submitting device is recorded in the match data
- Unregistered devices cannot submit results

When disabled:
- Anyone with the QR code can submit results
- No device tracking on submissions

### QR Code Expiration

Generated QR codes expire after **1 hour**. If a match isn't submitted within that time, the admin must generate a new QR code.

---

## Language Support

The app is fully translated in 4 languages:

| Language | Code | Flag |
|----------|------|------|
| Finnish  | fi   | 🇫🇮   |
| English  | en   | 🇬🇧   |
| Swedish  | se   | 🇸🇪   |
| Estonian | ee   | 🇪🇪   |

- Click flag icons in the top-right corner to switch
- Your language choice is reflected in the URL
- All labels, buttons, error messages, and tooltips are translated

---

## FAQ

### Can I use the app without logging in?

Only if a tournament has **public results** enabled (round-robin only). You can view the match table and leaderboard but cannot enter or edit results.

### How many players can a tournament have?

There's no hard limit, but round-robin becomes impractical above 16 players in a single pool. Use multiple pools for larger groups.

### Can I delete a match?

Yes. Click on the match result in the table, then click **Delete** in the edit modal.

### Can I move players between pools?

Yes. Open **Manage Pools** and use the dropdown next to each player to change their pool assignment.

### What happens if two players have the same hit count?

You'll be prompted to select a **priority winner** — the player who scored the decisive hit last.

### Can I run multiple tournaments at the same time?

Yes. Each tournament is independent. Navigate back to the selection page to switch between tournaments.

### How do bracket byes work?

When the number of players isn't a power of 2 (4, 8, 16, ...), the system automatically assigns byes to the top-seeded players so they advance to the next round without playing.

### Can I change a tournament's format after creating it?

No. The format (Round Robin or Brackets) and its rounds are set at creation time. Create a new tournament if you need a different format.

### How do I export results?

The app currently doesn't have a built-in export feature. Use the browser's print function or copy data from the leaderboard table.

### What if the QR code expires?

Generate a new one by clicking "QR Match" again and selecting the same players. The old QR code data is automatically cleaned up.

### Is my data backed up?

The database is hosted on Neon (PostgreSQL), which provides automatic backups. Contact your administrator for backup and recovery procedures.
