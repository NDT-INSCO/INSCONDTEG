import React from 'react';
import { Language } from '../../types';
import { NdtVirtualLabWorkbench } from './virtuallab/NdtVirtualLabWorkbench';

interface InteractiveWorkshopsProps {
  language: Language;
}

export const InteractiveWorkshops: React.FC<InteractiveWorkshopsProps> = ({ language }) => {
  return (
    <div className="space-y-6">
      <NdtVirtualLabWorkbench language={language} />
    </div>
  );
};