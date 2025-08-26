import React from 'react';
import { Routes, Route } from 'react-router-dom';

import Layout from './components/Layout';
import PersonLayout from './components/PersonLayout';

import HomePage from './pages/HomePage/HomePage.jsx';
import CohortListPage from './pages/CohortListPage/CohortListPage.jsx';
import PersonSearchPage from './pages/PersonSearchPage/PersonSearchPage.jsx';
import PersonDetailPage from './pages/PersonDetailPage/PersonDetailPage.jsx';
import LoginPage from './pages/LoginPage/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage/RegisterPage.jsx'
import CohortDefinitionPage from "./pages/CohortDefinitionPage/CohortDefinitionPage.jsx";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} /> 
        <Route index element={<HomePage />} />
        <Route path="cohort" element={<CohortListPage />} />
        <Route path="/cohort-definition" element={<CohortDefinitionPage />} />

        <Route path="person" element={<PersonLayout />}>
          <Route index element={<PersonSearchPage />} />

          {/* 2. 주석 해제하여 상세 페이지 경로 활성화 */}
          <Route path=":personId" element={<PersonDetailPage />} />


        </Route>

      </Route>
    </Routes>
  );
}

export default App;