import React from 'react';

const FeedbackButton = () => {
  const handleFeedback = () => {
    const subject = encodeURIComponent("Feedback for Your Life App");
    const body = encodeURIComponent("Please provide your feedback here...");
    window.location.href = `mailto:saidevac1129@gmail.com?subject=${subject}&body=${body}`;
  };

  return (
    <button 
      onClick={handleFeedback} 
      className="fixed bottom-4 left-4 p-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors shadow-sm text-sm"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline-block mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h18a2 2 0 012 2v14a2 2 0 01-2 2H3a2 2 0 01-2-2V5a2 2 0 012-2z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7l9 6 9-6" />
      </svg>
      Feedback
    </button>
  );
};

export default FeedbackButton;
