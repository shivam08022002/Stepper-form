import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5001/api',
});

export const getFormConfigs = () => API.get('/form-configs');
export const getFormConfig = (id) => API.get(`/form-configs/${id}`);

export const createSubmission = (configId) => API.post('/submissions', { configId });
export const getSubmissions = () => API.get('/submissions');
export const getSubmission = (id) => API.get(`/submissions/${id}`);

export const saveStepAnswer = (submissionId, stepId, answers, currentStep, draft = false) => 
  API.patch(`/submissions/${submissionId}/steps/${stepId}`, { answers, currentStep, draft });

export const completeSubmission = (submissionId) => 
  API.post(`/submissions/${submissionId}/complete`);
