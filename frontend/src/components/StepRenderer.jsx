import React from 'react';

const StepRenderer = ({ fields, answers, errors, onChange }) => {
  return (
    <div className="step-renderer-container">
      {fields.map((field) => {
        const error = errors[field.id];
        const isRequired = field.required;

        return (
          <div key={field.id} className={`form-field-group ${error ? 'has-error' : ''}`}>
            <label className="form-field-label" htmlFor={field.id}>
              {field.label}
              {isRequired && <span className="required-asterisk"> *</span>}
            </label>

            {field.type === 'text' && (
              <input
                id={field.id}
                type="text"
                className="form-field-input-text"
                value={answers[field.id] || ''}
                onChange={(e) => onChange(field.id, e.target.value)}
                placeholder={`Enter your ${field.label.toLowerCase()}`}
              />
            )}

            {field.type === 'select' && (
              <select
                id={field.id}
                className="form-field-input-select"
                value={answers[field.id] || ''}
                onChange={(e) => onChange(field.id, e.target.value)}
              >
                <option value="">Select an option</option>
                {field.options &&
                  field.options.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
              </select>
            )}

            {field.type === 'radio' && (
              <div className="form-field-radio-group">
                {field.options &&
                  field.options.map((opt, optIdx) => {
                    const optionId = `${field.id}_${optIdx}`;
                    return (
                      <label key={opt} htmlFor={optionId} className="form-field-radio-label">
                        <input
                          id={optionId}
                          type="radio"
                          name={field.id}
                          className="form-field-input-radio"
                          value={opt}
                          checked={answers[field.id] === opt}
                          onChange={() => onChange(field.id, opt)}
                        />
                        <span className="radio-text">{opt}</span>
                      </label>
                    );
                  })}
              </div>
            )}

            {error && <span className="form-field-error-message">{error}</span>}
          </div>
        );
      })}
    </div>
  );
};

export default StepRenderer;
