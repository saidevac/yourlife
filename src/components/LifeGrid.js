import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import * as htmlToImage from 'html-to-image';
import { useLifeGridCalculations } from '../hooks/useLifeGridCalculations';

const LifeGrid = () => {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [timeUnit, setTimeUnit] = useState('years');
  const [birthDate, setBirthDate] = useState('1978-01-01');
  const [lifespan, setLifespan] = useState(80);
  const [activities, setActivities] = useState([
    { id: 1, name: 'Sleeping', hours: 8, timeUnit: 'day', hoursPerDay: 8, color: '#000000', spent: false, future: false },
    { id: 2, name: 'Eating', hours: 2, timeUnit: 'day', hoursPerDay: 2, color: '#22C55E', spent: false, future: false },
    { id: 3, name: 'Personal Hygiene', hours: 1, timeUnit: 'day', hoursPerDay: 1, color: '#6366F1', spent: false, future: false }
  ]);

  const [currentShape, setCurrentShape] = useState('square');  

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
    calculateActivityPastFutureUnits,
    calculateProgress,
    getActivityColorForCell,
    calculateTimeUnits
  } = useLifeGridCalculations(
    birthDate,
    lifespan,
    timeUnit,
    activities,
    windowWidth
  );

  // Keep track of progress state
  const [progress, setProgress] = useState(calculateProgress());

  // Update progress when dependencies change
  useEffect(() => {
    setProgress(calculateProgress());
  }, [calculateProgress, activities, timeUnit, birthDate, lifespan]);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  const [activityTimeUnit, setActivityTimeUnit] = useState('day');

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

  const handleActivityHoursChange = (activityId, hours) => {
    setActivities(prevActivities =>
      prevActivities.map(activity =>
        activity.id === activityId
          ? { ...activity, hours, hoursPerDay: hours }
          : activity
      )
    );
  };

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
    setActivities(prevActivities => {
      const newActivity = {
        id: prevActivities.length + 1,
        name: 'New Activity',
        hours: 1,
        timeUnit: 'day',
        hoursPerDay: 1,
        color: getUniqueColor(),
        spent: false,
        future: false
      };
      return [...prevActivities, newActivity];
    });
  }, [getUniqueColor]);

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

  useEffect(() => {
    if (!svgRef.current) return;
    
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const { units, unitsPerRow, rows, cellSize, padding } = calculateTimeUnits();
    const gridWidth = (cellSize + padding) * unitsPerRow;
    
    // Calculate progress once at the start
    const progress = calculateProgress();
    
    // Calculate left offset to center the grid
    const gridLeftOffset = Math.max(0, (windowWidth * 0.95 - gridWidth) / 2);

    // Create a group for the grid
    const gridGroup = svg.append('g')
      .attr('transform', `translate(${gridLeftOffset}, ${(cellSize + padding) * 0.5})`);

    // Create activities array first
    const activitiesArray = Array.isArray(activities) ? activities : [];

    // Define common layout variables
    const headerHeight = 60;  // Space for title and controls
    const activityHeight = 100;  // Height per activity
    const verticalPadding = 40;  // Padding between sections
    const buttonHeight = 50;  // Space for button and padding

    // Calculate activities panel position and dimensions
    const activitiesX = windowWidth - 220; // 200px width + 20px margin
    const activitiesY = (cellSize + padding) * 0.5;
    const gridHeight = (cellSize + padding) * rows;
    const totalActivitiesHeight = (activitiesArray.length * 160) + 100; // Height for activities plus button and padding
    const activitiesPanelHeight = Math.max(gridHeight, totalActivitiesHeight);

    // Create cells within the grid group
    gridGroup.selectAll('path.cell')
      .data(Array(units).fill(0))
      .enter()
      .append('path')
      .attr('class', 'cell')
      .attr('transform', (d, i) => {
        const x = (i % unitsPerRow) * (cellSize + padding);
        const y = Math.floor(i / unitsPerRow) * (cellSize + padding);
        return `translate(${x + cellSize/2}, ${y + cellSize/2})`;
      })
      .attr('d', () => {
        const scale = cellSize / 20;
        return shapes[currentShape](scale);
      })
      .each(function(d, i) {
        const isLived = i < progress.lived;
        const color = getActivityColorForCell(i, isLived);
        
        if (typeof color === 'object' && color.type === 'gradient') {
          // Create unique gradient ID
          const gradientId = `gradient-${i}`;
          
          // Create linear gradient
          const gradient = gridGroup.append('linearGradient')
            .attr('id', gradientId)
            .attr('x1', '0%')
            .attr('y1', '0%')
            .attr('x2', '100%')
            .attr('y2', '0%');
          
          // Add initial stop with default color
          gradient.append('stop')
            .attr('offset', '0%')
            .attr('stop-color', color.defaultColor);
          
          // Add gradient stops for each activity portion
          color.stops.forEach(stop => {
            // Add start stop if not at 0%
            if (stop.startPercent > 0) {
              gradient.append('stop')
                .attr('offset', `${stop.startPercent}%`)
                .attr('stop-color', color.defaultColor);
            }
            
            // Add activity color stop
            gradient.append('stop')
              .attr('offset', `${stop.startPercent}%`)
              .attr('stop-color', stop.color);
            
            gradient.append('stop')
              .attr('offset', `${stop.endPercent}%`)
              .attr('stop-color', stop.color);
            
            // Add end stop if not at 100%
            if (stop.endPercent < 100) {
              gradient.append('stop')
                .attr('offset', `${stop.endPercent}%`)
                .attr('stop-color', color.defaultColor);
            }
          });
          
          // Apply gradient
          d3.select(this)
            .attr('fill', `url(#${gradientId})`)
            .attr('stroke', '#D1D5DB')
            .attr('stroke-width', 1);
        } else {
          // Apply solid color
          d3.select(this)
            .attr('fill', color)
            .attr('stroke', '#D1D5DB')
            .attr('stroke-width', 1);
        }
      })
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
          .style('font-size', `${Math.max(cellSize * 0.4, 10)}px`)
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

    // Add activities panel
    const activitiesPanel = svg.append('g')
      .attr('class', 'activities')
      .attr('transform', `translate(${activitiesX}, ${activitiesY})`);

    // Add background for activities
    activitiesPanel.append('rect')
      .attr('width', 200) // Fixed width to make it more compact
      .attr('height', activitiesPanelHeight)
      .attr('fill', '#F3F4F6')
      .attr('rx', 8)
      .attr('ry', 8);

    // Add content group for activities
    const activitiesContent = activitiesPanel.append('g')
      .attr('transform', 'translate(0, 20)');

    // Add "Activities" title
    activitiesContent.append('text')
      .style('font-size', '15px')
      .style('font-weight', '600')
      .style('fill', '#111827')
      .text('Activities');

    // Add activities list with more compact layout
    const activityList = activitiesContent.append('g')
      .attr('transform', 'translate(0, 25)'); // Reduced from 40

    // Function to create activity rows
    const createActivityRow = (activity, index) => {
      const yOffset = index * 160; // More space between activities
      const row = activityList.append('g')
        .attr('transform', `translate(0, ${yOffset})`);

      // Color picker (before activity name)
      const colorContainer = row.append('foreignObject')
        .attr('width', 24)
        .attr('height', 24);

      colorContainer.append('xhtml:input')
        .attr('type', 'color')
        .attr('value', activity.color)
        .style('width', '100%')
        .style('height', '100%')
        .style('padding', '0')
        .style('border', '1px solid #D1D5DB')
        .style('border-radius', '4px')
        .style('font-size', '13px')
        .on('change', function() {
          handleActivityColorChange(activity.id, this.value);
        });

      // Activity name and delete button
      const nameGroup = row.append('g')
        .attr('transform', 'translate(34, 0)');

      // Activity name input
      const nameContainer = nameGroup.append('foreignObject')
        .attr('width', 110) // Fixed width to prevent overflow
        .attr('height', 24)
        .attr('y', -4);

      const nameInput = nameContainer.append('xhtml:input')
        .attr('type', 'text')
        .attr('value', activity.name)
        .style('width', '100%')
        .style('height', '24px')
        .style('font-size', '14px')
        .style('font-weight', '500')
        .style('border', '1px solid transparent')
        .style('background', 'none')
        .style('padding', '2px 4px')
        .style('border-radius', '4px')
        .on('change', function() {
          handleActivityNameChange(activity.id, this.value);
        })
        .on('focus', function() {
          this.style.border = '1px solid #D1D5DB';
          this.style.background = 'white';
        })
        .on('blur', function() {
          this.style.border = '1px solid transparent';
          this.style.background = 'none';
        });

      // Delete button (X)
      nameGroup.append('text')
        .attr('x', 115) // Position after the fixed-width name input
        .attr('y', 16)
        .style('font-size', '16px')
        .style('fill', '#EF4444')
        .style('cursor', 'pointer')
        .text('×')
        .on('mouseover', function() {
          d3.select(this).style('font-weight', 'bold');
        })
        .on('mouseout', function() {
          d3.select(this).style('font-weight', 'normal');
        })
        .on('click', () => handleRemoveActivity(activity.id));

      // Hours input group
      const hoursGroup = row.append('g')
        .attr('transform', 'translate(0, 30)');

      // Hours input using foreignObject
      const hoursContainer = hoursGroup.append('foreignObject')
        .attr('width', 45)
        .attr('height', 24);

      hoursContainer.append('xhtml:input')
        .attr('type', 'number')
        .attr('min', '0')
        .attr('max', '24')
        .attr('step', '0.5')
        .attr('value', activity.hours)
        .style('width', '100%')
        .style('height', '100%')
        .style('padding', '2px')
        .style('border', '1px solid #D1D5DB')
        .style('border-radius', '4px')
        .style('font-size', '13px')
        .on('change', function() {
          handleActivityHoursChange(activity.id, +this.value);
        });

      // "Hours per" text
      hoursGroup.append('text')
        .attr('x', 50)
        .attr('y', 16)
        .style('font-size', '13px')
        .style('fill', '#4B5563')
        .text('hrs/');

      // Time unit select
      const selectContainer = hoursGroup.append('foreignObject')
        .attr('x', 75)
        .attr('width', 65)
        .attr('height', 24);

      const select = selectContainer.append('xhtml:select')
        .style('width', '100%')
        .style('height', '100%')
        .style('padding', '2px')
        .style('border', '1px solid #D1D5DB')
        .style('border-radius', '4px')
        .style('background-color', 'white')
        .style('font-size', '13px')
        .on('change', function() {
          handleActivityTimeUnitChange(activity.id, this.value);
        });

      ['day', 'week', 'month', 'year'].forEach(unit => {
        select.append('xhtml:option')
          .attr('value', unit)
          .property('selected', unit === activity.timeUnit)
          .text(unit);
      });

      // Common style for labels
      const createLabel = (container, text) => {
        const label = container.append('xhtml:label')
          .style('display', 'flex')
          .style('alignItems', 'center')
          .style('gap', '4px');

        label.append('xhtml:input')
          .attr('type', 'checkbox')
          .style('width', '14px')
          .style('height', '14px');

        label.append('xhtml:span')
          .style('font-size', '13px')
          .style('color', '#4B5563')
          .text(text);

        return label;
      };

      // Function to get proper unit display
      const getUnitDisplay = (unit) => {
        switch (unit) {
          case 'day': return 'days';
          case 'week': return 'weeks';
          case 'month': return 'months';
          case 'year': return 'years';
          default: return unit;
        }
      };

      // Past section
      const pastGroup = row.append('g')
        .attr('transform', 'translate(0, 65)');

      // Past checkbox and label
      const pastContainer = pastGroup.append('foreignObject')
        .attr('width', 80)
        .attr('height', 24);

      const pastLabel = createLabel(pastContainer, 'Past')
        .select('input')
        .property('checked', activity.spent)
        .on('change', function() {
          handleActivitySpentChange(activity.id, this.checked);
        });

      // Past time value (always shown)
      const { past } = calculateActivityPastFutureUnits(activity);
      pastGroup.append('text')
        .attr('x', 70)
        .attr('y', 16)
        .style('font-size', '11px')  // Reduced from 13px
        .style('fill', activity.spent ? '#000' : '#6B7280')
        .text(`${past.toFixed(1)} ${getUnitDisplay(timeUnit)}`);

      // Future section
      const futureGroup = row.append('g')
        .attr('transform', 'translate(0, 90)');

      // Future checkbox and label
      const futureContainer = futureGroup.append('foreignObject')
        .attr('width', 80)
        .attr('height', 24);

      const futureLabel = createLabel(futureContainer, 'Future')
        .select('input')
        .property('checked', activity.future)
        .on('change', function() {
          handleActivityFutureChange(activity.id, this.checked);
        });

      // Future time value (always shown)
      const { future } = calculateActivityPastFutureUnits(activity);
      futureGroup.append('text')
        .attr('x', 70)
        .attr('y', 16)
        .style('font-size', '11px')  // Reduced from 13px
        .style('fill', activity.future ? '#000' : '#6B7280')
        .text(`${future.toFixed(1)} ${getUnitDisplay(timeUnit)}`);

      // Total section
      const totalGroup = row.append('g')
        .attr('transform', 'translate(0, 115)');

      totalGroup.append('text')
        .attr('x', 0)
        .attr('y', 16)
        .style('font-size', '13px')
        .style('fill', '#4B5563')
        .text('Total:');

      // Calculate and display total
      const total = past + future;  // Always show total regardless of selection
      totalGroup.append('text')
        .attr('x', 70)
        .attr('y', 16)
        .style('font-size', '11px')  // Reduced from 13px
        .style('fill', '#000')
        .text(`${total.toFixed(1)} ${getUnitDisplay(timeUnit)}`);
    };

    // Create rows for each activity
    activitiesArray.forEach((activity, index) => {
      createActivityRow(activity, index);
    });

    // Add new activity button at the bottom using foreignObject
    const buttonContainer = activitiesContent.append('foreignObject')
      .attr('y', activitiesArray.length * 160 + 60)
      .attr('width', 120)
      .attr('height', 32);

    buttonContainer.append('xhtml:button')
      .text('+ Add Activity')
      .style('width', '100%')
      .style('height', '100%')
      .style('background-color', '#3B82F6')
      .style('color', 'white')
      .style('border', 'none')
      .style('border-radius', '6px')
      .style('font-size', '14px')
      .style('cursor', 'pointer')
      .on('mouseover', function() {
        this.style.backgroundColor = '#2563EB';
      })
      .on('mouseout', function() {
        this.style.backgroundColor = '#3B82F6';
      })
      .on('click', handleAddActivity);

    // Update SVG height to accommodate grid and activities
    svg.attr('width', windowWidth * 0.95)
      .attr('height', Math.max(
        gridHeight + (cellSize + padding) * 2, 
        activitiesY + activitiesPanelHeight + buttonHeight + verticalPadding
      ));
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
    handleRemoveActivity,  // Add handleRemoveActivity to dependencies
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
              <option value="hours">Hours</option>
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
                <div className="w-full h-1.5 bg-gray-200 rounded-full relative">
                  <div 
                    className="h-1.5 rounded-full absolute"
                    style={{ 
                      width: `${(calculateAge() / lifespan) * 100}%`,
                      maxWidth: '100%',
                      background: '#818CF8'
                    }}
                  />
                  {/* Future activities reduce remaining space */}
                  {activities.some(a => a.future) && (
                    <div 
                      className="h-1.5 rounded-full absolute right-0"
                      style={{ 
                        width: `${activities
                          .filter(a => a.future)
                          .reduce((total, activity) => {
                            const { future } = calculateActivityPastFutureUnits(activity);
                            return total + (future / lifespan) * 100;
                          }, 0)}%`,
                        background: '#E5E7EB'
                      }}
                    />
                  )}
                </div>
                <div className="flex justify-between text-[10px] text-gray-500">
                  <span>{((calculateAge() / lifespan) * 100).toFixed(1)}% lived</span>
                  <span>{(100 - (calculateAge() / lifespan) * 100 - activities
                    .filter(a => a.future)
                    .reduce((total, activity) => {
                      const { future } = calculateActivityPastFutureUnits(activity);
                      return total + (future / lifespan) * 100;
                    }, 0)).toFixed(1)}% remain</span>
                </div>
                <div className="flex flex-col text-[10px] text-gray-500">
                  <span>
                    {timeUnit === 'years' 
                      ? `${calculateAge().toFixed(1)} years lived`
                      : timeUnit === 'months'
                      ? `${(calculateAge() * 12).toFixed(0)} months lived`
                      : `${(calculateAge() * 52).toFixed(0)} weeks lived`
                    }
                  </span>
                  <span>
                    {(() => {
                      const futureTime = activities
                        .filter(a => a.future)
                        .reduce((total, activity) => {
                          const { future } = calculateActivityPastFutureUnits(activity);
                          return total + future;
                        }, 0);
                      const remaining = lifespan - calculateAge() - futureTime;
                      
                      return timeUnit === 'years'
                        ? `${remaining.toFixed(1)} years remain`
                        : timeUnit === 'months'
                        ? `${(remaining * 12).toFixed(0)} months remain`
                        : `${(remaining * 52).toFixed(0)} weeks remain`;
                    })()}
                  </span>
                </div>
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
