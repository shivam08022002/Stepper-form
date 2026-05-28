import React from 'react';

const ProgressBar = ({ steps, currentStep, completedSteps, onStepClick, isViewOnly }) => {
  return (
    <div className="stepper-progress-container">
      <div className="stepper-progress-steps">
        {steps.map((step, idx) => {
          const isActive = idx === currentStep;
          const isCompleted = completedSteps.includes(step.id);
          // Allow going to any step if view-only, or back to previous/completed steps
          const isClickable = isViewOnly || isCompleted || idx < currentStep;

          return (
            <div 
              key={step.id} 
              className={`progress-step-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''} ${isClickable ? 'clickable' : ''}`}
              onClick={() => isClickable && onStepClick(idx)}
            >
              <div className="progress-step-dot">
                {isCompleted ? (
                  <svg className="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="12" height="12">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <span>{idx + 1}</span>
                )}
              </div>
              <span className="progress-step-label">{step.label}</span>
            </div>
          );
        })}
        <div className="progress-connecting-line-bg">
          <div 
            className="progress-connecting-line-fill" 
            style={{ width: `${steps.length > 1 ? (currentStep / (steps.length - 1)) * 100 : 0}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;
