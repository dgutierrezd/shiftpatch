# ESCALATION: One-click export of nurse license documents and TB test results

## Problem
The founder brief asks for a one-click export of every nurse's license documents and
TB test results, to hand to the state inspector. Built as asked, any logged-in admin
(or anyone holding a stolen admin session) could download the medical records of every
nurse in one file, with no record of why, or to whom, they went.

## Root cause
The request treats worker medical records as ordinary documents. They are not:
- The ADA requires employee medical information to be kept in separate, confidential
  files and disclosed only under narrow exceptions (29 CFR 1630.14(c)). A state health
  inspector is not one of the listed exceptions.
- Florida's breach-notification law (Fla. Stat. 501.171) counts a name combined with
  medical condition or diagnosis information as "personal information". A leaked bulk
  export triggers notification duties for the facility.
- HIPAA most likely does *not* apply: records a covered entity holds in its role as an
  employer are excluded from PHI (45 CFR 160.103). So there is no existing compliance
  framework forcing the right controls — the product has to supply them itself.

The underlying need is real and legitimate: prove to an inspector, quickly, that the
staff who worked a shift were licensed and TB-screened.

## Alternative solutions considered
1. **Build as asked** (bulk ZIP of all documents, one click). Fastest, maximum exposure. Rejected.
2. **Build no export at all.** Safe, but leaves the inspection need unmet. Rejected.
3. **Admin-only bulk ZIP.** Better, but still stores and moves medical files that an
   inspection rarely needs, and still has no purpose limitation or trail.

## Recommended solution
- Do not store TB test documents. Store only an attested status: "TB screening current
  until <date>, verified by <admin> on <date>".
- Replace the ZIP with an **inspection compliance report**: admin-only, scoped to a chosen
  set of nurses, showing name, license number, license expiry, TB screening expiry and
  verification status.
- Every report requires a reason (e.g. the inspection reference), is written to the audit
  log (who, when, why, which nurses), and is stamped with the requester and timestamp.
- If an inspector needs a raw license document: per-file, short-lived access, also audited.
- Before any raw medical document leaves the system, have counsel confirm what Florida
  surveyors are entitled to request.

## Impact / urgency
High, and it should be decided before credentials go live: once medical files are
collected they must be protected for as long as they are retained.

For this build I am shipping the audited compliance report and **not** the bulk
document export. Decision needed from the founder: is an attested, admin-verified TB
status sufficient for his inspectors, or do they require the underlying documents?
