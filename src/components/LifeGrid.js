import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { useLifeGridCalculations } from '../hooks/useLifeGridCalculations';

const LifeGrid = () => {
  const svgRef = useRef(null);
  const [timeUnit, setTimeUnit] = useState('years');
  const [birthDate, setBirthDate] = useState('1978-01-01');
  const [lifespan, setLifespan] = useState(80);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [activities, setActivities] = useState([
    { id: 1, name: 'Sleeping', hoursPerDay: 8, color: '#000000', spent: false, future: false },
    { id: 2, name: 'Eating', hoursPerDay: 2, color: '#22C55E', spent: false, future: false }
  ]);

  const { 
    calculateBaseProgress, 
    calculateProgress, 
    calculateAge, 
    calculateActivityPastFutureUnits, 
    calculateTimeUnits, 
    getActivityColorForCell 
  } = useLifeGridCalculations(
    birthDate,
    lifespan,
    activities,
    timeUnit,
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
    const value = parseInt(event.target.value);
    if (value > 0) {
      setLifespan(value);
    }
  }, []);

  const handleActivityChange = useCallback((id, field, value) => {
    setActivities(prevActivities => prevActivities.map(activity => {
      if (activity.id === id) {
        return { ...activity, [field]: value };
      }
      return activity;
    }));
  }, []);

  const handleActivityHoursChange = useCallback((id, newHours) => {
    const hours = Math.min(24, Math.max(0, parseFloat(newHours) || 0));
    setActivities(prevActivities => prevActivities.map(activity => {
      if (activity.id === id) {
        return { ...activity, hoursPerDay: hours };
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
        const isLived = i < progress.lived;
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
      { color: '#3B82F6', text: `${progress.lived} ${timeUnit} lived` },
      { color: '#E5E7EB', text: `${progress.remaining} ${timeUnit} remaining` }
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

    // Progress bar
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

    // Calculate total hours for past and future activities
    const pastActivities = activities.filter(a => a.spent);
    const futureActivities = activities.filter(a => a.future);
    const totalPastHours = pastActivities.reduce((sum, a) => sum + a.hoursPerDay, 0);
    const totalFutureHours = futureActivities.reduce((sum, a) => sum + a.hoursPerDay, 0);

    // Add blue progress bar for unallocated lived time
    if (totalPastHours < 24) {
      progressGroup.append('rect')
        .attr('width', progressBarWidth * (progress.progress / 100))
        .attr('height', progressBarHeight)
        .attr('fill', '#3B82F6')
        .attr('rx', 6);
    }
    
    // Function to create activity segment
    const createActivitySegment = (activity, start, end, isLived) => {
      const segmentWidth = (end - start) * progressBarWidth;
      if (segmentWidth > 0) {
        const segment = progressGroup.append('rect')
          .attr('x', start * progressBarWidth)
          .attr('width', segmentWidth)
          .attr('height', progressBarHeight)
          .attr('fill', activity.color)
          .attr('rx', 6)
          .style('cursor', 'pointer');

        // Create tooltip group
        const tooltip = progressGroup.append('g')
          .attr('class', 'tooltip')
          .style('opacity', 0)
          .attr('pointer-events', 'none');

        tooltip.append('rect')
          .attr('rx', 4)
          .attr('ry', 4)
          .attr('fill', '#1F2937')
          .attr('padding', 8);

        const timeType = isLived ? 'Past' : 'Future';
        const tooltipText = tooltip.append('text')
          .attr('fill', 'white')
          .attr('text-anchor', 'middle')
          .attr('dy', '0.32em')
          .style('font-size', '12px')
          .text(`${activity.name} - ${timeType} (${Math.round(activity.hoursPerDay / 24 * 100)}%)`);

        // Size the background rectangle based on text
        const textBBox = tooltipText.node().getBBox();
        tooltip.select('rect')
          .attr('width', textBBox.width + 16)
          .attr('height', textBBox.height + 8)
          .attr('x', -textBBox.width/2 - 8)
          .attr('y', -textBBox.height/2 - 4);

        // Add hover interactions
        segment
          .on('mouseover', function(event) {
            tooltip
              .attr('transform', `translate(${start * progressBarWidth + segmentWidth/2}, -10)`)
              .transition()
              .duration(200)
              .style('opacity', 1);
          })
          .on('mouseout', function() {
            tooltip
              .transition()
              .duration(200)
              .style('opacity', 0);
          });
      }
    };

    // Add past activity segments
    let currentX = 0;
    const livedProportion = progress.progress / 100;
    
    pastActivities.forEach(activity => {
      const proportion = activity.hoursPerDay / Math.max(24, totalPastHours);
      const segmentWidth = proportion * livedProportion;
      createActivitySegment(activity, currentX, currentX + segmentWidth, true);
      currentX += segmentWidth;
    });

    // Add future activity segments
    currentX = progress.progress / 100;
    const remainingProportion = (100 - progress.progress) / 100;
    
    futureActivities.forEach(activity => {
      const proportion = activity.hoursPerDay / Math.max(24, totalFutureHours);
      const segmentWidth = proportion * remainingProportion;
      createActivitySegment(activity, currentX, currentX + segmentWidth, false);
      currentX += segmentWidth;
    });

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

      // Activity name (editable for all activities)
      const nameGroup = activityGroup.append('g')
        .attr('transform', 'translate(30, 0)');

      const nameInput = nameGroup.append('foreignObject')
        .attr('y', 5)
        .attr('width', 150)
        .attr('height', 24);

      const input = nameInput.append('xhtml:input')
        .attr('type', 'text')
        .attr('value', activity.name)
        .style('font-size', '14px')
        .style('font-weight', 'bold')
        .style('border', 'none')
        .style('background', 'none')
        .style('width', '100%')
        .style('padding', '0')
        .style('outline', 'none')
        .style('border-bottom', '1px solid transparent')
        .style('transition', 'border-bottom-color 0.2s')
        .on('mouseover', function() {
          this.style.borderBottomColor = '#D1D5DB';
        })
        .on('mouseout', function() {
          if (document.activeElement !== this) {
            this.style.borderBottomColor = 'transparent';
          }
        })
        .on('focus', function() {
          this.style.borderBottomColor = '#3B82F6';
        })
        .on('blur', function() {
          this.style.borderBottomColor = 'transparent';
        })
        .on('change', function() {
          handleActivityNameChange(activity.id, this.value);
        });

      // Color indicator (clickable for all activities)
      const colorRect = activityGroup.append('rect')
        .attr('width', 12)
        .attr('height', 12)
        .attr('fill', activity.color)
        .attr('rx', 2)
        .attr('ry', 2)
        .attr('transform', 'translate(8, 14)')
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

      // Hours input
      const hoursGroup = nameGroup.append('g')
        .attr('transform', 'translate(0, 28)');

      hoursGroup.append('text')
        .attr('y', 12)
        .style('font-size', '12px')
        .text('Hours per day:');

      const hoursInput = hoursGroup.append('foreignObject')
        .attr('x', 80)
        .attr('y', -4)
        .attr('width', 50)
        .attr('height', 24);

      const hoursInputField = hoursInput.append('xhtml:input')
        .attr('type', 'number')
        .attr('min', '0')
        .attr('max', '24')
        .attr('step', '0.5')
        .attr('value', activity.hoursPerDay)
        .style('width', '100%')
        .style('height', '100%')
        .style('padding', '2px 4px')
        .style('border', '1px solid #D1D5DB')
        .style('border-radius', '4px')
        .style('font-size', '12px')
        .on('change', function() {
          const newHours = Math.min(24, Math.max(0, parseFloat(this.value) || 0));
          handleActivityHoursChange(activity.id, newHours);
          this.value = newHours; // Update the input to show the clamped value
        });

      // Total units under hours
      hoursGroup.append('text')
        .attr('x', 0)
        .attr('y', 32)
        .style('font-size', '12px')
        .style('fill', '#6B7280')
        .text(`Total: ${calculateActivityPastFutureUnits(activity).total} ${timeUnit}`);

      // Past/Future toggles with units
      const toggleGroup = activityGroup.append('g')
        .style('cursor', 'pointer')
        .attr('transform', `translate(${(svgWidth - 40) / 4 + 20}, 12)`);

      // Past toggle and units
      const spentToggle = toggleGroup.append('g')
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
        .text(`${calculateActivityPastFutureUnits(activity).past} ${timeUnit}`);

      // Future toggle and units
      const futureToggle = toggleGroup.append('g')
        .attr('transform', 'translate(0, 25)')
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
        .text(`${calculateActivityPastFutureUnits(activity).future} ${timeUnit}`);

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

    // Add "New Activity" button after the activities list
    const addButton = activityList.append('g')
      .attr('transform', `translate(0, ${activities.length * 65})`)
      .style('cursor', 'pointer')
      .on('click', handleAddActivity);

    addButton.append('rect')
      .attr('width', 120)
      .attr('height', 32)
      .attr('fill', '#3B82F6')
      .attr('rx', 6)
      .attr('ry', 6);

    addButton.append('text')
      .attr('x', 60)
      .attr('y', 21)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('fill', 'white')
      .text('New Activity');

    // Update SVG height to accommodate everything
    svg.attr('width', svgWidth)
      .attr('height', statsY + statsHeight + (cellSize + padding) * 2);

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
    handleRemoveActivity
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
