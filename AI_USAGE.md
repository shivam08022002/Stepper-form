  # AI Usage Log

## AI Tools Used
- **Claude (Anthropic)** — primary code generation and architecture planning
- **ChatGPT (OpenAI)** — used for a few CSS layout questions

---

## Prompts Given

**Prompt 1 — Architecture and full scaffold:**
> "Build a full-stack Stepper Form system using MERN stack in JavaScript
> (not TypeScript). No auth needed — hardcode userId 'user_001'.
> Use 3 Mongoose models: FormConfig (template), Submission (user instance),
> StepAnswer (per-step answers with upsert). Seed a 3-step Wellness Intake
> form on startup. REST API with PATCH for draft save and POST for complete.
> React frontend with StepperModal, StepRenderer (text/select/radio),
> SubmissionList, ProgressBar. Plain CSS, teal accent color, underline-style
> step progress bar."

**Prompt 2 — Validation middleware:**
> "Write an Express middleware that validates required fields for a given
> step. It should receive the step config and submitted answers, check each
> required field, and return field-level errors as { fieldId: errorMessage }.
> Skip validation entirely if req.body.draft === true."

**Prompt 3 — useUnsavedChanges hook:**
> "Write a React custom hook that tracks whether current form answers differ
> from the last saved answers. It should expose isDirty, markSaved(answers),
> and reset(). Also attach a beforeunload handler when isDirty is true."

---

## What I Modified from AI Output

**1. Seed running timing:**
AI generated the seed function but didn't call it anywhere. I added
`seedDB()` inside `mongoose.connect().then()` in `app.js` so it runs on
boot only if no config exists yet.

**2. PATCH route upsert logic:**
AI used `StepAnswer.create()` instead of `findOneAndUpdate` with
`upsert: true`. This caused duplicate document errors on re-saving a step.
I rewrote it to use:
```js
await StepAnswer.findOneAndUpdate(
  { submissionId, stepId },
  { answers, savedAt: Date.now() },
  { upsert: true, new: true }
)
```

**3. Progress bar active state:**
AI rendered the progress bar using index comparison which broke when
steps were reordered. I changed it to compare by `step.id` string
against `completedSteps[]` array from the submission.

**4. dialog backdrop close:**
AI's `<dialog>` implementation closed on backdrop click without checking
for unsaved changes. I added a `cancel` event listener with
`e.preventDefault()` and routed it through the dirty-check confirm dialog.

**5. Port conflict:**
AI defaulted to port 5000 which conflicts with AirPlay on macOS. Changed
backend to 5001 and updated the Axios base URL in `frontend/src/api/index.js`.

---

## What AI Got Wrong

**1. Redundant _id index warning:**
AI added `FormConfig.index({ _id: 1 })` in the schema definition.
MongoDB already indexes `_id` by default — this caused a Mongoose startup
warning. I removed it.

**2. Validation didn't handle select "empty string":**
AI's required-field check used `if (!answers[fieldId])` which incorrectly
passed validation when a select field had a value of `""` (the default
empty option). I changed it to:
```js
const val = answers[fieldId];
if (val === undefined || val === null || val.toString().trim() === '') {
  errors[fieldId] = `${field.label} is required`;
}
```

**3. completedSteps not deduplicating:**
AI pushed stepId to `completedSteps` on every save without checking if
it was already present, causing duplicate entries. Fixed with:
```js
$addToSet: { completedSteps: stepId }
```
instead of `$push`.

**4. StepRenderer radio not controlled:**
AI generated radio inputs without `checked` and `onChange` props,
making them uncontrolled and breaking the prefill-from-draft flow.
I rewrote them as controlled inputs tied to the `answers` state object.

---

## How I Verified Correctness

**Schema and DB:**
- Confirmed seed runs once on startup (added a `console.log` + checked
  MongoDB Compass to verify only one FormConfig document exists even
  after multiple restarts)
- Verified compound index `{ submissionId, stepId }` exists in Compass
  under Indexes tab

**API routes (tested with Postman):**
- `POST /api/submissions` → confirmed returns new doc with status "draft"
- `PATCH .../steps/personal_details` with `draft: true` and empty
  required fields → confirmed saves without errors
- Same PATCH with `draft: false` and empty required fields → confirmed
  returns 400 with field-level error object
- `POST .../complete` with missing required fields → confirmed 400
- `POST .../complete` with all steps filled → confirmed status becomes
  "completed"

**Frontend:**
- Refreshed the page mid-draft → confirmed answers still prefilled
  (draft persistence working)
- Filled step 1, clicked X without saving → confirmed unsaved changes
  warning appeared
- Filled and saved all 3 steps → Submit button worked, card updated
  to "Completed" in the list
- Tested broken config (manually deleted a step from DB) → confirmed
  frontend shows an error state instead of crashing