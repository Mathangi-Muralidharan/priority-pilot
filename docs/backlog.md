# Product Backlog (user stories)

Each item below is written to be pasted into a GitHub Issue. Labels: `MVP`, `v1.1`, `v2`, `research-driven`.

| # | Story | Milestone | Status |
|---|---|---|---|
| 1 | Add, edit, and delete backlog items | MVP | Done |
| 2 | RICE scoring with ranked table | MVP | Done |
| 3 | Framework switcher: RICE, ICE, MoSCoW | MVP | Done |
| 4 | "Problem it solves" field | MVP | Done |
| 5 | "Why this score?" notes | MVP | Done |
| 6 | "Requested by" field | MVP | Done |
| 7 | Decision status: Prioritize / Test / Defer / Rejected | MVP | Done |
| 8 | Value vs. Effort quadrant chart | MVP | Done |
| 9 | Manual rank override with badge | MVP | Done |
| 10 | Compare two features side by side | MVP | Done |
| 11 | Share summary (copy to clipboard) | MVP | Done |
| 12 | CSV import and export | MVP | Done |
| 13 | Scoring tooltips for new PMs | MVP | Done |
| 14 | Improvements from user testing | v1.1 | Not started |
| 15 | Stakeholder voting on scores | v2 | Not started |
| 16 | Shareable read-only link | v2 | Not started |
| 17 | Send "Test" items to the TestPilot A/B planner | v2 | Not started |

---

## Issue details

### 1. Add, edit, and delete backlog items
As a PM, I want to manage my backlog items in one place so that I don't need a separate spreadsheet.
**Acceptance criteria**
- Add opens a form; Save adds the item to the table
- Edit opens the same form pre-filled
- Delete asks for confirmation
- Data persists after a page refresh

### 2. RICE scoring with ranked table
As a PM, I want each feature scored with RICE so I can rank them consistently.
**Acceptance criteria**
- Score = Reach × Impact × Confidence ÷ Effort
- Table sorts by score, highest first, with a rank number

### 3. Framework switcher: RICE, ICE, MoSCoW
As a PM, I want to use the framework my team already knows.
**Acceptance criteria**
- A switcher changes the scoring columns, ranking, and form fields
- Each item keeps its inputs for all frameworks

### 4. "Problem it solves" field
As a PM, I want to record the customer problem behind each feature so the backlog stays anchored on problems, not solutions.
**Source:** Interview 1: "I start with the problem, not the feature."
**Acceptance criteria**
- Optional field in the form; shown under the feature name in the table

### 5. "Why this score?" notes
As a PM, I want to record the assumptions behind each score so stakeholders can understand and trust the ranking.
**Source:** Interview 1: "A spreadsheet is often enough if the criteria and assumptions are clear."
**Acceptance criteria**
- Optional notes field in the form
- Notes visible from the table and included in CSV export and share summary

### 6. "Requested by" field
As a PM, I want to see who asked for each feature so stakeholder requests and data-driven items are compared openly.
**Source:** Interview 1, stakeholder pushback story.
**Acceptance criteria**
- Options: Customer, Sales, Leadership, Data, Engineering, Design
- Shown as a tag in the table

### 7. Decision status
As a PM, I want to mark each item Prioritize, Test, Defer, or Rejected, because decisions aren't only yes or no.
**Source:** Interview 1: "we agree to test it or defer it."
**Acceptance criteria**
- Status selectable in the form and shown as a colored tag

### 8. Value vs. Effort quadrant chart
As a PM, I want to see features on a 2×2 so quick wins and money pits are obvious.
**Acceptance criteria**
- Value = Reach × Impact × Confidence; Effort = person-months
- Quadrants split at the median; labeled Quick Wins, Big Bets, Fill-ins, Money Pits
- Hovering a dot shows the feature name

### 9. Manual rank override with badge
As a PM, I want to move an item up or down when I have context the formula lacks, with the override clearly labeled.
**Acceptance criteria**
- Up/down controls move an item; an "Overridden" badge appears
- "Reset to score order" clears all overrides

### 10. Compare two features
As a PM, I want to compare two close features criterion by criterion, so close calls are decided on specifics.
**Source:** Interview 1: "The hardest decisions are usually the ones where two options both have a strong case."
**Acceptance criteria**
- Pick two items; see each input side by side with the winner of each row highlighted

### 11. Share summary
As a PM, I want a plain-English summary of the top priorities and why, so I can paste it into Slack or email.
**Acceptance criteria**
- Lists top items with score, status, requester, and notes
- One-click copy to clipboard

### 12. CSV import and export
As a PM, I want to bring in my existing spreadsheet and export my work.
**Acceptance criteria**
- Export downloads all fields as CSV
- Import reads a CSV with the same columns and adds the rows

### 13. Scoring tooltips
As a new PM, I want each scoring field explained so I score consistently.
**Acceptance criteria**
- Every scoring field has a short explanation in the form
