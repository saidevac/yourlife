import React from 'react';

const ProgressText = ({ stats, timeUnit, formatNumber }) => {
  const { lived, remaining } = stats;
  const unitLabel = timeUnit.slice(0, -1); // Remove 's' from end

  return (
    <div className="flex flex-col gap-1.5 text-sm text-gray-600">
      <span>
        {`${formatNumber(lived)} ${unitLabel}${lived === 1 ? '' : 's'} lived`}
      </span>
      <span>
        {`${formatNumber(remaining)} ${unitLabel}${remaining === 1 ? '' : 's'} remain`}
      </span>
    </div>
  );
};

export default ProgressText;
