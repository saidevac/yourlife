import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import * as htmlToImage from 'html-to-image';
import { useLifeGridCalculations } from '../hooks/useLifeGridCalculations';

const LifeGrid = () => {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [timeUnit, setTimeUnit] = useState('years');
  const [birthDate, setBirthDate] = useState('1978-01-01');
  const [lifespan, setLifespan] = useState(80);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [activities, setActivities] = useState([
    { id: 1, name: 'Sleeping', hoursPerDay: 8, color: '#3B82F6', spent: false, future: false },
    { id: 2, name: 'Eating', hoursPerDay: 2, color: '#22C55E', spent: false, future: false }
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
    leaf: (scale) => `
      M ${0 * scale},${0 * scale}
      C ${-8 * scale},${4 * scale} ${-8 * scale},${16 * scale} ${0 * scale},${20 * scale}
      C ${8 * scale},${16 * scale} ${8 * scale},${4 * scale} ${0 * scale},${0 * scale}
      M ${0 * scale},${0 * scale}
      L ${0 * scale},${20 * scale}
      Z`,
    person: (scale) => `
      M ${0 * scale},${-8 * scale}
      a ${4 * scale},${4 * scale} 0 1,0 ${0.1 * scale},${0}
      a ${4 * scale},${4 * scale} 0 1,0 ${-0.1 * scale},${0}
      M ${-6 * scale},${20 * scale}
      C ${-6 * scale},${8 * scale} ${6 * scale},${8 * scale} ${6 * scale},${20 * scale}
      Z`,
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
    const shapeOrder = ['heart', 'leaf', 'person', 'square', 'circle'];
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

  useEffect(() => {
    if (!svgRef.current) return;
    
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const svgWidth = windowWidth * 0.95;
    const { units, unitsPerRow, rows, cellSize, padding } = calculateTimeUnits();
    const gridWidth = (cellSize + padding) * unitsPerRow;
    
    // Calculate progress once at the start
    const progress = calculateProgress();
    
    // Calculate left offset to center the grid
    const gridLeftOffset = Math.max(0, (svgWidth - gridWidth) / 2);

    // Create a group for the grid
    const gridGroup = svg.append('g')
      .attr('transform', `translate(${gridLeftOffset}, ${(cellSize + padding) * 3})`);

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

    // Calculate stats panel position
    const statsY = (cellSize + padding) * rows + (cellSize + padding) * 4;
    const headerHeight = 40;
    const activityHeight = 65;
    const verticalPadding = 30;
    const buttonHeight = 50;  // Space for button and padding
    const statsHeight = headerHeight + (activities.length * activityHeight) + buttonHeight + verticalPadding;

    // Add statistics panel using full width
    const stats = svg.append('g')
      .attr('class', 'stats')
      .attr('transform', `translate(20, ${statsY})`);

    // Add background for stats using full width
    stats.append('rect')
      .attr('width', svgWidth - 40)
      .attr('height', statsHeight)
      .attr('fill', '#F3F4F6')
      .attr('rx', 8)
      .attr('ry', 8);

    // Add divider line in the middle
    const middleX = (svgWidth - 40) / 2;
    stats.append('line')
      .attr('x1', middleX)
      .attr('y1', 20)
      .attr('x2', middleX)
      .attr('y2', statsHeight - 20)
      .attr('stroke', '#D1D5DB')
      .attr('stroke-width', 1);

    // Add content group for stats
    const lifeStatsContent = stats.append('g')
      .attr('transform', 'translate(30, 25)');

    // Add "Life Statistics" title
    lifeStatsContent.append('text')
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .text('Life Statistics');

    // Calculate reduced remaining years based on future activities
    const pastActivities = activities.filter(a => a.spent);
    const futureActivities = activities.filter(a => a.future);
    const totalPastHours = pastActivities.reduce((sum, a) => sum + a.hoursPerDay, 0);
    const totalFutureHours = futureActivities.reduce((sum, a) => sum + a.hoursPerDay, 0);
    
    // Calculate how many years are used by future activities
    const futureYearsUsed = totalFutureHours > 0 ? 
      Math.ceil((progress.remaining * totalFutureHours / 24) * 10) / 10 : 0;
    
    // Update both lived and remaining years
    const yearsRemaining = progress.remaining - futureYearsUsed;
    const yearsLived = progress.lived + futureYearsUsed;

    // Add life progress stats in two columns with more spacing
    const lifeStats = [
      { color: '#3B82F6', text: `${yearsLived.toFixed(1)} ${timeUnit} lived` },
      { color: '#E5E7EB', text: `${yearsRemaining.toFixed(1)} ${timeUnit} remaining` }
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

    // Progress percentage labels
    const remainingPercentage = 100 - progress.progress;
    const totalUnits = Math.ceil(progress.total);
    
    // Calculate adjusted remaining percentage if there are future activities
    let adjustedRemainingPercentage = remainingPercentage;
    if (totalFutureHours > 0) {
      // Get the conversion factor based on time unit
      let timeUnitInDays;
      switch (timeUnit) {
        case 'hours':
          timeUnitInDays = 1/24;
          break;
        case 'days':
          timeUnitInDays = 1;
          break;
        case 'weeks':
          timeUnitInDays = 7;
          break;
        case 'months':
          timeUnitInDays = 30;
          break;
        default: // years
          timeUnitInDays = 365;
      }

      // Calculate extra units needed based on current time unit
      const unitsRemaining = progress.remaining;
      const extraUnitsNeeded = Math.ceil(unitsRemaining * (totalFutureHours / 24));
      const totalUnitsWithExtra = progress.total + (extraUnitsNeeded / timeUnitInDays);
      
      // Calculate the percentage that future activities take up
      const futureActivityPercentage = (extraUnitsNeeded / totalUnitsWithExtra) * 100;
      
      // Subtract from remaining percentage
      adjustedRemainingPercentage = Math.max(0, remainingPercentage - futureActivityPercentage);
    }
    
    // Title text with different styles for each part
    const progressTitleGroup = progressGroup.append('g')
      .attr('transform', 'translate(0, -8)');

    // Total units in bold
    progressTitleGroup.append('text')
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .text(`${totalUnits} ${timeUnit} `);

    // Get the width of the first text element
    const unitsTextWidth = progressTitleGroup.select('text').node().getBBox().width;

    // Percentages in normal weight
    progressTitleGroup.append('text')
      .attr('x', unitsTextWidth)
      .style('font-size', '14px')
      .text(`(${progress.progress}% complete)`);

    // Progress bar background
    progressGroup.append('rect')
      .attr('width', progressBarWidth)
      .attr('height', progressBarHeight)
      .attr('fill', '#E5E7EB')
      .attr('rx', 6);

    // Add blue progress bar
    progressGroup.append('rect')
      .attr('width', progressBarWidth * (progress.progress / 100))
      .attr('height', progressBarHeight)
      .attr('fill', '#3B82F6')
      .attr('rx', 6);

    // Add activity segments if any
    if (totalPastHours > 0 || totalFutureHours > 0) {
      // Create tooltip
      const tooltip = progressGroup.append('g')
        .attr('class', 'tooltip')
        .style('opacity', 0)
        .style('pointer-events', 'none');

      tooltip.append('rect')
        .attr('rx', 4)
        .attr('ry', 4)
        .attr('fill', '#1F2937')
        .attr('width', 0)
        .attr('height', 0);

      tooltip.append('text')
        .style('font-size', '12px')
        .style('fill', 'white');

      const showTooltip = (event, activity, isPast) => {
        const percentage = (activity.hoursPerDay / 24 * 100).toFixed(1);
        const text = `${activity.name}: ${percentage}% ${isPast ? '(Past)' : '(Future)'}`;
        
        const tooltipText = tooltip.select('text')
          .attr('x', 8)
          .attr('y', 15)
          .text(text);

        const bbox = tooltipText.node().getBBox();
        
        tooltip.select('rect')
          .attr('width', bbox.width + 16)
          .attr('height', bbox.height + 10);

        const [mouseX, mouseY] = d3.pointer(event, progressGroup.node());
        
        tooltip
          .attr('transform', `translate(${mouseX - (bbox.width + 16)/2}, ${mouseY - 35})`)
          .transition()
          .duration(100)
          .style('opacity', 1);
      };

      const hideTooltip = () => {
        tooltip
          .transition()
          .duration(100)
          .style('opacity', 0);
      };

      // Past activities (blue to activity color)
      let currentX = 0;
      pastActivities.forEach(activity => {
        const proportion = activity.hoursPerDay / 24;
        const width = progressBarWidth * (progress.progress / 100) * proportion;
        progressGroup.append('rect')
          .attr('x', currentX)
          .attr('width', width)
          .attr('height', progressBarHeight)
          .attr('fill', activity.color)
          .attr('rx', 6)
          .style('cursor', 'pointer')
          .on('mouseover', (event) => showTooltip(event, activity, true))
          .on('mousemove', (event) => {
            const [mouseX, mouseY] = d3.pointer(event, progressGroup.node());
            const tooltipWidth = tooltip.select('rect').attr('width');
            tooltip.attr('transform', `translate(${mouseX - tooltipWidth/2}, ${mouseY - 35})`);
          })
          .on('mouseout', hideTooltip);
        currentX += width;
      });

      // Future activities (gray to activity color)
      currentX = progressBarWidth * (progress.progress / 100);
      futureActivities.forEach(activity => {
        const proportion = activity.hoursPerDay / 24;
        const width = progressBarWidth * ((100 - progress.progress) / 100) * proportion;
        progressGroup.append('rect')
          .attr('x', currentX)
          .attr('width', width)
          .attr('height', progressBarHeight)
          .attr('fill', activity.color)
          .attr('rx', 6)
          .style('cursor', 'pointer')
          .on('mouseover', (event) => showTooltip(event, activity, false))
          .on('mousemove', (event) => {
            const [mouseX, mouseY] = d3.pointer(event, progressGroup.node());
            const tooltipWidth = tooltip.select('rect').attr('width');
            tooltip.attr('transform', `translate(${mouseX - tooltipWidth/2}, ${mouseY - 35})`);
          })
          .on('mouseout', hideTooltip);
        currentX += width;
      });
    }

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
        .text(`Total: ${calculateActivityPastFutureUnits(activity).total.toFixed(1)} ${timeUnit}`);

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
        .text(`${calculateActivityPastFutureUnits(activity).past.toFixed(1)} ${timeUnit}`);

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
        .text(`${calculateActivityPastFutureUnits(activity).future.toFixed(1)} ${timeUnit}`);

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

    // Add "New Activity" button under the activities but inside the gray section
    const addButton = activitiesSection.append('g')
      .attr('transform', `translate(30, ${40 + activities.length * 65 + 25})`)  // 30px left padding to match activities
      .style('cursor', 'pointer')
      .on('click', handleAddActivity);

    // Button background
    addButton.append('rect')
      .attr('width', 120)
      .attr('height', 32)
      .attr('fill', '#3B82F6')
      .attr('rx', 6)
      .attr('ry', 6);

    // Button text
    addButton.append('text')
      .attr('x', 60)
      .attr('y', 20)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .style('font-size', '14px')
      .style('fill', 'white')
      .text('New Activity');

    // Add hover effect
    addButton.on('mouseover', function() {
      d3.select(this).select('rect').attr('fill', '#2563EB');
    })
    .on('mouseout', function() {
      d3.select(this).select('rect').attr('fill', '#3B82F6');
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
            <div className="flex items-center gap-2 text-sm">
              <label className="font-semibold">as:</label>
              <div 
                onClick={cycleShape}
                className="cursor-pointer"
                style={{ display: 'inline-block', width: '24px', height: '24px' }}
              >
                <svg width="24" height="24" viewBox="-12 -12 24 24">
                  <path
                    d={shapes[currentShape](0.8)}
                    fill="#3B82F6"
                    transform="translate(0, 2)"
                  />
                </svg>
              </div>
            </div>
            <button 
              className="flex items-center gap-1 px-3 py-1 border rounded-md text-gray-700 hover:bg-gray-50"
              onClick={handleShare}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
              </svg>
              Share
            </button>
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
