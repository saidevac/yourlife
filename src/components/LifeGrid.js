import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';

const LifeGrid = () => {
  const svgRef = useRef();
  const [timeUnit, setTimeUnit] = useState('weeks');
  const [birthDate, setBirthDate] = useState('1978-01-01');
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleTimeUnitChange = (event) => {
    setTimeUnit(event.target.value);
  };

  const handleBirthDateChange = (event) => {
    setBirthDate(event.target.value);
  };

  // Calculate weeks, days, months, and years based on the selected unit
  const calculateTimeUnits = useCallback(() => {
    const screenHeight = window.innerHeight;
    const screenWidth = window.innerWidth;
    const headerHeight = 80; 
    const availableHeight = screenHeight - headerHeight; 
    const availableWidth = screenWidth - 40; 
    let units, unitsPerRow, rows;
    let cellSize, padding;

    const calculateDimensions = (totalUnits, defaultUnitsPerRow) => {
      if (timeUnit === 'weeks') {
        // Calculate optimal number of weeks per row to use full width
        // Start with 50 weeks per row (nice round number divisible by 10)
        const targetUnitsPerRow = 50;
        
        // Calculate cell size to fit the width
        const maxCellWidth = Math.floor((availableWidth - 20) / targetUnitsPerRow); 
        const maxCellHeight = Math.floor(availableHeight / 95); // Increase rows to fit all cells
        
        // Use the smaller dimension to ensure squares
        const localCellSize = Math.max(Math.min(maxCellWidth, maxCellHeight), 12);
        const localPadding = Math.max(2, Math.floor(localCellSize * 0.1));
        
        // Recalculate final units per row based on available space
        const totalCellWidth = localCellSize + localPadding;
        const maxUnitsPerRow = Math.floor((availableWidth - localPadding) / totalCellWidth);
        
        // Round down to nearest multiple of 10
        const roundedUnitsPerRow = Math.floor(maxUnitsPerRow / 10) * 10;
        
        return { 
          unitsPerRow: roundedUnitsPerRow, 
          cellSize: localCellSize, 
          padding: localPadding 
        };
      }

      let localCellSize, localPadding;
      switch (timeUnit) {
        case 'hours':
          localCellSize = 1;
          localPadding = 0;
          break;
        case 'days':
          localCellSize = Math.max(2, Math.floor(Math.max(Math.floor(windowWidth / 70), 6) * 0.25));
          localPadding = 1;
          break;
        case 'months':
          localCellSize = Math.max(16, Math.floor(Math.max(Math.floor(windowWidth / 70), 6) * 2));
          localPadding = 2;
          break;
        case 'years':
          localCellSize = Math.max(32, Math.floor(Math.max(Math.floor(windowWidth / 70), 6) * 4));
          localPadding = 2;
          break;
        default:
          localCellSize = 10;
          localPadding = 1;
      }
      return { unitsPerRow: defaultUnitsPerRow, cellSize: localCellSize, padding: localPadding };
    };

    let dimensions;
    switch (timeUnit) {
      case 'hours':
        units = 24 * 365 * 90;
        dimensions = calculateDimensions(units, 24 * 30);
        ({ unitsPerRow, cellSize, padding } = dimensions);
        break;
      case 'days':
        units = 365 * 90;
        dimensions = calculateDimensions(units, 365);
        ({ unitsPerRow, cellSize, padding } = dimensions);
        break;
      case 'weeks':
        units = 52 * 90;
        dimensions = calculateDimensions(units, 52);
        ({ unitsPerRow, cellSize, padding } = dimensions);
        break;
      case 'months':
        units = 12 * 90;
        dimensions = calculateDimensions(units, 12);
        ({ unitsPerRow, cellSize, padding } = dimensions);
        break;
      case 'years':
        units = 90;
        dimensions = calculateDimensions(units, 10);
        ({ unitsPerRow, cellSize, padding } = dimensions);
        break;
      default:
        break;
    }

    rows = Math.ceil(units / unitsPerRow);
    return { units, unitsPerRow, rows, cellSize, padding };
  }, [timeUnit, windowWidth]);

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

  useEffect(() => {
    if (!svgRef.current) return;

    const { units, unitsPerRow, rows, cellSize, padding } = calculateTimeUnits();
    const ageInUnits = calculateAge();

    // Clear existing content
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr('width', (cellSize + padding) * unitsPerRow + (cellSize + padding) * 4)
      .attr('height', (cellSize + padding) * rows + (cellSize + padding) * 6);

    // Create cells
    svg.selectAll('rect')
      .data(Array(units).fill(0))
      .enter()
      .append('rect')
      .attr('x', (d, i) => (i % unitsPerRow) * (cellSize + padding) + (cellSize + padding) * 2)
      .attr('y', (d, i) => Math.floor(i / unitsPerRow) * (cellSize + padding) + (cellSize + padding) * 3)
      .attr('width', cellSize)
      .attr('height', cellSize)
      .attr('rx', 2)
      .attr('ry', 2)
      .attr('class', (d, i) => i < ageInUnits ? 'fill-blue-500' : 'fill-gray-200')
      .on('mouseover', function(event, d, i) {
        const index = d3.select(this).attr('data-index');
        const cell = d3.select(this);
        const bbox = this.getBBox();
        const centerX = bbox.x + bbox.width/2;
        const centerY = bbox.y + bbox.height/2;
        
        cell.transition()
          .duration(200)
          .attr('transform', `translate(${centerX},${centerY}) scale(4) translate(${-centerX},${-centerY})`);
        
        svg.append('text')
          .attr('class', 'cell-number')
          .attr('x', (index % unitsPerRow) * (cellSize + padding) + (cellSize + padding) * 2 + cellSize/2)
          .attr('y', Math.floor(index / unitsPerRow) * (cellSize + padding) + (cellSize + padding) * 3 + cellSize/2)
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'middle')
          .style('font-size', `${Math.max(cellSize * 0.8, 14)}px`)
          .style('pointer-events', 'none')
          .text(Number(index) + 1);
      })
      .on('mouseout', function() {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('transform', 'scale(1)');
        
        svg.selectAll('.cell-number').remove();
      })
      .attr('data-index', (d, i) => i);

  }, [timeUnit, birthDate, windowWidth, calculateTimeUnits, calculateAge]);

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
        <div className="flex justify-center mt-4">
          <div className="bg-gray-50 p-4 rounded-lg shadow-sm w-full max-w-xl">
            <h2 className="text-lg font-bold mb-3">Life Statistics</h2>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <p className="text-sm">Lived {timeUnit}: {calculateProgress().lived}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-200 rounded"></div>
                <p className="text-sm">Remaining {timeUnit}: {calculateProgress().remaining}</p>
              </div>
              <p className="text-sm">Total {timeUnit}: {calculateProgress().total}</p>
              <p className="text-sm font-semibold">Life Progress: {calculateProgress().progress}%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LifeGrid;
