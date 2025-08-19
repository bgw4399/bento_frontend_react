import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="flex items-center space-x-2">
            <div className="h-12 flex items-center text-lg font-semibold text-gray-600">Kookmin University</div>
            <div className="h-8 w-px bg-gray-200"></div>
            <div className="h-12 flex items-center text-lg font-semibold text-gray-600">SNUH</div>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">
              A Collaborative Project between Kookmin University Capstone Design Team 16 
              <br />and Seoul National University Hospital Institute of Convergence Medicine with Innovative Technology
            </p>
          </div>
          <div className="text-xs text-gray-400">
            © 2025 Capstone Design Team 16. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}