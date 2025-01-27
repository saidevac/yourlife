import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const LifeGrid = () => {
  const svgRef = useRef();
  const [timeUnit, setTimeUnit] = useState('weeks'); // Default time unit

  // Function to handle time unit change
  const handleTimeUnitChange = (event) => {
    setTimeUnit(event.target.value);
  };

  // Calculate weeks, days, months, and years based on the selected unit
  const calculateTimeUnits = () => {
    let weeks, weeksPerRow, rows, cellSize, padding;
    switch (timeUnit) {
      case 'hours':
        weeks = 52 * 90 * 24 * 7; // 90 years worth of hours
        weeksPerRow = 52 * 24 * 7;
        rows = Math.ceil(weeks / weeksPerRow);
        cellSize = 2;
        padding = 1;
        break;
      case 'days':
        weeks = 52 * 90 * 7; // 90 years worth of days
        weeksPerRow = 52 * 7;
        rows = Math.ceil(weeks / weeksPerRow);
        cellSize = 4;
        padding = 2;
        break;
      case 'weeks':
        weeks = 52 * 90; // 90 years worth of weeks
        weeksPerRow = 52;
        rows = Math.ceil(weeks / weeksPerRow);
        cellSize = 12;
        padding = 2;
        break;
      case 'months':
        weeks = 12 * 90; // 90 years worth of months
        weeksPerRow = 12; // 12 months in a year
        rows = Math.ceil(weeks / weeksPerRow);
        cellSize = 20; // Smaller cell size for compactness
        padding = 2; // Reduced padding for compactness
        break;
      case 'years':
        weeks = 100; // Set to 100 years worth of years
        weeksPerRow = 10; // 10 years per row
        rows = Math.ceil(weeks / weeksPerRow);
        cellSize = 40; // Smaller cell size for compactness
        padding = 2; // Reduced padding for compactness
        break;
      default:
        break;
    }

    return { weeks, weeksPerRow, rows, cellSize, padding };
  };

  useEffect(() => {
    if (!svgRef.current) return;

    // Clear any existing SVG content
    d3.select(svgRef.current).selectAll("*").remove();

    const { weeks, weeksPerRow, rows, cellSize, padding } = calculateTimeUnits();

    const svg = d3.select(svgRef.current)
      .attr('width', (cellSize + padding) * weeksPerRow + (cellSize + padding) * 4)
      .attr('height', (cellSize + padding) * rows + (cellSize + padding) * 6); // Increased height for legend

    // Calculate current age in weeks
    const birthDate = new Date('1990-01-01'); // Default birth date
    const today = new Date();
    let ageInWeeks;
    switch (timeUnit) {
      case 'hours':
        ageInWeeks = Math.floor((today - birthDate) / (7 * 24 * 60 * 60 * 1000)) * 24 * 7;
        break;
      case 'days':
        ageInWeeks = Math.floor((today - birthDate) / (7 * 24 * 60 * 60 * 1000)) * 7;
        break;
      case 'weeks':
        ageInWeeks = Math.floor((today - birthDate) / (7 * 24 * 60 * 60 * 1000));
        break;
      case 'months':
        ageInWeeks = Math.floor((today - birthDate) / (7 * 24 * 60 * 60 * 1000)) / 12;
        break;
      case 'years':
        ageInWeeks = Math.floor((today - birthDate) / (7 * 24 * 60 * 60 * 1000)) / 52;
        break;
      default:
        break;
    }

    // Create week cells
    svg.selectAll('rect')
      .data(Array(weeks).fill(0))
      .enter()
      .append('rect')
      .attr('x', (d, i) => (i % weeksPerRow) * (cellSize + padding) + (cellSize + padding) * 2)
      .attr('y', (d, i) => Math.floor(i / weeksPerRow) * (cellSize + padding))
      .attr('width', cellSize)
      .attr('height', cellSize)
      .attr('rx', 2)
      .attr('ry', 2)
      .attr('class', (d, i) =>
        i < ageInWeeks
          ? 'fill-blue-500'
          : 'fill-gray-200'
      )
      .attr('title', (d, i) => `${timeUnit.charAt(0).toUpperCase() + timeUnit.slice(1)} ${i + 1}`);

    // Move legend to the bottom of the grid
    svg.append('text')
      .attr('x', (cellSize + padding) * (weeksPerRow + 2) - 300) // Adjusted x position
      .attr('y', (cellSize + padding) * (rows + 2)) // Adjusted position
      .attr('class', 'text-lg font-bold')
      .text('Legend:');

    // Sample cell for weeks lived
    svg.append('rect')
      .attr('x', (cellSize + padding) * (weeksPerRow + 2) - 300) // Adjusted x position
      .attr('y', (cellSize + padding) * (rows + 3))
      .attr('width', cellSize)
      .attr('height', cellSize)
      .attr('class', 'fill-blue-500');

    svg.append('text')
      .attr('x', (cellSize + padding) * (weeksPerRow + 2) + cellSize - 250) // Adjusted x position
      .attr('y', (cellSize + padding) * (rows + 3) + cellSize / 2)
      .attr('dy', '.35em')
      .text(`${timeUnit.charAt(0).toUpperCase() + timeUnit.slice(1)} Lived`);

    // Sample cell for future weeks
    svg.append('rect')
      .attr('x', (cellSize + padding) * (weeksPerRow + 2) - 300) // Adjusted x position
      .attr('y', (cellSize + padding) * (rows + 5)) // Increased spacing
      .attr('width', cellSize)
      .attr('height', cellSize)
      .attr('class', 'fill-gray-200');

    svg.append('text')
      .attr('x', (cellSize + padding) * (weeksPerRow + 2) + cellSize - 250) // Adjusted x position
      .attr('y', (cellSize + padding) * (rows + 5) + cellSize / 2)
      .attr('dy', '.35em')
      .text(`Future ${timeUnit}`);
  }, [timeUnit]);

  return (
    <div className="flex flex-col items-center p-8">
      <h1 className="text-3xl font-bold mb-8">Your Life in {timeUnit}</h1>
      <select onChange={handleTimeUnitChange} value={timeUnit}>
        <option value="hours">Hours</option>
        <option value="days">Days</option>
        <option value="weeks">Weeks</option>
        <option value="months">Months</option>
        <option value="years">Years</option>
      </select>
      <div className="overflow-auto">
        <svg ref={svgRef} className="mx-auto"></svg>
      </div>
      <p className="mt-4 text-gray-600">
        Each box represents one {timeUnit} of your life. Blue boxes show {timeUnit} you've lived.
      </p>
    </div>
  );
};

export default LifeGrid;
