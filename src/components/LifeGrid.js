import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { useLifeGridCalculations } from '../hooks/useLifeGridCalculations';
import { createLifeGrid } from '../utils/gridCreation';
import { createActivityRow } from '../utils/activityPanel';
import ProgressBar from './ProgressBar';
import ProgressText from './ProgressText';
import * as htmlToImage from 'html-to-image';
import { shapes } from '../utils/gridShapes';

const LifeGrid = () => {
  const svgRef = useRef(null);
  const containerRef = useRef(null);

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [showMobileMessage, setShowMobileMessage] = useState(window.innerWidth < 640);
  const [birthDate, setBirthDate] = useState('1978-01-01');
  const [timeUnit, setTimeUnit] = useState('years');
  const [lifespan, setLifespan] = useState(80);
  const [activities, setActivities] = useState([
    { id: 1, name: 'Sleeping', hours: 8, timeUnit: 'day', hoursPerDay: 8, color: '#000000', spent: false, future: false },
    { id: 2, name: 'Eating', hours: 2, timeUnit: 'day', hoursPerDay: 2, color: '#22C55E', spent: false, future: false },
    { id: 3, name: 'Personal Hygiene', hours: 1, timeUnit: 'day', hoursPerDay: 8, color: '#3B82F6', spent: false, future: false }
  ]);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [selectedPastHours, setSelectedPastHours] = useState(0);
  const [selectedFutureHours, setSelectedFutureHours] = useState(0);
  const [currentShape, setCurrentShape] = useState('square');
  const [activityTimeUnit, setActivityTimeUnit] = useState('day');
  const [annotations, setAnnotations] = useState([
    {
      type: 'grid',
      text: 'Each row is one decade',
      position: 'topWithArrows',
      color: '#3B82F6',
      showInView: 'years'
    },
    {
      type: 'grid',
      text: 'Each row is 52 weeks = 1 year',
      position: 'topWithArrows',
      color: '#3B82F6',
      showInView: 'weeks'
    },
    {
      type: 'grid',
      text: 'Each row is 24 months = 2 years',
      position: 'topWithArrows',
      color: '#3B82F6',
      showInView: 'months'
    },
    {
      type: 'cell',
      text: 'Turning\n20',
      position: 'left',
      color: '#22C55E',
      cellIndex: 20 * 52, // 20 years in weeks
      showInView: 'weeks'
    },
    {
      type: 'cell',
      text: 'Turning\n40',
      position: 'left',
      color: '#EAB308',
      cellIndex: 40 * 52, // 40 years in weeks
      showInView: 'weeks'
    },
    {
      type: 'cell',
      text: 'Turning\n60',
      position: 'left',
      color: '#8B5CF6',
      cellIndex: 60 * 52, // 60 years in weeks
      showInView: 'weeks'
    },
    {
      type: 'cell',
      text: 'Turning\n20',
      position: 'left',
      color: '#22C55E',
      cellIndex: 20 * 12, // 20 years in months
      showInView: 'months'
    },
    {
      type: 'cell',
      text: 'Turning\n40',
      position: 'left',
      color: '#EAB308',
      cellIndex: 40 * 12, // 40 years in months
      showInView: 'months'
    },
    {
      type: 'cell',
      text: 'Turning\n60',
      position: 'left',
      color: '#8B5CF6',
      cellIndex: 60 * 12, // 60 years in months
      showInView: 'months'
    }
  ]);

  const calculateHoursPerDay = useCallback((hours, timeUnit) => {
    switch (timeUnit) {
      case 'week':
        return hours / 7;
      case 'month':
        return hours / 30;
      case 'year':
        return hours / 365;
      default: // day
        return hours;
    }
  }, []);

  const calculateProgress = useCallback(() => {
    const now = new Date();
    const birthDateObj = new Date(birthDate);

    // Calculate time difference in the current unit
    const getDifferenceInUnits = (date1, date2, unit) => {
      const diffInMilliseconds = date1 - date2;
      const millisecondsPerUnit = {
        years: 1000 * 60 * 60 * 24 * 365.25,
        months: 1000 * 60 * 60 * 24 * 30.44, // average month length
        weeks: 1000 * 60 * 60 * 24 * 7,
        days: 1000 * 60 * 60 * 24
      };
      return diffInMilliseconds / millisecondsPerUnit[unit];
    };

    // Calculate lived time
    const lived = getDifferenceInUnits(now, birthDateObj, timeUnit);

    // Calculate total lifespan in the current time unit
    const total = lifespan * (timeUnit === 'years' ? 1 : timeUnit === 'months' ? 12 : timeUnit === 'weeks' ? 52 : 365);

    // Calculate future committed time from activities
    const futureCommitted = activities.reduce((sum, activity) => {
      if (activity.future) {
        const hoursPerDay = activity.hoursPerDay || (activity.hours / (activity.timeUnit === 'day' ? 1 :
          activity.timeUnit === 'week' ? 7 : activity.timeUnit === 'month' ? 30 : 365));

        // Convert hours per day to years
        const yearsNeeded = (hoursPerDay * 365) / (24 * 365); // Convert to fraction of a year

        // Convert years to current time unit
        const unitsNeeded = yearsNeeded * (timeUnit === 'years' ? 1 :
          timeUnit === 'months' ? 12 :
            timeUnit === 'weeks' ? 52 : 365);

        return sum + unitsNeeded;
      }
      return sum;
    }, 0);

    // Calculate remaining time (subtract future committed time)
    const remaining = Math.max(0, total - lived - futureCommitted);

    return {
      lived,
      remaining,
      total,
      percentage: (lived / total) * 100
    };
  }, [birthDate, lifespan, timeUnit, activities]);

  const [progress, setProgress] = useState(() => ({
    lived: 0,
    total: 0,
    percentage: 0
  }));

  const {
    calculateBaseProgress,
    calculateAge,
    getActivityColorForCell,
    calculateTimeUnits
  } = useLifeGridCalculations(
    birthDate,
    lifespan,
    timeUnit,
    activities,
    windowWidth
  );

  const handleTimeUnitChange = useCallback((event) => {
    setTimeUnit(event.target.value);
  }, []);

  const handleBirthDateChange = useCallback((event) => {
    setBirthDate(event.target.value);
  }, []);

  const handleLifespanChange = useCallback((event) => {
    const parsed = parseInt(event.target.value);
    const value = event.target.value === '' || isNaN(parsed) ? 1 : parsed;
    if (value > 120) {
      setLifespan(120);
    } else if (value < 1) {
      setLifespan(1);
    } else {
      setLifespan(value);
    }
  }, []);

  const handleActivitySpentChange = (activityId, isSpent) => {
    setActivities(prevActivities =>
      prevActivities.map(activity =>
        activity.id === activityId
          ? { ...activity, spent: isSpent }
          : activity
      )
    );
  };

  const handleActivityFutureChange = (activityId, isFuture) => {
    setActivities(prevActivities =>
      prevActivities.map(activity =>
        activity.id === activityId
          ? { ...activity, future: isFuture }
          : activity
      )
    );
  };

  const handleActivityHoursChange = useCallback((id, hours) => {
    // Ensure hours is between 0 and 24, rounded to nearest 0.5
    const roundedHours = Math.round(hours * 2) / 2;
    const validHours = Math.min(24, Math.max(0, roundedHours));

    setActivities(prevActivities =>
      prevActivities.map(activity =>
        activity.id === id ? { ...activity, hours: validHours } : activity
      )
    );
  }, []);

  const handleActivityChange = useCallback((id, field, value) => {
    setActivities(prevActivities => prevActivities.map(activity => {
      if (activity.id === id) {
        const updatedActivity = { ...activity, [field]: value };

        // If hours or timeUnit changes, recalculate hoursPerDay
        if (field === 'hours' || field === 'timeUnit') {
          const hours = field === 'hours' ? value : activity.hours;
          const timeUnit = field === 'timeUnit' ? value : activity.timeUnit;
          updatedActivity.hoursPerDay = calculateHoursPerDay(hours, timeUnit);
        }

        return updatedActivity;
      }
      return activity;
    }));
  }, [calculateHoursPerDay]);

  const handleActivityNameChange = useCallback((id, name) => {
    setActivities(prevActivities => prevActivities.map(activity => {
      if (activity.id === id) {
        return { ...activity, name };
      }
      return activity;
    }));
  }, []);

  const handleActivityColorChange = useCallback((id, color) => {
    setActivities(prevActivities => prevActivities.map(activity => {
      if (activity.id === id) {
        return { ...activity, color };
      }
      return activity;
    }));
  }, []);

  const getUniqueColor = useCallback(() => {
    const colors = [
      '#EF4444', '#F59E0B', '#10B981', '#6366F1', '#EC4899',
      '#8B5CF6', '#14B8A6', '#F97316', '#06B6D4', '#8B5CF6'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }, []);

  const handleAddActivity = useCallback(() => {
    const newActivity = {
      id: activities.length + 1,
      name: 'New Activity',
      hours: 1, // Default 1 hour, already within 0-24 range
      timeUnit: 'day',
      color: getUniqueColor(),
      spent: false,
      future: false
    };
    setActivities([...activities, newActivity]);
  }, [activities.length, getUniqueColor]);

  const handleRemoveActivity = useCallback((id) => {
    setActivities(prevActivities => prevActivities.filter(activity => activity.id !== id));
  }, []);

  const handleShare = useCallback(() => {
    if (!containerRef.current) return;

    htmlToImage.toPng(containerRef.current, {
      quality: 1.0,
      backgroundColor: 'white',
      style: {
        transform: 'none'
      }
    })
      .then(dataUrl => {
        const link = document.createElement('a');
        link.download = 'your-life-timeline.png';
        link.href = dataUrl;
        link.click();
      })
      .catch(error => {
        console.error('Error creating image:', error);
      });
  }, []);

  const handleActivityTimeUnitChange = useCallback((activityId, timeUnit) => {
    setActivities(prevActivities =>
      prevActivities.map(activity =>
        activity.id === activityId
          ? { ...activity, timeUnit, hoursPerDay: calculateHoursPerDay(activity.hours, timeUnit) }
          : activity
      )
    );
  }, [calculateHoursPerDay]);

  const clearActivities = useCallback(() => {
    setActivities(prevActivities =>
      prevActivities.map(activity => ({
        ...activity,
        spent: false,
        future: false
      }))
    );
    setSelectedActivity(null);
    setSelectedPastHours(0);
    setSelectedFutureHours(0);
    setShowActivityModal(false);
  }, []);

  const formatNumber = (value) => {
    return typeof value === 'number' ? value.toFixed(1) : '0.0';
  };

  const getUnitDisplay = (timeUnit) => {
    switch (timeUnit) {
      case 'day':
        return 'hrs/day';
      case 'week':
        return 'hrs/week';
      case 'month':
        return 'hrs/month';
      case 'year':
        return 'hrs/year';
      default:
        return 'hrs/day';
    }
  };

  const calculateActivityPastFutureUnits = useCallback((activity) => {
    const now = new Date();
    const birthDateObj = new Date(birthDate);
    const lifeExpectancy = new Date(birthDateObj);
    lifeExpectancy.setFullYear(birthDateObj.getFullYear() + lifespan);

    // Calculate total hours per day for this activity
    const hoursPerDay = activity.hours / (
      activity.timeUnit === 'day' ? 1 :
        activity.timeUnit === 'week' ? 7 :
          activity.timeUnit === 'month' ? 30 :
            activity.timeUnit === 'year' ? 365 : 1
    );

    // Calculate total hours per year
    const hoursPerYear = hoursPerDay * 365.25;

    // Calculate years from birth to now
    const yearsSinceBirth = (now - birthDateObj) / (1000 * 60 * 60 * 24 * 365.25);
    const yearsRemaining = (lifeExpectancy - now) / (1000 * 60 * 60 * 24 * 365.25);

    // Calculate total hours based on years
    const totalPastHours = yearsSinceBirth * hoursPerYear;
    const totalFutureHours = yearsRemaining * hoursPerYear;

    // Convert to equivalent years (based on 24-hour days)
    const hoursInYear = 24 * 365.25;
    const pastYears = totalPastHours / hoursInYear;
    const futureYears = totalFutureHours / hoursInYear;

    // Convert to current view's time unit
    const timeUnitMultiplier =
      timeUnit === 'years' ? 1 :
        timeUnit === 'months' ? 12 :
          timeUnit === 'weeks' ? 52 : 365;

    return {
      pastInCurrentUnit: pastYears * timeUnitMultiplier,
      futureInCurrentUnit: futureYears * timeUnitMultiplier,
      totalInCurrentUnit: (pastYears + futureYears) * timeUnitMultiplier
    };
  }, [birthDate, lifespan, timeUnit]);

  const getTimeUnitSuffix = (value) => {
    switch (timeUnit) {
      case 'years':
        return value === 1 ? 'year' : 'years';
      case 'months':
        return value === 1 ? 'month' : 'months';
      case 'weeks':
        return value === 1 ? 'week' : 'weeks';
      default:
        return timeUnit;
    }
  };

  const getProgressStats = useCallback(() => {
    const now = new Date();
    const birthDateObj = new Date(birthDate);
    const totalDays = lifespan * 365;
    const daysLived = Math.floor((now - birthDateObj) / (1000 * 60 * 60 * 24));
    const daysRemaining = totalDays - daysLived;

    // Calculate future committed time
    let futureCommittedDays = 0;
    activities.forEach(activity => {
      if (activity.future) {
        const hoursPerDay = activity.hours / (
          activity.timeUnit === 'day' ? 1 :
          activity.timeUnit === 'week' ? 7 :
          activity.timeUnit === 'month' ? 30 : 365
        );
        
        // Convert hours per day to total days for the remaining lifespan
        const daysPerYear = (hoursPerDay * 365) / 24;
        const yearsRemaining = (totalDays - daysLived) / 365;
        futureCommittedDays += daysPerYear * yearsRemaining;
      }
    });

    // Adjust remaining days by subtracting future committed time
    const adjustedDaysRemaining = Math.max(0, daysRemaining - futureCommittedDays);

    const percentageLived = (daysLived / totalDays) * 100;
    const percentageFuture = (futureCommittedDays / totalDays) * 100;
    const percentageRemaining = (adjustedDaysRemaining / totalDays) * 100;

    let lived, remaining, futureCommitted;
    if (timeUnit === 'years') {
      lived = daysLived / 365;
      remaining = adjustedDaysRemaining / 365;
      futureCommitted = futureCommittedDays / 365;
    } else if (timeUnit === 'months') {
      lived = (daysLived / 365) * 12;
      remaining = (adjustedDaysRemaining / 365) * 12;
      futureCommitted = (futureCommittedDays / 365) * 12;
    } else {
      lived = daysLived / 7;
      remaining = adjustedDaysRemaining / 7;
      futureCommitted = futureCommittedDays / 7;
    }

    return {
      percentageLived,
      percentageRemaining,
      percentageFuture,
      lived,
      remaining,
      futureCommitted,
      total: lived + remaining + futureCommitted
    };
  }, [birthDate, lifespan, activities, timeUnit]);

  const renderGrid = () => {
    return (
      <div className="text-sm text-gray-600 mt-2">
      </div>
    );
  };

  // Single effect to update progress when dependencies change
  useEffect(() => {
    const newProgress = calculateProgress();
    if (JSON.stringify(newProgress) !== JSON.stringify(progress)) {
      setProgress(newProgress);
    }
  }, [calculateProgress, birthDate, lifespan, timeUnit, activities]);

  // Create grid effect
  useEffect(() => {
    const svg = d3.select(svgRef.current);
    if (!svg) return;

    // Calculate activities panel dimensions
    const baseActivityPanelWidth = 240;
    const widthIncrease = baseActivityPanelWidth * 0.05;
    const activityPanelWidth = baseActivityPanelWidth + widthIncrease;
    const activityPanelRightMargin = 40;
    const activitiesX = windowWidth - activityPanelWidth - widthIncrease + 20;
    const activitiesY = 20;

    // Create the grid
    const gridLeftOffset = Math.max(0, (windowWidth * 0.99 - ((activityPanelWidth + activityPanelRightMargin))) / 2);
    const visibleAnnotations = annotations.filter(
      annotation => !annotation.showInView || annotation.showInView === timeUnit
    );
    const { gridGroup, gridWidth, gridHeight } = createLifeGrid({
      d3,
      svg,
      timeUnit,
      windowWidth,
      calculateTimeUnits,
      getActivityColorForCell,
      progress,
      currentShape,
      lifespan,
      gridLeftOffset,
      annotations: visibleAnnotations
    });

    // Set SVG height to accommodate both grid and activities
    const totalActivitiesHeight = activities.length * 140 + 120;
    const svgHeight = Math.max(gridHeight + 100, totalActivitiesHeight);
    svg.attr('height', svgHeight);

 
  }, [
    timeUnit,
    birthDate,
    windowWidth,
    calculateTimeUnits,
    getActivityColorForCell,
    progress,
    activities,
    currentShape,
    lifespan,
    handleAddActivity,
    createActivityRow,
    handleActivityColorChange,
    handleActivityNameChange,
    handleActivityHoursChange,
    handleActivityTimeUnitChange,
    handleActivitySpentChange,
    handleActivityFutureChange,
    calculateActivityPastFutureUnits,
    formatNumber,
    getTimeUnitSuffix,
    annotations
  ]);

  // Function to add a new annotation
  const addAnnotation = (newAnnotation) => {
    setAnnotations(prev => [...prev, newAnnotation]);
  };

  // Function to remove an annotation
  const removeAnnotation = (index) => {
    setAnnotations(prev => prev.filter((_, i) => i !== index));
  };

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const newWidth = window.innerWidth;
      setWindowWidth(newWidth);
      // Show message only when resizing from desktop to mobile
      if (newWidth < 640 && windowWidth >= 640) {
        setShowMobileMessage(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [windowWidth]);

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Mobile Message */}
      {showMobileMessage && windowWidth < 640 && (
        <div className="relative bg-blue-50 p-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-blue-700">
              This application is best viewed on a desktop screen for optimal experience.
            </p>
            <button
              onClick={() => setShowMobileMessage(false)}
              className="ml-4 inline-flex text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}
      
      {/* Top Controls Panel */}
      <div className="w-full p-2 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="w-full sm:w-[15%]"></div>
          <div className="flex flex-wrap justify-center items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900 w-32">Your Life</h1>
            <div className="flex items-center gap-2">
              <span>View in:</span>
              <select
                value={timeUnit}
                onChange={(e) => setTimeUnit(e.target.value)}
                className="border border-gray-300 rounded px-2 py-1"
              >
                <option value="years">Years</option>
                <option value="months">Months</option>
                <option value="weeks">Weeks</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span>as:</span>
              <button
                onClick={() => {
                  if (currentShape === 'square') setCurrentShape('circle');
                  else if (currentShape === 'circle') setCurrentShape('heart');
                  else if (currentShape === 'heart') setCurrentShape('diamond');
                  else if (currentShape === 'diamond') setCurrentShape('hexagon');
                  else setCurrentShape('square');
                }}
                className={`w-8 h-8 border rounded`}
              >
                <svg width="100%" height="100%" viewBox="-10 -10 20 20">
                  {currentShape === 'square' && <path d={shapes.square(0.5)} fill="#3B82F6" />}
                  {currentShape === 'circle' && <path d={shapes.circle(0.5)} fill="#3B82F6" />}
                  {currentShape === 'heart' && <path d={shapes.heart(0.5)} fill="#3B82F6" />}
                  {currentShape === 'diamond' && <path d={shapes.diamond(0.5)} fill="#3B82F6" />}
                  {currentShape === 'hexagon' && <path d={shapes.hexagon(0.5)} fill="#3B82F6" />}
                </svg>
              </button>
            </div>
          </div>
          <div className="w-full sm:w-[15%] flex justify-center sm:justify-end">
            <button
              onClick={handleShare}
              className="px-4 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
              </svg>
              Share
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col sm:flex-row">
        {/* Settings Panel */}
        <div className="w-full sm:w-[15%] p-4 border-b sm:border-b-0 sm:border-r border-gray-200 flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Set Date of Birth:</label>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Avg Life Span:</label>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="number"
                value={lifespan}
                onChange={handleLifespanChange}
                min="1"
                max="120"
                className="block w-20 border border-gray-300 rounded-md shadow-sm"
              />
              <span className="text-gray-500">years</span>
            </div>
          </div>

          <div className="h-px bg-gray-200 my-4"></div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Progress:</label>
            <div className="text-sm text-gray-600 mb-3">
              Total: {formatNumber(progress.total)} {getTimeUnitSuffix(progress.total)}
            </div>
            <ProgressBar
              stats={getProgressStats()}
              timeUnit={timeUnit}
              formatNumber={formatNumber}
            />
            <ProgressText
              stats={getProgressStats()}
              timeUnit={timeUnit}
              formatNumber={formatNumber}
            />
          </div>
        </div>

        {/* Grid Panel */}
        <div className="w-full sm:w-[70%] flex flex-col items-center justify-center">
          <div className="w-full h-full flex-1 overflow-auto px-4 sm:px-2 py-6">
            <div className="relative flex items-center justify-center h-full" style={{ margin: '10px 0' }}>
              <svg ref={svgRef} style={{
                width: '100%',
                height: '100%',
                minHeight: timeUnit === 'weeks' ? '1200px' : timeUnit === 'months' ? '1000px' : `${window.innerHeight - 90}px`,
                maxWidth: '1200px'
              }} className="w-full h-full" viewBox="0 0 1200 1200" preserveAspectRatio="xMinYMin meet"></svg>
            </div>
          </div>
        </div>

        {/* Activities Panel */}
        <div className="w-full sm:w-[15%] p-2 border-t sm:border-t-0 sm:border-l border-gray-200">
          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-gray-700">Activities</h2>
            <div className="flex flex-row sm:flex-col flex-wrap gap-4">
              {activities.map((activity) => (
                <div key={activity.id} className="flex flex-col gap-1 w-full sm:w-auto">
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <input
                        type="color"
                        value={activity.color}
                        onChange={(e) => handleActivityColorChange(activity.id, e.target.value)}
                        className="w-6 h-6 cursor-pointer opacity-0 absolute top-0 left-0 z-10"
                      />
                      <div 
                        className="w-6 h-6 rounded-md border border-gray-200"
                        style={{ 
                          backgroundColor: activity.color,
                        }}
                      />
                    </div>
                    <input
                      type="text"
                      value={activity.name}
                      onChange={(e) => handleActivityNameChange(activity.id, e.target.value)}
                      className="w-28 p-1 text-sm border rounded"
                      placeholder="Activity name"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="24"
                      step="0.5"
                      value={activity.hours}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        const rounded = Math.round(value * 2) / 2;
                        handleActivityHoursChange(activity.id, Math.min(24, Math.max(0, rounded)));
                      }}
                      className="w-14 text-sm border border-gray-300 rounded-l px-2 py-0.5"
                    />
                    <div className="flex items-center">
                      <span className="text-xs text-gray-600 bg-gray-50 px-1 py-0.5 border-y border-gray-300">hrs/</span>
                      <select
                        value={activity.timeUnit}
                        onChange={(e) => handleActivityTimeUnitChange(activity.id, e.target.value)}
                        className="text-sm border border-gray-300 rounded-r px-1 py-0.5"
                      >
                        <option value="day">day</option>
                        <option value="week">week</option>
                        <option value="month">month</option>
                        <option value="year">year</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 mt-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={activity.spent}
                        onChange={(e) => handleActivitySpentChange(activity.id, e.target.checked)}
                        className="rounded text-indigo-400 focus:ring-indigo-400"
                      />
                      <span className="text-sm text-indigo-400">Past</span>
                      <span className="text-sm text-gray-500">
                        ({formatNumber(calculateActivityPastFutureUnits(activity).pastInCurrentUnit)} {getTimeUnitSuffix(calculateActivityPastFutureUnits(activity).pastInCurrentUnit)})
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={activity.future}
                        onChange={(e) => handleActivityFutureChange(activity.id, e.target.checked)}
                        className="rounded text-orange-400 focus:ring-orange-400"
                      />
                      <span className="text-sm text-orange-400">Future</span>
                      <span className="text-sm text-gray-500">
                        ({formatNumber(calculateActivityPastFutureUnits(activity).futureInCurrentUnit)} {getTimeUnitSuffix(calculateActivityPastFutureUnits(activity).futureInCurrentUnit)})
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 gap-4">
              <button
                onClick={clearActivities}
                className="flex-1 py-1.0 text-sm text-white bg-blue-500 hover:bg-blue-600 transition-colors rounded-full"
              >
                Clear All
              </button>
              <button
                onClick={handleAddActivity}
                className="flex-1 py-1.0 text-sm text-white bg-blue-500 hover:bg-blue-600 transition-colors rounded-full"
              >
                Add Activity
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LifeGrid;
