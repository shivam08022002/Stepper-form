import { useState, useEffect } from 'react';

export const useUnsavedChanges = (savedAnswers, currentAnswers) => {
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (!savedAnswers || !currentAnswers) {
      setIsDirty(false);
      return;
    }

    const normalize = (obj) => {
      const copy = {};
      Object.keys(obj).forEach(key => {
        if (obj[key] !== undefined && obj[key] !== null && String(obj[key]).trim() !== '') {
          copy[key] = String(obj[key]).trim();
        }
      });
      return copy;
    };

    const normSaved = normalize(savedAnswers);
    const normCurrent = normalize(currentAnswers);

    const keysS = Object.keys(normSaved);
    const keysC = Object.keys(normCurrent);

    if (keysS.length !== keysC.length) {
      setIsDirty(true);
      return;
    }

    const differs = keysS.some(key => normSaved[key] !== normCurrent[key]);
    setIsDirty(differs);
  }, [savedAnswers, currentAnswers]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Leave anyway?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty]);

  return { isDirty };
};
