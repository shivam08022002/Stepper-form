import React from 'react';

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const optionsDate = { month: 'short', day: 'numeric', year: 'numeric' };
  const formattedDate = d.toLocaleDateString('en-US', optionsDate); // "May 25, 2026"
  
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12;
  hours = hours ? hours : 12;
  
  return `${formattedDate}, ${hours}:${minutes}${ampm}`; // "May 25, 2026, 1:37pm"
};

const SubmissionList = ({ submissions, formConfigs, onCreateNew, onOpen, loading, isCreating }) => {
  // Filter out draft submissions that have no input/progress (no completed steps)
  const visibleSubmissions = submissions.filter(sub => {
    if (sub.status === 'completed') return true;
    return sub.completedSteps && sub.completedSteps.length > 0;
  });

  // Find "Wellness Intake" config to provide a direct starter action
  const wellnessConfig = formConfigs.find(c => c.title === 'Wellness Intake') || formConfigs[0];

  return (
    <div className="submissions-dashboard">
      <header className="dashboard-header">
        <div className="header-text">
          <h1>My Submissions</h1>
          <p className="subtitle">Resume your active drafts or fill out new wellness intake forms.</p>
        </div>
        {wellnessConfig && (
          <button 
            className="btn-primary start-new-btn"
            onClick={() => onCreateNew(wellnessConfig._id)}
            disabled={isCreating}
          >
            {isCreating ? (
              <>
                <div className="spinner-mini" style={{ marginRight: '8px' }} />
                Creating a new form...
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" className="btn-icon">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Start Wellness Intake
              </>
            )}
          </button>
        )}
      </header>

      {loading ? (
        <div className="dashboard-loading">
          <div className="spinner" />
          <p>Fetching your submissions...</p>
        </div>
      ) : visibleSubmissions.length === 0 ? (
        <div className="empty-dashboard-card">
          <div className="empty-icon">
            <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3>No submissions yet</h3>
          <p>Click the button above to begin filling out your Wellness Intake Form.</p>
        </div>
      ) : (
        <div className="submissions-grid">
          {visibleSubmissions.map((sub) => {
            const config = sub.configId;
            const title = config?.title || 'Intake Form';
            const totalSteps = config?.steps?.length || 0;
            const completedCount = sub.completedSteps?.length || 0;
            const status = sub.status; // 'draft' or 'completed'
            const progressPct = totalSteps > 0 ? (completedCount / totalSteps) * 100 : 0;

            return (
              <article key={sub._id} className={`submission-card ${status}`}>
                <div className="card-badge-row">
                  <span className={`status-badge ${status}`}>
                    {status === 'completed' ? 'Completed' : 'Draft'}
                  </span>
                  <span className="step-fraction">
                    {completedCount}/{totalSteps} Steps
                  </span>
                </div>

                <div className="card-body">
                  <h3 className="card-title">{formatDate(sub.createdAt)}</h3>
                  <h4 className="card-form-name">{title}</h4>
                  
                  <div className="card-progress-bar-bg">
                    <div className="card-progress-bar-fill" style={{ width: `${progressPct}%` }} />
                  </div>
                </div>

                <footer className="card-footer">
                  {status === 'draft' ? (
                    <button className="btn-card-action btn-resume" onClick={() => onOpen(sub._id)}>
                      Resume Draft
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </button>
                  ) : (
                    <button className="btn-card-action btn-view" onClick={() => onOpen(sub._id)}>
                      View Answers
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    </button>
                  )}
                </footer>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SubmissionList;
