import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import * as htmlToImage from 'html-to-image';
import { useLifeGridCalculations } from '../hooks/useLifeGridCalculations';

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

  const shapes = {
    heart: (scale) => `
      M ${0 * scale},${7 * scale}
      C ${0 * scale},${5 * scale} ${-1 * scale},${2 * scale} ${-4 * scale},${2 * scale}
      C ${-8 * scale},${2 * scale} ${-10 * scale},${5 * scale} ${-10 * scale},${8 * scale}
      C ${-10 * scale},${12 * scale} ${-6 * scale},${15 * scale} ${0 * scale},${20 * scale}
      C ${6 * scale},${15 * scale} ${10 * scale},${12 * scale} ${10 * scale},${8 * scale}
      C ${10 * scale},${5 * scale} ${8 * scale},${2 * scale} ${4 * scale},${2 * scale}
      C ${1 * scale},${2 * scale} ${0 * scale},${5 * scale} ${0 * scale},${7 * scale}
      Z`,
    sun: (scale) => `
      M ${0 * scale},${10 * scale}
      m ${-6 * scale},${0 * scale}
      a ${6 * scale},${6 * scale} 0 1,1 ${12 * scale},${0}
      a ${6 * scale},${6 * scale} 0 1,1 ${-12 * scale},${0}
      M ${0 * scale},${0 * scale}
      L ${0 * scale},${4 * scale}
      M ${0 * scale},${16 * scale}
      L ${0 * scale},${20 * scale}
      M ${-8.5 * scale},${10 * scale}
      L ${-12.5 * scale},${10 * scale}
      M ${8.5 * scale},${10 * scale}
      L ${12.5 * scale},${10 * scale}
      M ${-6 * scale},${4 * scale}
      L ${-9 * scale},${1 * scale}
      M ${6 * scale},${4 * scale}
      L ${9 * scale},${1 * scale}
      M ${-6 * scale},${16 * scale}
      L ${-9 * scale},${19 * scale}
      M ${6 * scale},${16 * scale}
      L ${9 * scale},${19 * scale}
      Z`,
    person: (scale) => `
      M ${0 * scale},${0 * scale}
      m ${-5 * scale},${0 * scale}
      a ${5 * scale},${5 * scale} 0 1,1 ${10 * scale},${0}
      a ${5 * scale},${5 * scale} 0 1,1 ${-10 * scale},${0}
      M ${-8 * scale},${12 * scale}
      A ${8 * scale},${8 * scale} 0 1,1 ${8 * scale},${12 * scale}`,
    square: (scale) => `
      M ${-10 * scale},${0 * scale}
      L ${10 * scale},${0 * scale}
      L ${10 * scale},${20 * scale}
      L ${-10 * scale},${20 * scale}
      Z`,
    circle: (scale) => `
      M ${0 * scale},${0 * scale}
      m ${-10 * scale},${10 * scale}
      a ${10 * scale},${10 * scale} 0 1,0 ${20 * scale},${0}
      a ${10 * scale},${10 * scale} 0 1,0 ${-20 * scale},${0}
      Z`
  };

  const cycleShape = () => {
    const shapeOrder = ['heart', 'sun', 'person', 'square', 'circle'];
    const currentIndex = shapeOrder.indexOf(currentShape);
    const nextIndex = (currentIndex + 1) % shapeOrder.length;
    setCurrentShape(shapeOrder[nextIndex]);
  };

  const cycleTimeUnit = () => {
    const units = ['hours', 'days', 'weeks', 'months', 'years'];
    const currentIndex = units.indexOf(timeUnit);
    const nextIndex = (currentIndex + 1) % units.length;
    setTimeUnit(units[nextIndex]);
  };

  const calculateHoursPerDay = (hours, timeUnit) => {
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
  };

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
  }, []);

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

  const handleActivityTimeUnitChange = (activityId, timeUnit) => {
    setActivities(prevActivities =>
      prevActivities.map(activity =>
        activity.id === activityId
          ? { ...activity, timeUnit }
          : activity
      )
    );
  };

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
    const lifeExpectancy = new Date(birthDateObj);
    lifeExpectancy.setFullYear(birthDateObj.getFullYear() + lifespan);

    // Calculate total years lived and remaining
    const yearsSinceBirth = (now - birthDateObj) / (1000 * 60 * 60 * 24 * 365.25);
    const yearsRemaining = (lifeExpectancy - now) / (1000 * 60 * 60 * 24 * 365.25);
    const totalLifeYears = yearsSinceBirth + yearsRemaining;

    // Calculate future committed time from activities
    let totalFutureYears = 0;
    activities.forEach(activity => {
      if (activity.future) {
        const { futureInCurrentUnit } = calculateActivityPastFutureUnits(activity);
        if (timeUnit === 'years') {
          totalFutureYears += futureInCurrentUnit;
        } else if (timeUnit === 'months') {
          totalFutureYears += futureInCurrentUnit / 12;
        } else if (timeUnit === 'weeks') {
          totalFutureYears += futureInCurrentUnit / 52;
        }
      }
    });

    // Convert to current time unit
    const timeUnitMultiplier = 
      timeUnit === 'years' ? 1 :
      timeUnit === 'months' ? 12 :
      timeUnit === 'weeks' ? 52 : 365;

    const livedInUnits = yearsSinceBirth * timeUnitMultiplier;
    const futureInUnits = totalFutureYears * timeUnitMultiplier;
    const totalInUnits = totalLifeYears * timeUnitMultiplier;
    const remainingInUnits = Math.max(0, totalInUnits - livedInUnits - futureInUnits);

    // Calculate percentages
    const percentageLived = (yearsSinceBirth / totalLifeYears) * 100;
    const percentageFuture = (totalFutureYears / totalLifeYears) * 100;
    const percentageRemaining = Math.max(0, 100 - percentageLived - percentageFuture);

    return {
      lived: livedInUnits,
      remaining: remainingInUnits,
      total: totalInUnits,
      futureCommitted: futureInUnits,
      percentageLived,
      percentageFuture,
      percentageRemaining
    };
  }, [birthDate, lifespan, activities, timeUnit]);

  const renderProgressBar = () => {
    const { percentageLived, percentageFuture, percentageRemaining, lived, remaining } = getProgressStats();
    
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
        <div className="flex flex-col gap-1.5 text-sm text-gray-600">
          <span>
            {timeUnit === 'years' 
              ? `${formatNumber(lived)} years lived`
              : timeUnit === 'months'
              ? `${formatNumber(lived)} months lived`
              : `${formatNumber(lived)} weeks lived`}
          </span>
          <span>
            {timeUnit === 'years'
              ? `${formatNumber(remaining)} years remain`
              : timeUnit === 'months'
              ? `${formatNumber(remaining)} months remain`
              : `${formatNumber(remaining)} weeks remain`}
          </span>
        </div>
      </div>
    );
  };

  const renderProgressText = () => {
    const { lived, remaining } = getProgressStats();
    const unitLabel = timeUnit.slice(0, -1); // Remove 's' from end
    
    return (
      <div className="flex gap-4 text-sm text-gray-600">
        <span>{Math.floor(lived)} {unitLabel}s lived</span>
        <span>{Math.floor(remaining)} {unitLabel}s remaining</span>
      </div>
    );
  };

  useEffect(() => {
    setProgress(calculateProgress());
  }, [calculateProgress, birthDate, lifespan, timeUnit]);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    const { units, unitsPerRow, rows, cellSize, padding } = calculateTimeUnits();
    const gridWidth = (cellSize + padding) * unitsPerRow;
    
    svg.selectAll('*').remove();
    
    // Calculate left offset to center the grid
    const gridLeftOffset = Math.max(0, (windowWidth * 0.95 - gridWidth) / 2);

    // Create activities array first
    const activitiesArray = Array.isArray(activities) ? activities : [];

    // Define common layout variables
    const headerHeight = 60;  // Space for title and controls
    const activityHeight = 140;  // Height per activity
    const verticalPadding = 40;  // Padding between sections
    const buttonHeight = 50;  // Space for button and padding

    // Calculate activities panel position and dimensions
    const baseActivityPanelWidth = 240;
    const widthIncrease = baseActivityPanelWidth * 0.05; // 5% of original width
    const activityPanelWidth = baseActivityPanelWidth + widthIncrease;
    const activityPanelRightMargin = 40;
    const activitiesX = windowWidth - activityPanelWidth - widthIncrease + 20; // Move left by 5% of width
    const activitiesY = (cellSize + padding) * 0.5;
    const gridHeight = (cellSize + padding) * rows;
    const totalActivitiesHeight = activities.length * activityHeight + 120; // Increased padding for buttons

    // Set SVG dimensions to accommodate both grid and activities
    const svgHeight = Math.max(gridHeight + 100, totalActivitiesHeight); // Added padding for grid
    svg.attr('height', svgHeight);

    // Clear existing gradients
    svg.selectAll('defs').remove();
    const defs = svg.append('defs');

    // Create grid
    const gridGroup = svg.append('g')
      .attr('transform', `translate(${gridLeftOffset}, ${(cellSize + padding) * 0.5})`);

    // Create cells
    const cells = gridGroup.selectAll('.cell')
      .data(Array.from({ length: units }, (_, i) => i))
      .join('path')
      .attr('class', 'cell')
      .attr('transform', d => {
        const x = (d % unitsPerRow) * (cellSize + padding);
        const y = Math.floor(d / unitsPerRow) * (cellSize + padding);
        return `translate(${x + cellSize/2}, ${y + cellSize/2})`;
      })
      .attr('d', shapes[currentShape](1))
      .each(function(d) {
        const cell = d3.select(this);
        const isLived = d < progress.lived;
        const color = getActivityColorForCell(d, isLived);

        if (typeof color === 'object') {
          // Create unique gradient ID for this cell
          const gradientId = `gradient-${d}`;
          
          // Create linear gradient
          const gradient = defs.append('linearGradient')
            .attr('id', gradientId)
            .attr('x1', '0%')
            .attr('y1', '0%')
            .attr('x2', '100%')
            .attr('y2', '0%');
          
          if (color.type === 'multiGradient') {
            // Handle multiple color segments
            const defaultColor = color.defaultColor;
            
            // Add initial default color
            gradient.append('stop')
              .attr('offset', '0%')
              .attr('stop-color', defaultColor);
            
            // Add each color segment
            color.segments.forEach(segment => {
              // End previous segment with default color
              gradient.append('stop')
                .attr('offset', `${segment.start}%`)
                .attr('stop-color', defaultColor);
              
              // Start new segment with activity color
              gradient.append('stop')
                .attr('offset', `${segment.start}%`)
                .attr('stop-color', segment.color);
              
              // End segment with activity color
              gradient.append('stop')
                .attr('offset', `${segment.end}%`)
                .attr('stop-color', segment.color);
              
              // Start default color again
              gradient.append('stop')
                .attr('offset', `${segment.end}%`)
                .attr('stop-color', defaultColor);
            });
            
            // Add final default color
            gradient.append('stop')
              .attr('offset', '100%')
              .attr('stop-color', defaultColor);
          } else {
            // Single gradient
            gradient.append('stop')
              .attr('offset', '0%')
              .attr('stop-color', color.color);
            
            gradient.append('stop')
              .attr('offset', `${color.percentage}%`)
              .attr('stop-color', color.color);
            
            gradient.append('stop')
              .attr('offset', `${color.percentage}%`)
              .attr('stop-color', color.defaultColor);
            
            gradient.append('stop')
              .attr('offset', '100%')
              .attr('stop-color', color.defaultColor);
          }
          
          // Apply gradient to cell
          cell.attr('fill', `url(#${gradientId})`);
        } else {
          // Apply solid color
          cell.attr('fill', color);
        }
      })
      .attr('stroke', '#D1D5DB')
      .attr('stroke-width', 1)
      .attr('data-index', (d, i) => i)
      .on('mouseover', function(event, d) {
        const index = d3.select(this).attr('data-index');
        const cell = d3.select(this);
        
        cell.transition()
          .duration(200)
          .attr('transform', (d, i) => {
            const x = (index % unitsPerRow) * (cellSize + padding);
            const y = Math.floor(index / unitsPerRow) * (cellSize + padding);
            return `translate(${x + cellSize/2}, ${y + cellSize/2}) scale(1.2)`;
          });
        
        gridGroup.append('text')
          .attr('class', 'cell-number')
          .attr('x', (index % unitsPerRow) * (cellSize + padding) + cellSize/2)
          .attr('y', Math.floor(index / unitsPerRow) * (cellSize + padding) + cellSize/2)
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'middle')
          .style('font-size', '14px')
          .style('fill', 'white')
          .style('mix-blend-mode', 'difference')
          .style('text-shadow', '0 0 2px rgba(0,0,0,0.5)')
          .style('pointer-events', 'none')
          .text(Number(index) + 1);
      })
      .on('mouseout', function() {
        const index = d3.select(this).attr('data-index');
        d3.select(this)
          .transition()
          .duration(200)
          .attr('transform', (d, i) => {
            const x = (index % unitsPerRow) * (cellSize + padding);
            const y = Math.floor(index / unitsPerRow) * (cellSize + padding);
            return `translate(${x + cellSize/2}, ${y + cellSize/2})`;
          });
        
        gridGroup.selectAll('.cell-number').remove();
      });

    // Add annotations for years view
    if (timeUnit === 'years') {
      // Add arrowhead definitions
      defs.append('marker')
        .attr('id', 'arrowhead')
        .attr('markerWidth', 10)
        .attr('markerHeight', 7)
        .attr('refX', 10)
        .attr('refY', 3.5)
        .attr('orient', 'auto')
        .append('polygon')
        .attr('points', '0 0, 10 3.5, 0 7')
        .attr('fill', '#3B82F6');

      defs.append('marker')
        .attr('id', 'arrowhead-purple')
        .attr('markerWidth', 10)
        .attr('markerHeight', 7)
        .attr('refX', 10)
        .attr('refY', 3.5)
        .attr('orient', 'auto')
        .append('polygon')
        .attr('points', '0 0, 10 3.5, 0 7')
        .attr('fill', '#8B5CF6');

      // Add "Each row is one decade" annotation with lines
      const rowWidth = unitsPerRow * (cellSize + padding);
      
      // Create a separate group for the decade annotation that's higher up
      const decadeAnnotation = svg.append('g')
        .attr('class', 'decade-annotation')
        .attr('transform', `translate(${gridLeftOffset}, ${-80})`);
      
      // Left line
      decadeAnnotation.append('line')
        .attr('x1', 0)
        .attr('y1', 0)
        .attr('x2', (rowWidth - 180) / 2)
        .attr('y2', 0)
        .attr('stroke', '#4B5563')
        .attr('stroke-width', 1);

      // Text
      decadeAnnotation.append('text')
        .attr('x', rowWidth / 2)
        .attr('y', 5)
        .style('font-size', '14px')
        .style('fill', '#4B5563')
        .style('text-anchor', 'middle')
        .style('font-weight', 'normal')
        .text('Each row is one decade');

      // Right line
      decadeAnnotation.append('line')
        .attr('x1', (rowWidth + 180) / 2)
        .attr('y1', 0)
        .attr('x2', rowWidth)
        .attr('y2', 0)
        .attr('stroke', '#4B5563')
        .attr('stroke-width', 1);

      // Add "Birth" annotation
      gridGroup.append('text')
        .attr('class', 'annotation')
        .attr('x', -80)
        .attr('y', cellSize)
        .style('font-size', '14px')
        .style('fill', '#3B82F6')
        .style('font-weight', 'bold')
        .text('Birth');

      // Add arrow from Birth to first cell's left side
      gridGroup.append('path')
        .attr('d', `M -40,${cellSize} L -5,${cellSize}`)
        .attr('stroke', '#3B82F6')
        .attr('stroke-width', 2)
        .attr('marker-end', 'url(#arrowhead)');

      // Calculate last cell position
      const lastCellX = ((units - 1) % unitsPerRow) * (cellSize + padding);
      const lastCellY = Math.floor((units - 1) / unitsPerRow) * (cellSize + padding);
      
      // Add "Turning X" annotation
      gridGroup.append('text')
        .attr('class', 'annotation')
        .attr('x', lastCellX + cellSize + 45)
        .attr('y', lastCellY + cellSize)
        .style('font-size', '14px')
        .style('fill', '#8B5CF6')
        .style('font-weight', 'bold')
        .text(`Turning ${lifespan}`);

      // Add arrow to last cell's right side
      gridGroup.append('path')
        .attr('d', `M ${lastCellX + cellSize + 40},${lastCellY + cellSize} L ${lastCellX + cellSize + 5},${lastCellY + cellSize}`)
        .attr('stroke', '#8B5CF6')
        .attr('stroke-width', 2)
        .attr('marker-end', 'url(#arrowhead-purple)');
    }

    // Create activities panel
    const activitiesPanel = svg.append('g')
      .attr('class', 'activities-panel')
      .attr('transform', `translate(${activitiesX}, ${activitiesY})`);

    // Add background for activities panel
    const panelBackground = activitiesPanel.append('rect')
      .attr('width', activityPanelWidth - activityPanelRightMargin - 24)
      .attr('height', activities.length * activityHeight + 80) 
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

    // Activities content container
    const activitiesContent = activitiesPanel.append('g')
      .attr('transform', `translate(12, 40)`);

    // Function to create activity rows
    const createActivityRow = (activity, index) => {
      const yOffset = index * activityHeight;
      const row = activitiesContent.append('g')
        .attr('transform', `translate(0, ${yOffset})`);

      // Activity name and color row
      const nameGroup = row.append('g');

      // Color picker
      const colorContainer = nameGroup.append('foreignObject')
        .attr('width', 20)
        .attr('height', 24);

      colorContainer.append('xhtml:input')
        .attr('type', 'color')
        .attr('value', activity.color)
        .style('width', '20px')
        .style('height', '20px')
        .style('padding', '0')
        .style('border', 'none')
        .style('cursor', 'pointer')
        .on('change', function() {
          handleActivityColorChange(activity.id, this.value);
        });

      // Activity name input
      const nameContainer = nameGroup.append('foreignObject')
        .attr('x', 30)
        .attr('width', 160)
        .attr('height', 24);

      nameContainer.append('xhtml:input')
        .attr('type', 'text')
        .attr('value', activity.name)
        .style('width', '100%')
        .style('font-size', '14px')
        .style('border', 'none')
        .style('background', 'transparent')
        .style('outline', 'none')
        .style('color', '#1F2937')
        .on('change', function() {
          handleActivityNameChange(activity.id, this.value);
        });

      // Hours input and unit selector on second row
      const configGroup = row.append('g')
        .attr('transform', 'translate(30, 32)');

      const hoursContainer = configGroup.append('foreignObject')
        .attr('width', 50)
        .attr('height', 24);

      hoursContainer.append('xhtml:input')
        .attr('type', 'number')
        .attr('min', '0')
        .attr('max', '24')
        .attr('step', '0.5')
        .attr('value', activity.hours)
        .style('width', '100%')
        .style('font-size', '13px')
        .style('border', '1px solid #D1D5DB')
        .style('border-radius', '4px')
        .style('padding', '2px 4px')
        .on('change', function() {
          const value = parseFloat(this.value) || 0;
          const rounded = Math.round(value * 2) / 2;
          handleActivityHoursChange(activity.id, Math.min(24, Math.max(0, rounded)));
        });

      // Add hrs/ label
      configGroup.append('text')
        .attr('x', 55)
        .attr('y', 16)
        .style('font-size', '13px')
        .style('fill', '#4B5563')
        .text('hrs/');

      const unitContainer = configGroup.append('foreignObject')
        .attr('x', 80)
        .attr('width', 70)
        .attr('height', 24);

      const unitSelect = unitContainer.append('xhtml:select')
        .style('width', '100%')
        .style('font-size', '13px')
        .style('border', '1px solid #D1D5DB')
        .style('border-radius', '4px')
        .style('padding', '2px 4px')
        .on('change', function() {
          handleActivityTimeUnitChange(activity.id, this.value);
        });

      ['day', 'week', 'month', 'year'].forEach(unit => {
        unitSelect.append('xhtml:option')
          .attr('value', unit)
          .property('selected', activity.timeUnit === unit)
          .text(unit);
      });

      // Past checkbox and value on third row
      const pastGroup = row.append('g')
        .attr('transform', 'translate(30, 64)');

      const pastContainer = pastGroup.append('foreignObject')
        .attr('width', 60)
        .attr('height', 16);

      const pastLabel = pastContainer.append('xhtml:label')
        .style('display', 'flex')
        .style('align-items', 'center')
        .style('gap', '4px')
        .style('font-size', '13px')
        .style('color', '#4B5563');

      pastLabel.append('xhtml:input')
        .attr('type', 'checkbox')
        .property('checked', activity.spent)
        .on('change', function() {
          handleActivitySpentChange(activity.id, this.checked);
        });

      pastLabel.append('xhtml:span')
        .text('Past');

      // Past hours with unit display (always show, checkbox only affects grid/progress)
      const { pastInCurrentUnit, futureInCurrentUnit, totalInCurrentUnit } = calculateActivityPastFutureUnits(activity);
      pastGroup.append('text')
        .attr('x', 80)
        .attr('y', 12)
        .style('font-size', '13px')
        .style('fill', activity.spent ? '#1F2937' : '#6B7280')
        .text(`${formatNumber(pastInCurrentUnit)} ${getTimeUnitSuffix(pastInCurrentUnit)}`);

      // Future checkbox and value on fourth row
      const futureGroup = row.append('g')
        .attr('transform', 'translate(30, 88)');

      const futureContainer = futureGroup.append('foreignObject')
        .attr('width', 60)
        .attr('height', 16);

      const futureLabel = futureContainer.append('xhtml:label')
        .style('display', 'flex')
        .style('align-items', 'center')
        .style('gap', '4px')
        .style('font-size', '13px')
        .style('color', '#4B5563');

      futureLabel.append('xhtml:input')
        .attr('type', 'checkbox')
        .property('checked', activity.future)
        .on('change', function() {
          handleActivityFutureChange(activity.id, this.checked);
        });

      futureLabel.append('xhtml:span')
        .text('Future');

      // Future hours with unit display (always show, checkbox only affects grid/progress)
      futureGroup.append('text')
        .attr('x', 80)
        .attr('y', 12)
        .style('font-size', '13px')
        .style('fill', activity.future ? '#1F2937' : '#6B7280')
        .text(`${formatNumber(futureInCurrentUnit)} ${getTimeUnitSuffix(futureInCurrentUnit)}`);

      // Total (always show)
      const totalGroup = row.append('g')
        .attr('transform', 'translate(30, 112)');

      totalGroup.append('text')
        .attr('y', 12)
        .style('font-size', '13px')
        .style('fill', '#1F2937')
        .text('Total:');

      totalGroup.append('text')
        .attr('x', 80)
        .attr('y', 12)
        .style('font-size', '13px')
        .style('fill', '#1F2937')
        .text(`${formatNumber(totalInCurrentUnit)} ${getTimeUnitSuffix(totalInCurrentUnit)}`);
    };

    // Create activity rows first
    activities.forEach((activity, index) => {
      createActivityRow(activity, index);
    });

    // Add buttons container at the bottom
    const buttonsContainer = activitiesPanel.append('foreignObject')
      .attr('x', 12)
      .attr('y', activities.length * activityHeight + 40)
      .attr('width', activityPanelWidth - activityPanelRightMargin - 24)
      .attr('height', 40);

    const buttonWrapper = buttonsContainer.append('xhtml:div')
      .style('display', 'flex')
      .style('gap', '4px')
      .style('width', '100%');

    // Clear button
    const clearButton = buttonWrapper.append('xhtml:button')
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
        d3.select(this)
          .style('background-color', '#F3F4F6');
      })
      .on('mouseout', function() {
        d3.select(this)
          .style('background-color', '#FFFFFF');
      })
      .on('click', () => {
        setActivities(activities.map(a => ({
          ...a,
          spent: false,
          future: false
        })));
      });

    // Add Activity button
    const addButton = buttonWrapper.append('xhtml:button')
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
        d3.select(this)
          .style('background-color', '#2563EB');
      })
      .on('mouseout', function() {
        d3.select(this)
          .style('background-color', '#3B82F6');
      })
      .on('click', () => {
        // Create new activity with default values
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
      });
  }, [
    timeUnit,
    birthDate,
    windowWidth,
    calculateTimeUnits,
    calculateAge,
    calculateActivityPastFutureUnits,
    calculateProgress,
    getActivityColorForCell,
    handleActivityChange,
    handleActivityColorChange,
    handleActivityHoursChange,
    handleActivityNameChange,
    handleAddActivity,
    handleRemoveActivity,
    shapes,
    currentShape
  ]);

  useEffect(() => {
    if (!svgRef.current) return;
    
    const svg = d3.select(svgRef.current);
    const cells = svg.selectAll('path.cell');
    
    // Get current cellSize from calculateTimeUnits
    const { cellSize } = calculateTimeUnits();
    
    cells.attr('d', () => {
      const scale = cellSize / 20;
      return shapes[currentShape](scale);
    });

    // Update shape selector icon
    svg.select('.shape-selector path')
      .attr('d', shapes[currentShape](1.2));
  }, [currentShape, shapes, calculateTimeUnits]);

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
              onClick={cycleShape}
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
                {renderProgressBar()}
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
