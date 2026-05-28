import express from 'express';
import Submission from '../models/Submission.js';
import StepAnswer from '../models/StepAnswer.js';
import FormConfig from '../models/FormConfig.js';
import { validateStepMiddleware } from '../middleware/validateStep.js';

const router = express.Router();

// POST /api/submissions - Create a new submission
router.post('/', async (req, res, next) => {
  const { configId } = req.body;
  if (!configId) {
    return res.status(400).json({ error: 'configId is required' });
  }

  try {
    const config = await FormConfig.findById(configId);
    if (!config) {
      return res.status(404).json({ error: 'Form configuration not found' });
    }

    const submission = new Submission({
      userId: 'user_001',
      configId,
      status: 'draft',
      currentStep: 0,
      completedSteps: []
    });

    await submission.save();
    res.status(201).json(submission);
  } catch (error) {
    next(error);
  }
});

// GET /api/submissions - List all submissions for userId "user_001"
router.get('/', async (req, res, next) => {
  try {
    const submissions = await Submission.find({ userId: 'user_001' })
      .populate('configId', 'title steps')
      .sort({ createdAt: -1 });
    res.json(submissions);
  } catch (error) {
    next(error);
  }
});

// GET /api/submissions/:id - Get a single submission + all its answers
router.get('/:id', async (req, res, next) => {
  try {
    const submission = await Submission.findById(req.params.id).populate('configId');
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    const stepAnswers = await StepAnswer.find({ submissionId: req.params.id });
    res.json({
      submission,
      stepAnswers
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/submissions/:id/steps/:stepId - Save or update step answers
router.patch('/:id/steps/:stepId', validateStepMiddleware, async (req, res, next) => {
  const { id: submissionId, stepId } = req.params;
  const { answers, currentStep } = req.body;

  try {
    const submission = req.submissionDoc || await Submission.findById(submissionId);
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    // Upsert StepAnswer
    await StepAnswer.findOneAndUpdate(
      { submissionId, stepId },
      { answers: answers || {}, savedAt: new Date() },
      { upsert: true, new: true }
    );

    // Calculate current step index
    let stepIdx = currentStep;
    if (stepIdx === undefined) {
      const config = req.formConfigDoc || await FormConfig.findById(submission.configId);
      if (config) {
        const foundIdx = config.steps.findIndex(s => s.id === stepId);
        if (foundIdx !== -1) {
          stepIdx = foundIdx;
        } else {
          stepIdx = 0;
        }
      } else {
        stepIdx = 0;
      }
    }

    // Atomically add step to completedSteps and update currentStep
    const updatedSubmission = await Submission.findByIdAndUpdate(
      submissionId,
      {
        $addToSet: { completedSteps: stepId },
        $set: { currentStep: stepIdx }
      },
      { new: true }
    );

    res.json(updatedSubmission);
  } catch (error) {
    next(error);
  }
});

// POST /api/submissions/:id/complete - Validate all steps and mark as completed
router.post('/:id/complete', async (req, res, next) => {
  try {
    const submission = await Submission.findById(req.params.id).populate('configId');
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    const stepAnswers = await StepAnswer.find({ submissionId: req.params.id });
    const answersMap = {};
    stepAnswers.forEach(sa => {
      answersMap[sa.stepId] = sa.answers || {};
    });

    const errors = {};

    // Validate ALL fields in ALL steps
    for (const step of submission.configId.steps) {
      const stepAns = answersMap[step.id] || {};
      for (const field of step.fields) {
        const val = stepAns[field.id];
        const hasValue = val !== undefined && val !== null && String(val).trim() !== '';

        if (field.required && !hasValue) {
          errors[field.id] = `${field.label} is required (Step: ${step.label})`;
          continue;
        }

        if (hasValue) {
          const strVal = String(val).trim();
          if (field.validation?.minLength && strVal.length < field.validation.minLength) {
            errors[field.id] = `${field.label} must be at least ${field.validation.minLength} characters (Step: ${step.label})`;
          }
          if (field.validation?.maxLength && strVal.length > field.validation.maxLength) {
            errors[field.id] = `${field.label} must be at most ${field.validation.maxLength} characters (Step: ${step.label})`;
          }
          if (field.validation?.pattern) {
            try {
              const regex = new RegExp(field.validation.pattern);
              if (!regex.test(strVal)) {
                errors[field.id] = `${field.label} format is invalid (Step: ${step.label})`;
              }
            } catch (e) {
              console.error('Invalid regex pattern:', field.validation.pattern);
            }
          }
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ errors });
    }

    // Set status to completed
    submission.status = 'completed';
    await submission.save();

    res.json(submission);
  } catch (error) {
    next(error);
  }
});

export default router;
