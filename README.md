# Full-Stack Dynamic Stepper Form

A premium, highly polished dynamic Stepper Form system built using the MERN stack (MongoDB, Express, React, and Node.js) with vanilla CSS. The system utilizes a modern 3-schema database architecture designed to support dynamic form configurations, step-by-step draft saves, and complete validation on submission.

---

## 3-Schema Architecture

The application implements a robust, clean database layout modeled to resemble real-world form architectures:

### 1. `FormConfig` (The Template Schema)
Stores dynamic form templates defining steps and fields.
- Supports field types: `text`, `select`, and `radio`.
- Holds dynamic validations per field (`required`, `minLength`, `maxLength`, `pattern`).
- *Seeded automatically on backend boot with a 3-step **Wellness Intake Form**.*

### 2. `Submission` (The Instance Schema)
Represents a user's form submission instance.
- Tracks `userId` (hardcoded to `"user_001"` for demonstration), `configId` (ref `FormConfig`), status (`draft` / `completed`), `currentStep` index, and an array of `completedSteps` IDs.
- Compound indexed on `{ userId: 1, status: 1 }` and `{ userId: 1, createdAt: -1 }` to guarantee fast dashboard lookups.

### 3. `StepAnswer` (The Granular Step Answers Schema)
Stores values entered per step per submission, enabling clean step-by-step partial saves.
- Answers are mapped using Mongoose `Mixed` object configurations (`{ [fieldId]: value }`).
- Compound unique indexed on `{ submissionId: 1, stepId: 1 }` to support fast updates and upserts.

---

## All API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **GET** | `/api/form-configs` | Returns a list of all form configurations. |
| **GET** | `/api/form-configs/:id` | Returns a single form config structure. |
| **POST** | `/api/submissions` | Creates a new submission instance. |
| **GET** | `/api/submissions` | Lists all submissions for `user_001` (sorted by `createdAt` desc). |
| **GET** | `/api/submissions/:id` | Returns a single submission alongside all its saved `StepAnswers`. |
| **PATCH** | `/api/submissions/:id/steps/:stepId` | Saves step answers. Bypasses validations if `draft: true` is passed. |
| **POST** | `/api/submissions/:id/complete` | Validates all required fields across all steps and locks the submission as `completed`. |

---

## Key Features

1. **Native Accessibility**: Uses the native HTML `<dialog>` element for the stepper overlay, providing native escape handling, visual backdrop filters, and tab focus trapping.
2. **Draft Saving**: Allows saving progress at any stage without validating required fields by clicking "Save Draft".
3. **Dirty-State Detection**: Uses a custom `useUnsavedChanges` hook to compare inputs. Prompts users via browser confirmation if they attempt to exit or navigate back with unsaved values.
4. **Resumable Workflows**: Opening a draft submission retrieves all previous answers and automatically resumes at the step where the user left off.
5. **Premium Look & Feel**: Beautiful teal/emerald primary accents, smooth transitions, checked completion badges, card hover effects, custom styled controls, and responsive layouts.

---

## Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB running locally on `mongodb://localhost:27017`

### Setup & Installation

1. **Clone and navigate to the project directory**:
   ```bash
   cd stepper-form
   ```

2. **Start the Backend Service**:
   ```bash
   cd backend
   npm install
   npm run dev
   ```
   *The backend will run on [http://localhost:5001](http://localhost:5001) and automatically seed the Wellness Intake Form config.*

3. **Start the Frontend Application**:
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```
   *The frontend will run on [http://localhost:5173](http://localhost:5173).*
