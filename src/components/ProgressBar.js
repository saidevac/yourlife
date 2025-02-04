import React from 'react';

const ProgressBar = ({ stats, timeUnit, formatNumber }) => {
  const { percentageLived, percentageFuture, percentageRemaining } = stats;
  
  return (
    <div className="flex flex-col gap-2 w-[110%]">
      <div className="flex justify-between text-[11px] text-gray-600">
        <span>{formatNumber(percentageLived)}% lived</span>
        <span>{formatNumber(percentageRemaining)}% remain</span>
      </div>
      <div className="w-full h-2 bg-gray-200 rounded-full relative">
        <div 
          className="h-2 rounded-full"
          style={{ 
            width: `${percentageLived}%`,
            maxWidth: '100%',
            background: '#818CF8'
          }}
        >
          <div 
            className="h-2 rounded-full absolute right-0"
            style={{ 
              width: `${percentageRemaining}%`,
              background: '#E5E7EB'
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;
