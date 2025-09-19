import React from 'react';
import ECGViewer from '../../components/ECGViewer'; // 아래에서 만들 Placeholder 컴포넌트
import './BioSignal.css';

export default function BioSignal({ bioSignal }) {
  return (
    <div className="bioContainer">
      <h2 className="title">Bio Signal Information</h2>

      {bioSignal && bioSignal.length > 0 ? (
        bioSignal.map((signal, i) => (
          <div key={i}>
            <div className="bio-signal-row">
              <span className="text-sm">
                <strong>Date:</strong> {signal.concept_name}
              </span>
              <span className="divider">|</span>
              <span className="text-sm">
                <strong>Concept ID:</strong> {signal.bio_signal_concept_id}
              </span>
              <span className="divider">|</span>
              <span className="text-sm">
                <strong>Source Value:</strong> {signal.bio_signal_source_value}
              </span>
            </div>
            {/* Svelte와 동일하게 하드코딩된 경로를 사용합니다. */}
            <ECGViewer filePath="/140474_20160807_0830.xml" />
          </div>
        ))
      ) : (
        <p className="text-sm text-gray-500">No bio signal data available.</p>
      )}
    </div>
  );
}
