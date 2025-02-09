import React from 'react';

const ProgressText = ({ stats, timeUnit, formatNumber }) => {
  const { lived, remaining, futureCommitted } = stats;
  const unitLabel = timeUnit.slice(0, -1); // Remove 's' from end

  return (
    <div className="flex flex-col gap-1.5 text-sm">
      <span className="text-indigo-400">
        {`${formatNumber(lived)} ${unitLabel}${lived === 1 ? '' : 's'} lived`}
      </span>
      <span className="text-blue-500">
        {`${formatNumber(futureCommitted)} ${unitLabel}${futureCommitted === 1 ? '' : 's'} planned`}
      </span>
      <span className="text-orange-400">
        {`${formatNumber(remaining)} ${unitLabel}${remaining === 1 ? '' : 's'} remain`}
      </span>
    </div>
  );
};

export default ProgressText;
