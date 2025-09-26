// src/components/AccessDeniedPage.tsx

import React from 'react';
import { Result, Button } from 'antd';
import { useNavigate } from 'react-router-dom';

const AccessDeniedPage: React.FC = () => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    // Navigate to the home page or login page
    navigate('/performance/machine-availability'); 
  };

  return (
    <div style={{ padding: '50px', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <Result
        status="403"
        title="403"
        subTitle="Sorry, you are not authorized to access this page."
        extra={<Button type="primary" onClick={handleGoHome}>Back Home</Button>}
      />
    </div>
  );
};

export default AccessDeniedPage;