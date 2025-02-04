import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { useLifeGridCalculations } from '../hooks/useLifeGridCalculations';
import { shapes } from '../utils/gridShapes';
import { createLifeGrid } from '../utils/gridCreation';
import { createActivityRow } from '../utils/activityPanel';
import ProgressBar from './ProgressBar';
import ProgressText from './ProgressText';
import * as htmlToImage from 'html-to-image';

const LifeGrid = () => {
  const svgRef = useRef(null);
  const containerRef = useRef(null);

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [birthDate, setBirthDate] = useState('1978-01-01');
  const [timeUnit, setTimeUnit] = useState('years');
  const [lifespan, setLifespan] = useState(80);
  const [activities, setActivities] = useState([
    { id: 1, name: 'Sleeping', hours: 8, timeUnit: 'day', hoursPerDay: 8, color: '#000000', spent: false, future: false },
    { id: 2, name: 'Eating', hours: 2, timeUnit: 'day', hoursPerDay: 2, color: '#22C55E', spent: false, future: false },
    { id: 3, name: 'Personal Hygiene', hours: 2, timeUnit: 'day', hoursPerDay: 8, color: '#3B82F6', spent: false, future: false }
  ]);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [selectedPastHours, setSelectedPastHours] = useState(0);
  const [selectedFutureHours, setSelectedFutureHours] = useState(0);
  const [currentShape, setCurrentShape] = useState('square');  
  const [activityTimeUnit, setActivityTimeUnit] = useState('day');

  const calculateHoursPerDay = useCallback((hours, timeUnit) => {
    switch(timeUnit) {
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
    if (value > 130) {
      setLifespan(130);
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

    let futureDays = 0;
    activities.forEach(activity => {
      if (activity.future) {
        futureDays += activity.hours * (activity.timeUnit === 'years' ? 365 : activity.timeUnit === 'months' ? 30 : 7);
      }
    });

    const percentageLived = (daysLived / totalDays) * 100;
    const percentageRemaining = (daysRemaining / totalDays) * 100;
    const percentageFuture = (futureDays / totalDays) * 100;

    let lived, remaining;
    if (timeUnit === 'years') {
      lived = daysLived / 365;
      remaining = daysRemaining / 365;
    } else if (timeUnit === 'months') {
      lived = (daysLived / 365) * 12;
      remaining = (daysRemaining / 365) * 12;
    } else {
      lived = daysLived / 7;
      remaining = daysRemaining / 7;
    }

    return {
      percentageLived,
      percentageRemaining,
      percentageFuture,
      lived,
      remaining
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
    const gridLeftOffset = Math.max(0, (windowWidth * 0.95 - ((activityPanelWidth + activityPanelRightMargin) * 1.2)) / 2);
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
      gridLeftOffset
    });

    // Create activities panel
    const activitiesPanel = svg.append('g')
      .attr('class', 'activities-panel')
      .attr('transform', `translate(${activitiesX}, ${activitiesY})`);

    // Set SVG height to accommodate both grid and activities
    const totalActivitiesHeight = activities.length * 140 + 120;
    const svgHeight = Math.max(gridHeight + 100, totalActivitiesHeight);
    svg.attr('height', svgHeight);

    // Add activities panel background
    const panelBackground = activitiesPanel.append('rect')
      .attr('width', activityPanelWidth - activityPanelRightMargin - 24)
      .attr('height', activities.length * 140 + 80)
      .attr('fill', '#F3F4F6')
      .attr('rx', 8)
      .attr('ry', 8);

    // Add activities header
    activitiesPanel.append('text')
      .attr('x', 12)
      .attr('y', 25)
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .style('fill', '#1F2937')
      .text('Activities');

    // Create activities content
    const activitiesContent = activitiesPanel.append('g')
      .attr('transform', `translate(12, 40)`);

    // Create activity rows
    activities.forEach((activity, index) => {
      createActivityRow(activity, index, activitiesContent, {
        handleActivityColorChange,
        handleActivityNameChange,
        handleActivityHoursChange,
        handleActivityTimeUnitChange,
        handleActivitySpentChange,
        handleActivityFutureChange,
        calculateActivityPastFutureUnits,
        formatNumber,
        getTimeUnitSuffix
      });
    });

    // Add buttons container
    const buttonsContainer = activitiesPanel.append('foreignObject')
      .attr('x', 12)
      .attr('y', activities.length * 140 + 40)
      .attr('width', activityPanelWidth - activityPanelRightMargin - 24)
      .attr('height', 40);

    const buttonWrapper = buttonsContainer.append('xhtml:div')
      .style('display', 'flex')
      .style('gap', '4px')
      .style('width', '100%');

    // Clear button
    buttonWrapper.append('xhtml:button')
      .style('flex', '1')
      .style('padding', '2px 4px')
      .style('font-size', '14px')
      .style('border', '1px solid #E5E7EB')
      .style('border-radius', '3px')
      .style('background-color', '#FFFFFF')
      .style('color', '#374151')
      .style('cursor', 'pointer')
      .style('transition', 'all 150ms ease-in-out')
      .style('line-height', '1')
      .text('Clear All')
      .on('mouseover', function() {
        d3.select(this).style('background-color', '#F3F4F6');
      })
      .on('mouseout', function() {
        d3.select(this).style('background-color', '#FFFFFF');
      })
      .on('click', () => {
        setActivities(activities.map(a => ({
          ...a,
          spent: false,
          future: false
        })));
      });

    // Add Activity button
    buttonWrapper.append('xhtml:button')
      .style('flex', '1')
      .style('padding', '2px 4px')
      .style('font-size', '14px')
      .style('border', '1px solid #E5E7EB')
      .style('border-radius', '3px')
      .style('background-color', '#3B82F6')
      .style('color', '#FFFFFF')
      .style('cursor', 'pointer')
      .style('transition', 'all 150ms ease-in-out')
      .style('line-height', '1')
      .text('Add Activity')
      .on('mouseover', function() {
        d3.select(this).style('background-color', '#2563EB');
      })
      .on('mouseout', function() {
        d3.select(this).style('background-color', '#3B82F6');
      })
      .on('click', handleAddActivity);

  }, [
    timeUnit,
    birthDate,
    windowWidth,
    calculateTimeUnits,
    getActivityColorForCell,
    progress,
    activities,
    currentShape,
    shapes,
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
    getTimeUnitSuffix
  ]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div ref={containerRef} className="flex flex-col items-center">
      <div className="w-full px-4">
        {/* Top right share button */}
        <div className="absolute top-4 right-4">
          <button 
            className="flex items-center gap-1 px-3 py-1 border rounded-md text-gray-700 hover:bg-gray-50 group relative"
            onClick={handleShare}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
            </svg>
            Share
            <div className="invisible group-hover:visible absolute top-full mt-2 left-0 w-48 bg-gray-800 text-white text-xs rounded p-2 z-10">
              Share your life grid visualization with others
            </div>
          </button>
        </div>

        {/* Centered title and view controls */}
        <div className="flex justify-center items-center gap-6 mb-4">
          <h1 className="text-3xl font-bold text-gray-800">Your Life</h1>
          <div className="flex items-center gap-2 text-sm group relative">
            <label className="font-semibold">View in:</label>
            <select 
              onChange={handleTimeUnitChange} 
              value={timeUnit}
              className="p-1 border rounded-md shadow-sm text-sm"
            >
              
              <option value="days">Days</option>
              <option value="weeks">Weeks</option>
              <option value="months">Months</option>
              <option value="years">Years</option>
            </select>
            <div className="invisible group-hover:visible absolute top-full mt-2 left-0 w-48 bg-gray-800 text-white text-xs rounded p-2 z-10">
              Choose how to break down your life: hours, days, weeks, months, or years
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm group relative">
            <label className="font-semibold">as:</label>
            <div 
              onClick={() => setCurrentShape(shapes[(shapes.indexOf(currentShape) + 1) % shapes.length])}
              className="cursor-pointer p-1 border rounded-md shadow-sm hover:bg-gray-50"
              style={{ 
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                position: 'relative',
                top: '1px'
              }}
            >
              <svg width="20" height="20" viewBox="-12 -4 24 24">
                <path
                  d={shapes[currentShape](0.8)}
                  fill="#3B82F6"
                />
              </svg>
            </div>
            <div className="invisible group-hover:visible absolute top-full mt-2 left-0 w-48 bg-gray-800 text-white text-xs rounded p-2 z-10">
              Change the shape of grid cells (square, circle, or hexagon)
            </div>
          </div>
        </div>

        {/* Left side controls */}
        <div className="absolute left-4" style={{ top: '100px' }}>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1 text-sm group relative">
              <label className="font-semibold whitespace-nowrap">Set Date of Birth:</label>
              <div className="relative">
                <input
                  type="date"
                  value={birthDate}
                  onChange={handleBirthDateChange}
                  className="p-1 border rounded-md shadow-sm text-sm w-auto"
                />
                <div className="invisible group-hover:visible absolute top-full mt-2 left-0 w-48 bg-gray-800 text-white text-xs rounded p-2 z-10">
                  Enter your date of birth to calculate your life progress
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1 text-sm group relative">
              <label className="font-semibold whitespace-nowrap">Avg Life Span:</label>
              <div className="flex items-center gap-1 relative">
                <input
                  type="number"
                  min="1"
                  max="130"
                  value={lifespan}
                  onChange={handleLifespanChange}
                  className="p-1 border rounded-md shadow-sm text-sm w-16"
                />
                <span className="text-sm text-gray-600">years</span>
                <div className="invisible group-hover:visible absolute top-full mt-2 right-0 w-48 bg-gray-800 text-white text-xs rounded p-2 z-10">
                  Set your expected lifespan to visualize your entire life
                </div>
              </div>
              {/* Progress bar section */}
              <div className="flex flex-col gap-1 mt-2">
                <label className="text-sm font-semibold text-gray-700">Progress:</label>
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
          </div>
        </div>
        <div className="flex justify-center items-center mt-2"> {/* Reduced from mt-4 or higher */}
          <div className="w-full flex justify-center overflow-visible">
            <svg ref={svgRef} style={{ 
              minHeight: timeUnit === 'weeks' ? `${window.innerHeight - 90}px` : 'auto',
              maxHeight: timeUnit === 'weeks' ? 'none' : 'none',
              margin: '0px'
            }} className="w-full"></svg>
          </div>
        </div>
 
      </div>
    </div>
  );
};

export default LifeGrid;
