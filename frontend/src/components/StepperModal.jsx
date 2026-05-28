import React, { useState, useEffect, useRef } from 'react';
import { getSubmission, saveStepAnswer, completeSubmission } from '../api';
import { useUnsavedChanges } from '../hooks/useUnsavedChanges';
import ProgressBar from './ProgressBar';
import StepRenderer from './StepRenderer';

const StepperModal = ({ isOpen, submissionId, onClose, onRefresh }) => {
  const dialogRef = useRef(null);
  
  const [loading, setLoading] = useState(true);
  const [submission, setSubmission] = useState(null);
  const [config, setConfig] = useState(null);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  
  // Answers state
  const [allAnswers, setAllAnswers] = useState({}); // { [stepId]: { [fieldId]: value } }
  const [currentStepAnswers, setCurrentStepAnswers] = useState({});
  const [savedStepAnswers, setSavedStepAnswers] = useState({});
  
  // Validation errors
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState('');
  const [saving, setSaving] = useState(false);

  // Bind our custom unsaved changes hook
  const { isDirty } = useUnsavedChanges(savedStepAnswers, currentStepAnswers);

  // Sync open/close of native dialog
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
        // Prevent background scrolling
        document.body.style.overflow = 'hidden';
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
      document.body.style.overflow = '';
    }
  }, [isOpen]);

  // Load submission and config details
  useEffect(() => {
    if (!isOpen || !submissionId) return;

    const loadData = async () => {
      setLoading(true);
      setGlobalError('');
      setErrors({});
      try {
        const response = await getSubmission(submissionId);
        const subData = response.data.submission;
        const answersData = response.data.stepAnswers;

        setSubmission(subData);
        
        const formConfig = subData.configId;
        setConfig(formConfig);

        // Resume at currentStep (ensure bounds)
        const resumeIdx = Math.min(
          Math.max(0, subData.currentStep),
          formConfig.steps.length - 1
        );
        setCurrentStepIdx(resumeIdx);

        // Load all answers into map
        const answersMap = {};
        formConfig.steps.forEach(step => {
          const matchedAnswer = answersData.find(sa => sa.stepId === step.id);
          answersMap[step.id] = matchedAnswer ? matchedAnswer.answers : {};
        });
        setAllAnswers(answersMap);

        // Initialize current step answers
        const activeStepId = formConfig.steps[resumeIdx].id;
        const currentAns = answersMap[activeStepId] || {};
        setCurrentStepAnswers({ ...currentAns });
        setSavedStepAnswers({ ...currentAns });
      } catch (err) {
        console.error('Error loading submission details:', err);
        setGlobalError('Failed to load form details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isOpen, submissionId]);

  // Handle active step changes (sync current answers)
  const changeActiveStep = (newIdx) => {
    if (!config) return;
    const currentStepId = config.steps[currentStepIdx].id;
    
    // Save current step values to allAnswers map before switching
    setAllAnswers(prev => ({
      ...prev,
      [currentStepId]: currentStepAnswers
    }));

    const newStepId = config.steps[newIdx].id;
    const newAnswers = allAnswers[newStepId] || {};
    
    setCurrentStepIdx(newIdx);
    setCurrentStepAnswers({ ...newAnswers });
    setSavedStepAnswers({ ...newAnswers });
    setErrors({});
  };

  const handleStepClick = (idx) => {
    if (isViewOnly) {
      changeActiveStep(idx);
      return;
    }
    if (isDirty) {
      const leave = window.confirm('You have unsaved changes. Leave anyway?');
      if (!leave) return;
    }
    changeActiveStep(idx);
  };

  const handleFieldChange = (fieldId, value) => {
    setCurrentStepAnswers(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  // Close modal request (guards against unsaved state)
  const handleRequestClose = () => {
    if (isDirty) {
      const leave = window.confirm('You have unsaved changes. Leave anyway?');
      if (!leave) return;
    }
    onClose();
  };

  // Intercept native Backdrop click
  const handleDialogClick = (e) => {
    if (e.target === dialogRef.current) {
      handleRequestClose();
    }
  };

  const handleBack = () => {
    if (currentStepIdx > 0) {
      if (isDirty) {
        const leave = window.confirm('You have unsaved changes in this step. Go back anyway?');
        if (!leave) return;
      }
      changeActiveStep(currentStepIdx - 1);
    }
  };

  // Partial Draft Save
  const handleSaveDraft = async () => {
    if (!config || !submission) return;
    const activeStepId = config.steps[currentStepIdx].id;
    setSaving(true);
    setErrors({});
    setGlobalError('');

    try {
      const response = await saveStepAnswer(
        submission._id,
        activeStepId,
        currentStepAnswers,
        currentStepIdx,
        true // draft: true (skips validations)
      );
      
      // Update saved answers to clear dirty status
      setSavedStepAnswers({ ...currentStepAnswers });
      setSubmission(response.data);
      onRefresh();
    } catch (err) {
      console.error('Error saving draft:', err);
      setGlobalError(err.response?.data?.error || 'Failed to save draft answers.');
    } finally {
      setSaving(false);
    }
  };

  // Save and Advance
  const handleSaveAndNext = async () => {
    if (!config || !submission) return;
    const activeStepId = config.steps[currentStepIdx].id;
    setSaving(true);
    setErrors({});
    setGlobalError('');

    try {
      const nextStepIdx = currentStepIdx + 1;
      const response = await saveStepAnswer(
        submission._id,
        activeStepId,
        currentStepAnswers,
        nextStepIdx,
        false // draft: false (validates)
      );

      // On successful save, update allAnswers map with these values
      const updatedAllAnswers = {
        ...allAnswers,
        [activeStepId]: currentStepAnswers
      };
      setAllAnswers(updatedAllAnswers);

      // Switch to next step
      const newStepId = config.steps[nextStepIdx].id;
      const nextStepAnswers = updatedAllAnswers[newStepId] || {};
      
      setCurrentStepIdx(nextStepIdx);
      setCurrentStepAnswers({ ...nextStepAnswers });
      setSavedStepAnswers({ ...nextStepAnswers });
      setSubmission(response.data);
      onRefresh();
    } catch (err) {
      console.error('Validation or Server Error:', err);
      if (err.response?.status === 400 && err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else {
        setGlobalError(err.response?.data?.error || 'Failed to advance to next step.');
      }
    } finally {
      setSaving(false);
    }
  };

  // Final Complete Submission
  const handleSubmit = async () => {
    if (!config || !submission) return;
    const activeStepId = config.steps[currentStepIdx].id;
    setSaving(true);
    setErrors({});
    setGlobalError('');

    try {
      // 1. Save the final step's answers first with validation
      await saveStepAnswer(
        submission._id,
        activeStepId,
        currentStepAnswers,
        currentStepIdx,
        false
      );

      // 2. Trigger the completion validation checks across all steps
      await completeSubmission(submission._id);

      onRefresh();
      onClose();
    } catch (err) {
      console.error('Error submitting form:', err);
      if (err.response?.status === 400 && err.response?.data?.errors) {
        setErrors(err.response.data.errors);
        setGlobalError('Please fix the errors in your submission before submitting.');
      } else {
        setGlobalError(err.response?.data?.error || 'Failed to finalize submission.');
      }
    } finally {
      setSaving(false);
    }
  };

  const steps = config?.steps || [];
  const currentStep = steps[currentStepIdx];
  const isLastStep = config && currentStepIdx === config.steps.length - 1;
  const isViewOnly = submission?.status === 'completed';

  return (
    <dialog
      ref={dialogRef}
      className="stepper-dialog"
      onClick={handleDialogClick}
      onCancel={(e) => {
        e.preventDefault();
        handleRequestClose();
      }}
    >
      <div className="stepper-modal-content">
        <header className="stepper-modal-header">
          <h2>{config?.title || 'Form Submission'}</h2>
          <button className="close-x-btn" onClick={handleRequestClose} aria-label="Close modal">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </header>

        {loading ? (
          <div className="stepper-modal-loading">
            <div className="spinner" />
            <p>Loading intake details...</p>
          </div>
        ) : (
          <>
            <ProgressBar
              steps={steps}
              currentStep={currentStepIdx}
              completedSteps={submission?.completedSteps || []}
              onStepClick={handleStepClick}
              isViewOnly={isViewOnly}
            />

            {globalError && <div className="modal-error-banner">{globalError}</div>}
            
            {isViewOnly && (
              <div className="modal-info-banner">
                This intake has been submitted and is locked for editing.
              </div>
            )}

            <main className="stepper-modal-body">
              {currentStep && (
                <StepRenderer
                  fields={currentStep.fields}
                  answers={currentStepAnswers}
                  errors={isViewOnly ? {} : errors}
                  onChange={isViewOnly ? () => {} : handleFieldChange}
                />
              )}
            </main>

            <footer className="stepper-modal-footer">
              <div className="footer-left">
                {currentStepIdx > 0 && (
                  <button className="btn-secondary" onClick={handleBack} disabled={saving}>
                    Back
                  </button>
                )}
              </div>
              <div className="footer-right">
                {isDirty && !isViewOnly && (
                  <span className="unsaved-indicator">Unsaved changes</span>
                )}
                
                {!isViewOnly && (
                  <>
                    <button className="btn-tertiary" onClick={handleSaveDraft} disabled={saving}>
                      {saving ? 'Saving...' : 'Save Draft'}
                    </button>

                    {isLastStep ? (
                      <button className="btn-primary" onClick={handleSubmit} disabled={saving}>
                        {saving ? 'Submitting...' : 'Submit'}
                      </button>
                    ) : (
                      <button className="btn-primary" onClick={handleSaveAndNext} disabled={saving}>
                        {saving ? 'Saving...' : 'Save & Next'}
                      </button>
                    )}
                  </>
                )}

                {isViewOnly && (
                  <button className="btn-primary" onClick={onClose}>
                    Close
                  </button>
                )}
              </div>
            </footer>
          </>
        )}
      </div>
    </dialog>
  );
};

export default StepperModal;
