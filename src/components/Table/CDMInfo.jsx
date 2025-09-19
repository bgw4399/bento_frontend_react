import React from 'react';
import './CDMInfo.css';

export default function CDMInfo({ visitOccurrence, careSite, location }) {
  return (
    <div className="visit-container">
      <h2 className="title">Visit & Care Site Information</h2>
      <div className="visit-row">
        <div className="visit-info">
          <span className="info">
            <strong>Visit ID:</strong> {visitOccurrence?.visit_occurrence_id}
          </span>
          <span className="info">
            <strong>Visit Dates:</strong> {visitOccurrence?.visit_start_date} ~{' '}
            {visitOccurrence?.visit_end_date}
          </span>
          <span className="info">
            <strong>Concept ID:</strong> {visitOccurrence?.concept_name}
          </span>
        </div>
        <div className="care-info">
          <span className="info">
            <strong>Care Site:</strong> {careSite?.care_site_name || 'No data'}
          </span>
          <span className="info">
            <strong>Address:</strong>{' '}
            {location
              ? `${location?.address_1}, ${location?.address_2} / ${location?.zip}`
              : 'No data'}
          </span>
        </div>
      </div>
    </div>
  );
}
