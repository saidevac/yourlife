import React from 'react';

const ProgressBar = ({ stats, timeUnit, formatNumber }) => {
  const { percentageLived, percentageFuture, percentageRemaining } = stats;
  
  return (
    <div className="flex flex-col gap-2 w-[110%]">
      <div className="flex justify-between text-[11px]">
        <span className="text-indigo-400">{formatNumber(percentageLived)}% lived</span>
        <span className="text-orange-400">{formatNumber(percentageRemaining)}% remain</span>
      </div>
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="h-full bg-indigo-400"
          style={{ 
            width: `${percentageLived}%`,
          }}
        />
        <div 
          className="h-full bg-orange-400"
          style={{ 
            width: `${percentageFuture}%`,
            marginLeft: `${percentageLived}%`,
            marginTop: '-8px'
          }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
