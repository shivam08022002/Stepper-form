import Submission from '../models/Submission.js';
import FormConfig from '../models/FormConfig.js';

export const validateStepMiddleware = async (req, res, next) => {
  const { id: submissionId, stepId } = req.params;
  const { answers, draft } = req.body;

  // Skip validation if it is a draft save
  if (draft === true) {
    return next();
  }

  try {
    const submission = await Submission.findById(submissionId);
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    const config = await FormConfig.findById(submission.configId);
    if (!config) {
      return res.status(404).json({ error: 'Form configuration not found' });
    }

    req.submissionDoc = submission;
    req.formConfigDoc = config;

    const step = config.steps.find(s => s.id === stepId);
    if (!step) {
      return res.status(404).json({ error: `Step "${stepId}" not found in form configuration` });
    }

    const errors = {};
    const answersMap = answers || {};

    for (const field of step.fields) {
      const val = answersMap[field.id];
      const hasValue = val !== undefined && val !== null && String(val).trim() !== '';

      if (field.required && !hasValue) {
        errors[field.id] = `${field.label} is required`;
        continue;
      }

      if (hasValue) {
        const strVal = String(val).trim();
        if (field.validation?.minLength && strVal.length < field.validation.minLength) {
          errors[field.id] = `${field.label} must be at least ${field.validation.minLength} characters`;
        }
        if (field.validation?.maxLength && strVal.length > field.validation.maxLength) {
          errors[field.id] = `${field.label} must be at most ${field.validation.maxLength} characters`;
        }
        if (field.validation?.pattern) {
          try {
            const regex = new RegExp(field.validation.pattern);
            if (!regex.test(strVal)) {
              errors[field.id] = `${field.label} format is invalid`;
            }
          } catch (e) {
            console.error('Invalid regex pattern:', field.validation.pattern);
          }
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ errors });
    }

    next();
  } catch (error) {
    next(error);
  }
};
