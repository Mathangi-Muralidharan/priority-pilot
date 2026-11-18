# User Research: How PMs Prioritize Features

## Goal
Understand how product managers decide what to build next, and what frustrates them about the process.

## Method
Short async interviews over LinkedIn messages (October 2026). Participants are anonymous; no confidential company, customer, or product information is recorded.

**Questions asked**
1. How do you decide which features to build next?
2. What's annoying about it?
3. Follow-ups: the hardest or slowest step, the tools used today, and a time stakeholders pushed back.

---

## Interview 1: Product Manager (anonymous)

**How they prioritize:**
> "I start with the problem, not the feature. I look at customer pain points, product data, business goals, and strategic priorities. Then I evaluate potential solutions based on impact, confidence, and effort, and prioritize the opportunities that create the most value for customers and the business."

**Hardest part:**
> "Getting alignment is probably the hardest part. The actual scoring can be fairly straightforward, but understanding the customer problem, validating the data, and getting engineering, design, sales, and leadership aligned can take much longer. The hardest decisions are usually the ones where two options both have a strong case."

**Tools used today:**
> "I've seen teams use everything from a simple Excel/Google Sheet to Jira, Productboard, or similar product-management tools. Personally, I think the framework matters more than the tool. A spreadsheet is often enough if the criteria and assumptions are clear."

**Stakeholder pushback:**
> "A common situation is when a stakeholder strongly advocates for a feature because of an important customer or business relationship, while the broader product data suggests another problem should come first. In those situations, I try to bring the conversation back to the underlying problem, quantify the trade-offs, and make the decision criteria explicit. Sometimes the answer is to prioritize the stakeholder request; other times, we agree to test it or defer it rather than making it a full roadmap commitment."

**Consent:** Agreed to anonymous quotes, with no confidential company, customer, or product information.

**My takeaways:**
1. **Scoring is easy; alignment is hard.** The real job is getting engineering, design, sales, and leadership to agree.
2. **Assumptions must be visible.** A score is only trusted if people can see *why* it got that number.
3. **Close calls are the hardest.** When two options both have a strong case, a single score doesn't settle it.
4. **Stakeholder requests compete with data.** PMs need a way to show trade-offs objectively.
5. **Decisions aren't just yes/no.** Outcomes include prioritize, test, or defer.
6. **Spreadsheets are "good enough."** My tool must beat a spreadsheet on clarity and communication, not on complexity.

---

## Interview 2
_To be added._

---

## Summary of insights (so far: 1 interview)

| Theme | Mentioned by | Example quote |
|---|---|---|
| Alignment is harder than scoring | 1 of 1 | "Getting alignment is probably the hardest part." |
| Assumptions must be explicit | 1 of 1 | "A spreadsheet is often enough if the criteria and assumptions are clear." |
| Stakeholder requests compete with data | 1 of 1 | "...bring the conversation back to the underlying problem, quantify the trade-offs..." |
| Outcomes include test and defer, not only yes/no | 1 of 1 | "...we agree to test it or defer it rather than making it a full roadmap commitment." |

A theme counts as **validated** once 3 or more people mention it.

## How this research shaped the product

| Insight | Product decision |
|---|---|
| Start from the problem, not the feature | Every item has a **"Problem it solves"** field |
| Assumptions must be visible | **"Why this score?"** notes on each item, shown in the table and summary |
| Close calls are the hardest | **Compare** two features side by side, criterion by criterion |
| Stakeholder vs. data conflicts | **"Requested by"** field (Customer, Sales, Leadership, Data, Engineering) |
| Decisions aren't yes/no | **Status:** Prioritize, Test, Defer, Rejected |
| Need to explain decisions | **Share summary** that writes the rationale in plain English |
| Spreadsheets are "good enough" | **CSV import/export**, and no account required |
| Problem statement was wrong | Reframed from "score features" to "make trade-offs transparent" (see PRD) |
