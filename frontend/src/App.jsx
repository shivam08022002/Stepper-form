import React, { useState, useEffect } from 'react';
import { getSubmissions, getFormConfigs, createSubmission } from './api';
import SubmissionList from './components/SubmissionList';
import StepperModal from './components/StepperModal';

function App() {
  const [submissions, setSubmissions] = useState([]);
  const [formConfigs, setFormConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [activeSubmissionId, setActiveSubmissionId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchData = async () => {
    try {
      const [subsResponse, configsResponse] = await Promise.all([
        getSubmissions(),
        getFormConfigs()
      ]);
      setSubmissions(subsResponse.data);
      setFormConfigs(configsResponse.data);
    } catch (error) {
      console.error('Error fetching initial dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateNew = async (configId) => {
    try {
      const response = await createSubmission(configId);
      const newSub = response.data;
      
      // Refresh full list from database to ensure titles/populated steps exist
      await fetchData();
      
      // Open stepper modal immediately for the new submission
      setActiveSubmissionId(newSub._id);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error creating new submission:', error);
      alert('Failed to start new submission. Is the backend running?');
    }
  };

  const handleOpenModal = (submissionId) => {
    setActiveSubmissionId(submissionId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setActiveSubmissionId(null);
  };

  return (
    <div className="app-container">
      <main className="app-main-content">
        <SubmissionList
          submissions={submissions}
          formConfigs={formConfigs}
          onCreateNew={handleCreateNew}
          onOpen={handleOpenModal}
          loading={loading}
        />
      </main>

      <StepperModal
        isOpen={isModalOpen}
        submissionId={activeSubmissionId}
        onClose={handleCloseModal}
        onRefresh={fetchData}
      />
    </div>
  );
}

export default App;
