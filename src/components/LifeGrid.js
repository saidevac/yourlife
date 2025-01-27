import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';

const LifeGrid = () => {
  const svgRef = useRef(null);
  const [timeUnit, setTimeUnit] = useState('weeks');
  const [birthDate, setBirthDate] = useState('1978-01-01');
  const [lifespan, setLifespan] = useState(80);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [activities, setActivities] = useState([
    { id: 1, name: 'Sleeping', hoursPerDay: 8, color: '#000000', spent: false, future: false },
    { id: 2, name: 'Eating', hoursPerDay: 2, color: '#22C55E', spent: false, future: false }
  ]);

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
    const value = parseInt(event.target.value);
    if (value > 0) {
      setLifespan(value);
    }
  }, []);

  const handleActivityChange = useCallback((id, field, value) => {
    setActivities(activities.map(activity => {
      if (activity.id === id) {
        return { ...activity, [field]: value };
      }
      return activity;
    }));
  }, [activities]);

  const handleActivityHoursChange = useCallback((id, newHours) => {
    const hours = Math.min(24, Math.max(0, parseFloat(newHours) || 0));
    setActivities(activities.map(activity => {
      if (activity.id === id) {
        return { ...activity, hoursPerDay: hours };
      }
      return activity;
    }));
  }, [activities]);

  const handleActivityNameChange = useCallback((id, name) => {
    setActivities(activities.map(activity => {
      if (activity.id === id) {
        return { ...activity, name };
      }
      return activity;
    }));
  }, [activities]);

  const handleActivityColorChange = useCallback((id, color) => {
    setActivities(activities.map(activity => {
      if (activity.id === id) {
        return { ...activity, color };
      }
      return activity;
    }));
  }, [activities]);

  const getUniqueColor = useCallback(() => {
    const colors = [
      '#EF4444', '#F59E0B', '#10B981', '#6366F1', '#EC4899', 
      '#8B5CF6', '#14B8A6', '#F97316', '#06B6D4', '#8B5CF6'
    ];
    const usedColors = activities.map(a => a.color);
    const availableColors = colors.filter(color => !usedColors.includes(color));
    return availableColors.length > 0 ? availableColors[0] : colors[Math.floor(Math.random() * colors.length)];
  }, [activities]);

  const handleAddActivity = useCallback(() => {
    const newActivity = {
      id: activities.length + 1,
      name: 'New Activity',
      hoursPerDay: 1,
      color: getUniqueColor(),
      spent: false,
      future: false
    };
    setActivities([...activities, newActivity]);
  }, [activities, getUniqueColor]);

  const handleRemoveActivity = useCallback((id) => {
    setActivities(activities.filter(activity => activity.id !== id));
  }, [activities]);

  const calculateUnits = useCallback(() => {
    switch (timeUnit) {
      case 'hours':
        return 24 * 365 * lifespan;
      case 'days':
        return 365 * lifespan;
      case 'weeks':
        return 52 * lifespan;
      case 'months':
        return 12 * lifespan;
      case 'years':
        return lifespan;
      default:
        return 52 * lifespan;
    }
  }, [timeUnit, lifespan]);

  const calculateTimeUnits = useCallback(() => {
    const svgWidth = windowWidth * 0.95;
    const padding = 2;
    const minCellSize = 15;
    const maxCellSize = 25;
    
    let units = calculateUnits();
    let unitsPerRow = Math.floor(Math.sqrt(units) * 1.5);
    let cellSize = Math.max(minCellSize, Math.min(maxCellSize, Math.floor((svgWidth - padding * (unitsPerRow + 1)) / unitsPerRow)));
    let rows = Math.ceil(units / unitsPerRow);
    
    return { units, unitsPerRow, rows, cellSize, padding };
  }, [windowWidth, calculateUnits]);

  const calculateAge = useCallback(() => {
    const today = new Date();
    const birth = new Date(birthDate);
    const diffTime = today - birth;
    
    switch (timeUnit) {
      case 'hours':
        return Math.floor(diffTime / (1000 * 60 * 60));
      case 'days':
        return Math.floor(diffTime / (1000 * 60 * 60 * 24));
      case 'weeks':
        return Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
      case 'months':
        return Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30.44)); // Average month length
      case 'years':
        return Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365.25)); // Account for leap years
      default:
        return 0;
    }
  }, [birthDate, timeUnit]);

  const calculateProgress = useCallback(() => {
    const { units } = calculateTimeUnits();
    const lived = calculateAge();
    
    return {
      total: units,
      lived,
      remaining: Math.max(0, units - lived),
      progress: ((lived / units) * 100).toFixed(1)
    };
  }, [calculateTimeUnits, calculateAge]);

  const calculateActivityUnits = useCallback((activity) => {
    const hoursPerDay = activity.hoursPerDay;
    const totalDays = lifespan * 365;
    
    switch (timeUnit) {
      case 'hours':
        return Math.floor(hoursPerDay * totalDays);
      case 'days':
        return Math.floor((hoursPerDay / 24) * totalDays);
      case 'weeks':
        return Math.floor((hoursPerDay / 24) * totalDays / 7);
      case 'months':
        return Math.floor((hoursPerDay / 24) * totalDays / 30.44); // Average month length
      case 'years':
        return Math.floor((hoursPerDay / 24) * totalDays / 365.25); // Account for leap years
      default:
        return 0;
    }
  }, [timeUnit, lifespan]);

  const calculateActivityPastFutureUnits = useCallback((activity) => {
    const totalUnits = calculateActivityUnits(activity);
    const progress = calculateProgress();
    const unitsPerDay = activity.hoursPerDay / 24;
    
    // Calculate lived and remaining units based on progress
    const livedDays = Math.floor(progress.lived * unitsPerDay);
    const remainingDays = Math.floor((progress.total - progress.lived) * unitsPerDay);
    
    return {
      past: livedDays,
      future: remainingDays,
      total: totalUnits
    };
  }, [calculateActivityUnits, calculateProgress]);

  const getActivityColorForCell = useCallback((cellIndex, isLived) => {
    const progress = calculateProgress();
    
    // Calculate how many cells should be colored for each activity
    for (const activity of activities) {
      if ((isLived && activity.spent) || (!isLived && activity.future)) {
        const hoursPerDay = activity.hoursPerDay;
        const daysToConsider = isLived ? progress.lived : (progress.total - progress.lived);
        
        // Calculate cells based on time unit
        let cellsForActivity;
        const hoursForActivity = (hoursPerDay * daysToConsider);
        
        switch (timeUnit) {
          case 'hours':
            cellsForActivity = hoursForActivity;
            break;
          case 'days':
            cellsForActivity = hoursForActivity / 24;
            break;
          case 'weeks':
            cellsForActivity = hoursForActivity / (24 * 7);
            break;
          case 'months':
            cellsForActivity = hoursForActivity / (24 * 30.44);
            break;
          case 'years':
            cellsForActivity = hoursForActivity / (24 * 365.25);
            break;
          default:
            cellsForActivity = 0;
        }

        // Check if this cell should be colored
        if (cellIndex < Math.floor(cellsForActivity)) {
          return activity.color;
        }
      }
    }
    
    return isLived ? '#3B82F6' : '#E5E7EB';
  }, [activities, timeUnit, calculateProgress]);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const svgWidth = windowWidth * 0.95;
    const { units, unitsPerRow, rows, cellSize, padding } = calculateTimeUnits();
    const gridWidth = (cellSize + padding) * unitsPerRow;
    
    // Calculate left offset to center the grid
    const gridLeftOffset = Math.max(0, (svgWidth - gridWidth) / 2);

    // Create a group for the grid
    const gridGroup = svg.append('g')
      .attr('transform', `translate(${gridLeftOffset}, ${(cellSize + padding) * 3})`);

    // Create cells within the grid group
    gridGroup.selectAll('rect.cell')
      .data(Array(units).fill(0))
      .enter()
      .append('rect')
      .attr('class', 'cell')
      .attr('x', (d, i) => (i % unitsPerRow) * (cellSize + padding))
      .attr('y', (d, i) => Math.floor(i / unitsPerRow) * (cellSize + padding))
      .attr('width', cellSize)
      .attr('height', cellSize)
      .attr('rx', 2)
      .attr('ry', 2)
      .attr('fill', (d, i) => {
        const isLived = i < calculateProgress().lived;
        return getActivityColorForCell(i, isLived);
      })
      .attr('stroke', '#D1D5DB')
      .attr('stroke-width', 1)
      .attr('data-index', (d, i) => i)
      .on('mouseover', function(event, d) {
        const index = d3.select(this).attr('data-index');
        const cell = d3.select(this);
        const bbox = this.getBBox();
        const centerX = bbox.x + bbox.width/2;
        const centerY = bbox.y + bbox.height/2;
        
        cell.transition()
          .duration(200)
          .attr('transform', `translate(${centerX},${centerY}) scale(1.5) translate(${-centerX},${-centerY})`);
        
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
        d3.select(this)
          .transition()
          .duration(200)
          .attr('transform', 'scale(1)');
        
        gridGroup.selectAll('.cell-number').remove();
      });

    // Calculate stats panel position
    const statsY = (cellSize + padding) * rows + (cellSize + padding) * 4;
    const headerHeight = 40;
    const activityHeight = 65;
    const verticalPadding = 30;
    const statsHeight = headerHeight + (activities.length * activityHeight) + verticalPadding;

    // Add statistics panel using full width
    const stats = svg.append('g')
      .attr('class', 'stats')
      .attr('transform', `translate(20, ${statsY})`);

    // Add background for stats using full width
    stats.append('rect')
      .attr('width', svgWidth - 40)  // Full width minus margins
      .attr('height', statsHeight)
      .attr('fill', '#F3F4F6')
      .attr('rx', 8)
      .attr('ry', 8);

    // Add divider line in the middle
    const middleX = (svgWidth - 40) / 2;
    stats.append('line')
      .attr('x1', middleX)
      .attr('y1', 15)
      .attr('x2', middleX)
      .attr('y2', statsHeight - 15)
      .attr('stroke', '#E5E7EB')
      .attr('stroke-width', 2);

    // Add life statistics section
    const lifeStatsContent = stats.append('g')
      .attr('transform', 'translate(30, 25)');

    // Restore Life Statistics title
    lifeStatsContent.append('text')
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .text('Life Statistics');

    // Add life progress stats in two columns with more spacing
    const lifeStats = [
      { color: '#3B82F6', text: `${calculateProgress().lived} ${timeUnit} lived` },
      { color: '#E5E7EB', text: `${calculateProgress().remaining} ${timeUnit} remaining` }
    ];

    // Display stats in two columns with more spacing
    lifeStats.forEach((stat, i) => {
      const x = i % 2 === 0 ? 0 : middleX / 2;
      const y = Math.floor(i / 2) * 30 + 30; // Add 30px offset for title
      const statGroup = lifeStatsContent.append('g')
        .attr('transform', `translate(${x}, ${y})`);

      if (stat.color) {
        statGroup.append('rect')
          .attr('width', 12)
          .attr('height', 12)
          .attr('fill', stat.color)
          .attr('rx', 2);

        statGroup.append('text')
          .attr('x', 20)
          .attr('y', 10)
          .style('font-size', '14px')
          .text(stat.text);
      }
    });

    // Add progress bar
    const progress = calculateProgress();
    const progressBarWidth = middleX - 60; // Full width minus margins
    const progressBarHeight = 12;
    const progressBarY = 90; // Position below the stats

    // Progress bar group
    const progressGroup = lifeStatsContent.append('g')
      .attr('transform', `translate(0, ${progressBarY})`);

    // Progress bar background
    progressGroup.append('rect')
      .attr('width', progressBarWidth)
      .attr('height', progressBarHeight)
      .attr('fill', '#E5E7EB')
      .attr('rx', 6);

    // Progress bar fill
    progressGroup.append('rect')
      .attr('width', progressBarWidth * (progress.progress / 100))
      .attr('height', progressBarHeight)
      .attr('fill', '#3B82F6')
      .attr('rx', 6);

    // Progress text
    progressGroup.append('text')
      .attr('x', progressBarWidth / 2)
      .attr('y', -8)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .text(`${progress.total} ${timeUnit} total (${progress.progress}% complete)`);

    // Add activities section
    const activitiesSection = stats.append('g')
      .attr('transform', `translate(${middleX + 30}, 25)`);

    // Activities header with more spacing
    const header = activitiesSection.append('g');
    
    header.append('text')
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .text('Activities');

    // Add button with better positioning
    const addButton = header.append('g')
      .attr('transform', 'translate(100, -5)')
      .style('cursor', 'pointer')
      .on('click', handleAddActivity);

    addButton.append('rect')
      .attr('width', 24)
      .attr('height', 24)
      .attr('fill', '#3B82F6')
      .attr('rx', 6)
      .attr('ry', 6);

    addButton.append('text')
      .attr('x', 12)
      .attr('y', 17)
      .attr('text-anchor', 'middle')
      .style('font-size', '20px')
      .style('fill', 'white')
      .text('+');

    // Activity list with more horizontal space
    const activityList = activitiesSection.append('g')
      .attr('transform', 'translate(0, 40)');

    // Add activities with full width
    activities.forEach((activity, index) => {
      const activityGroup = activityList.append('g')
        .attr('transform', `translate(0, ${index * 65})`);

      // Activity row background using full width
      activityGroup.append('rect')
        .attr('width', (svgWidth - 40) / 2 - 60)  // Full half-width minus margins
        .attr('height', 60)
        .attr('fill', index % 2 === 0 ? '#FFFFFF' : '#F9FAFB')
        .attr('rx', 4)
        .attr('ry', 4);

      // Activity name and units in three lines with editable hours
      const nameGroup = activityGroup.append('g')
        .attr('transform', 'translate(30, 0)');

      // Activity name (editable for custom activities)
      const nameText = nameGroup.append('text')
        .attr('y', 20)
        .style('font-size', '14px')
        .style('font-weight', 'bold')
        .text(activity.name);

      if (activity.id > 2) {
        nameText
          .style('cursor', 'pointer')
          .on('click', function() {
            const newName = prompt('Enter activity name:', activity.name);
            if (newName !== null) {
              handleActivityNameChange(activity.id, newName);
            }
          });
      }

      // Color indicator (clickable for custom activities)
      const colorRect = activityGroup.append('rect')
        .attr('width', 12)
        .attr('height', 12)
        .attr('fill', activity.color)
        .attr('rx', 2)
        .attr('ry', 2)
        .attr('transform', 'translate(8, 14)');

      if (activity.id > 2) {
        colorRect
          .style('cursor', 'pointer')
          .on('click', function() {
            const colors = [
              '#EF4444', '#F59E0B', '#10B981', '#6366F1', '#EC4899', 
              '#8B5CF6', '#14B8A6', '#F97316', '#06B6D4', '#8B5CF6'
            ];
            const currentIndex = colors.indexOf(activity.color);
            const nextColor = colors[(currentIndex + 1) % colors.length];
            handleActivityColorChange(activity.id, nextColor);
          });

        // Add small indicator for clickable color
        activityGroup.append('circle')
          .attr('cx', 20)
          .attr('cy', 26)
          .attr('r', 2)
          .attr('fill', '#6B7280');
      }

      // Hours input
      const hoursGroup = nameGroup.append('g')
        .attr('transform', 'translate(0, 28)');

      hoursGroup.append('text')
        .attr('y', 12)
        .style('font-size', '12px')
        .text('Hours per day:');

      const hoursInput = hoursGroup.append('g')
        .attr('transform', 'translate(80, -4)');

      hoursInput.append('rect')
        .attr('width', 40)
        .attr('height', 20)
        .attr('fill', '#FFFFFF')
        .attr('stroke', '#D1D5DB')
        .attr('rx', 4)
        .attr('ry', 4);

      const hoursText = hoursInput.append('text')
        .attr('x', 20)
        .attr('y', 14)
        .attr('text-anchor', 'middle')
        .style('font-size', '12px')
        .text(activity.hoursPerDay);

      hoursInput
        .style('cursor', 'pointer')
        .on('click', function() {
          const newHours = prompt(`Enter hours per day for ${activity.name} (0-24):`, activity.hoursPerDay);
          if (newHours !== null) {
            handleActivityHoursChange(activity.id, newHours);
          }
        });

      // Total units under hours
      const pastUnits = calculateActivityPastFutureUnits(activity);
      hoursGroup.append('text')
        .attr('x', 0)
        .attr('y', 32)
        .style('font-size', '12px')
        .style('fill', '#6B7280')
        .text(`Total: ${pastUnits.total} ${timeUnit}`);

      // Past/Future toggles with units
      const toggleGroup = activityGroup.append('g')
        .attr('transform', `translate(${(svgWidth - 40) / 4 + 20}, 12)`);

      // Past toggle and units
      const spentToggle = toggleGroup.append('g')
        .style('cursor', 'pointer')
        .on('click', () => handleActivityChange(activity.id, 'spent', !activity.spent));

      spentToggle.append('rect')
        .attr('width', 16)
        .attr('height', 16)
        .attr('fill', activity.spent ? '#3B82F6' : '#E5E7EB')
        .attr('rx', 4)
        .attr('ry', 4);

      spentToggle.append('text')
        .attr('x', 24)
        .attr('y', 12)
        .style('font-size', '12px')
        .text('Past');

      spentToggle.append('text')
        .attr('x', 70)
        .attr('y', 12)
        .style('font-size', '12px')
        .text(`${pastUnits.past} ${timeUnit}`);

      // Future toggle and units
      const futureToggle = toggleGroup.append('g')
        .attr('transform', 'translate(0, 25)')
        .style('cursor', 'pointer')
        .on('click', () => handleActivityChange(activity.id, 'future', !activity.future));

      futureToggle.append('rect')
        .attr('width', 16)
        .attr('height', 16)
        .attr('fill', activity.future ? '#3B82F6' : '#E5E7EB')
        .attr('rx', 4)
        .attr('ry', 4);

      futureToggle.append('text')
        .attr('x', 24)
        .attr('y', 12)
        .style('font-size', '12px')
        .text('Future');

      futureToggle.append('text')
        .attr('x', 70)
        .attr('y', 12)
        .style('font-size', '12px')
        .text(`${pastUnits.future} ${timeUnit}`);

      // Delete button for non-default activities
      if (activity.id > 2) {
        const deleteButton = activityGroup.append('g')
          .attr('transform', `translate(${(svgWidth - 40) / 4 + 180}, 20)`)
          .style('cursor', 'pointer')
          .on('click', () => handleRemoveActivity(activity.id));

        deleteButton.append('rect')
          .attr('width', 16)
          .attr('height', 16)
          .attr('fill', '#EF4444')
          .attr('rx', 4)
          .attr('ry', 4);

        deleteButton.append('text')
          .attr('x', 8)
          .attr('y', 12)
          .attr('text-anchor', 'middle')
          .style('font-size', '12px')
          .style('fill', 'white')
          .text('×');
      }
    });

    // Update SVG height to accommodate everything
    svg.attr('width', svgWidth)
      .attr('height', statsY + statsHeight + (cellSize + padding) * 2);

  }, [
    timeUnit,
    birthDate,
    windowWidth,
    calculateTimeUnits,
    calculateAge,
    activities,
    calculateActivityUnits,
    calculateProgress,
    getActivityColorForCell,
    handleActivityChange,
    handleActivityColorChange,
    handleActivityHoursChange,
    handleActivityNameChange,
    handleAddActivity,
    handleRemoveActivity,
    calculateActivityPastFutureUnits
  ]);

  return (
    <div className="flex flex-col items-center">
      <div className="w-full px-4">
        <div className="flex flex-col sm:flex-row items-center justify-between w-full mb-0">
          <h1 className="text-3xl font-bold text-gray-800">Your Life</h1>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <div className="flex items-center gap-2 text-sm">
              <label className="font-semibold whitespace-nowrap">Date of Birth:</label>
              <input
                type="date"
                value={birthDate}
                onChange={handleBirthDateChange}
                className="p-1 border rounded-md shadow-sm text-sm w-auto"
              />
            </div>
            <div className="flex items-center gap-2 text-sm">
              <label className="font-semibold whitespace-nowrap">Avg Life Span:</label>
              <input
                type="number"
                min="1"
                value={lifespan}
                onChange={handleLifespanChange}
                className="p-1 border rounded-md shadow-sm text-sm w-20"
              />
              <span className="text-sm text-gray-600">years</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
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
            </div>
          </div>
        </div>
        <div className="flex justify-center items-center mt-0">
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
