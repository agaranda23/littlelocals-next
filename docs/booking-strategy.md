# Booking strategy — what should "book" mean on LITTLElocals?

**Draft for decision** · 2026-05-21 · Owner: founders · Status: open question

## The problem

CLAUDE.md names "the booking conversion path" as one of three current focus areas. But today, **every "Book now" CTA on a listing hands off to a third-party site**:

- Little Kickers Ealing → `littlekickers.co.uk/classes/ealing`
- Mini Me Childcare → `linktr.ee/minimechildcareservices`
- Hertfordshire Zoo → `bookings.hertfordshirezoo.com`

We can't optimise a funnel we don't own. The first decision isn't a UX or engineering one — it's **what we want "book" to mean on LITTLElocals**. Three viable directions, each with very different cost and ceiling.

## Option A — Stay as the referrer

**Shape:** Keep "Book now" as an outbound link. Instrument the click. Compete on quality of the *discovery* layer, not the transaction.

**What we'd build:** Click tracking on every outbound CTA (Supabase event log or GA event). A simple per-listing CTR dashboard for the admin. Better outbound-CTA design (clearer "you'll be sent to <provider site>" framing).

**Effort:** Days, not weeks.

**Monetisation ceiling:**
- Featured-listing slots paid by providers (subscription tier).
- Affiliate links for chains/aggregators that pay per click or per booking (Hoop, Day Out With The Kids do this).
- Sponsored "LITTLElocals pick this week" placements.
- **Realistic per-listing revenue: low single-digit £ per month.**

**Risk:** Low. Easy to walk back. Doesn't compromise parent UX. But ceiling caps the company at "good directory" rather than "default booking layer."

**Where we already are:** mostly here today, minus the instrumentation.

## Option B — Own the lead (on-platform enquiry)

**Shape:** Replace outbound "Book now" with an on-platform "Enquire" form for some categories (especially classes, nurseries, childcare). Provider gets the lead by email; parent gets a "we've passed your details on" confirmation. Booking still happens off-platform but **we own the moment of intent.**

**What we'd build:**
- Enquiry form on listing detail (name, email, child's age, preferred time, message).
- Lead inbox for providers in the dashboard (mostly exists — `app/provider/dashboard`).
- Transactional email both ways via Resend.
- Per-listing toggle for whether "Enquire" or "Book now (outbound)" shows.

**Effort:** ~2–3 weeks of focused build.

**Monetisation ceiling:**
- Paid tier for providers — unlimited leads + analytics + featured placement. Reasonable £15–£40/month per provider for high-intent categories.
- Per-lead pricing for nurseries (where one parent enquiry can be worth £1,000+ to the provider).
- **Realistic per-active-provider revenue: low double-digit £ per month, plus optional per-lead premium for nurseries.**

**Risk:** Medium. Parents may bounce if the journey feels less direct than "click and book on the provider's site." Need to handle providers who don't respond. Requires a real provider activation/onboarding loop.

**Conversion question:** does "Enquire" actually convert better than "Book now (outbound)" for parents who already trust the provider? For unknown providers, almost certainly yes. For Little Kickers, maybe not.

## Option C — Own the transaction (on-platform booking)

**Shape:** Real booking + payment on LITTLElocals. Take a percentage. The Airbnb/Eventbrite/Sawdays model.

**What we'd build:**
- Provider-side: availability calendar, capacity rules, cancellation policy, payouts (Stripe Connect).
- Parent-side: pick-a-date, pick-a-slot, pay, confirmation, calendar add, reminder, refund.
- Trust layer: holding funds, dispute handling, T&Cs, payouts schedule.
- Real KYC/compliance (especially for childcare and nurseries — regulated category).
- A whole customer support layer for booking disputes.

**Effort:** ~3–6 months for a focused MVP in one category (probably classes — clearest unit), and that's optimistic.

**Monetisation ceiling:**
- 5–15% take-rate (industry typical for category) on transactions flowing through.
- **Realistic per-booking revenue: £1–£5 on a £20–£40 class booking, £10–£50 on a day out, much more on a nursery month.**
- **But:** only on transactions we actually capture. Need both supply willing to onboard and demand willing to book on us instead of the provider's site.

**Risk:** High. Build-and-pray. Provider willingness is the biggest unknown — Little Kickers will not switch their booking off their own franchise software. Independent small classes might. Nurseries are very unlikely to change billing.

**This is the only path to "default booking layer for family activities in the UK" — but it's a 12–24 month commitment, not a quarter.**

## Recommendation

**Sequence B then C, not B or C in isolation.** Specifically:

1. **Now → 2 weeks:** Do the Option A instrumentation. Add click tracking on every outbound "Book now" CTA — we need the data to make any further decision well. Cost: trivial. Value: tells us which categories and which listings actually convert.

2. **Next 4–8 weeks:** Pick **one category** (suggested: classes for ages 0–5) and pilot Option B for it. Replace outbound CTA with "Enquire" on a sample of listings. Measure: enquiry rate vs. previous outbound CTR, provider response rate, parent-reported satisfaction. Real evidence rather than guesses about what parents want.

3. **3–6 months out:** *Only if* B shows that we own the moment of intent better than the outbound handoff, and *only* in the categories where it works, commit to Option C in those categories. Build payment + availability for **classes first** (smallest unit, clearest UX, lowest stakes), nurseries last (most regulated, highest stakes, longest sales cycle).

Why not jump straight to C: too much capital, too little signal. B is a real product step that produces evidence, monetises faster, and is reversible.

Why not stay at A: ceiling. North star is "default booking layer for family activities in the UK" — A doesn't get us there.

## Open questions for the founders

1. **Is "default booking layer" still the north star, or has it shifted toward "default discovery layer"?** The two have very different roadmaps.
2. **What's the runway picture?** Option C is a 6-month build with no revenue during it. Is that fundable on current cash?
3. **Are nurseries strategically central or a nice-to-have?** They're the highest-ARPU bookings but the hardest to convert. If central, the build is heavier (Ofsted, fee structures, waitlists, regulated marketing rules). If nice-to-have, scope down.
4. **What's our take-rate ceiling expectation?** Hoop/Pebble largely don't take a cut. Eventbrite takes 3–6%. Childcare-marketplace players that do take a cut typically charge £20–£100/month subscription rather than per-booking. The right model isn't obvious yet.
5. **For Option B specifically:** are providers responsive enough today to handle email leads within 24 hours? If not, the enquiry experience punishes parents and we go backwards on trust.

## What I'd do this week if I were running it

- Land the outbound-click instrumentation (Option A baseline). Half a day's work.
- Pull 4–6 providers I trust into a 15-minute call to ask: "If we sent you 5 qualified enquiries a week instead of outbound clicks, would you respond to them, and what would you pay for that?" That answers most of the strategic question without a build.
- Defer the Option C decision until next quarter, after a few weeks of Option B data from one category.

---

*This doc is a starting point for a 30-minute founder call, not a final plan. Please mark up directly in this file or comment on the PR — the recommendation section is the easiest place to disagree.*
