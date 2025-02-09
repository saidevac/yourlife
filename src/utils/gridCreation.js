import { createGridCell } from './gridShapes';
import { createColoredArrowMarkers, addCellAnnotation, addGridAnnotation } from './dynamicAnnotations';

export const createLifeGrid = ({
  d3,
  svg,
  timeUnit,
  windowWidth,
  calculateTimeUnits,
  getActivityColorForCell,
  progress,
  currentShape,
  lifespan,
  gridLeftOffset = 0,
  annotations = []  // New parameter for custom annotations
}) => {
  // Clear any existing content
  svg.selectAll('*').remove();

  // Get the total units we need to display
  const { units } = calculateTimeUnits();

  // Define grid layout parameters based on time unit
  const gridConfig = {
    years: {
      unitsPerRow: 10,
      minCellSize: 45,
      maxCellSize: 65,
      shapeScale: 2.5,
      cellPadding: 0.1,
      topMargin: 55,
      leftMargin: 25,
      rightMargin: 25,
      hoverScale: 1.4,
      fontScale: 1.4
    },
    months: {
      unitsPerRow: 24,
      minCellSize: 34,
      maxCellSize: 55,
      shapeScale: 1.6,
      cellPadding: 0.1,
      topMargin: 55,
      leftMargin: 25,
      rightMargin: 25,
      hoverScale: 2.0,
      fontScale: 0.8
    },
    weeks: {
      unitsPerRow: 52,
      minCellSize: 12,
      maxCellSize: 20,
      shapeScale: 1.1,
      cellPadding: 0.5,
      topMargin: 55,
      leftMargin: 15,
      rightMargin: 10,
      hoverScale: 3.0,
      fontScale: 2.0
    }
  };

  // Get configuration for current time unit
  const config = gridConfig[timeUnit];

  // Calculate rows and total height needed
  const rows = Math.ceil(units / config.unitsPerRow);
  const bottomBuffer = timeUnit === 'weeks' ? 120 : 80;
  
  // Calculate available space with proper margins
  const availableWidth = windowWidth - (config.leftMargin + config.rightMargin) - 20;
  const availableHeight = window.innerHeight - config.topMargin - bottomBuffer;

  // Calculate base cell size ensuring all rows fit
  const heightNeeded = rows * (1 + config.cellPadding);
  const widthNeeded = config.unitsPerRow * (1 + config.cellPadding);
  
  // Calculate cell size based on available space and needs
  let cellSize = Math.min(
    availableWidth / widthNeeded,
    availableHeight / heightNeeded
  );

  // Apply min/max constraints
  cellSize = Math.min(Math.max(cellSize, config.minCellSize), config.maxCellSize);
  
  const padding = cellSize * config.cellPadding;
  
  // Calculate total grid dimensions
  const cellWithPadding = cellSize + padding;
  const totalWidth = config.unitsPerRow * cellWithPadding;
  const totalHeight = rows * cellWithPadding;
  
  // Center the grid horizontally
  let gridX = (windowWidth - totalWidth) / 2;

  // Create arrow markers for annotations
  createColoredArrowMarkers(svg);

  // Create defs for gradients
  const defs = svg.append('defs');

  // Create the grid group and translate it to position
  const gridGroup = svg
    .append('g')
    .attr('transform', `translate(${gridX}, ${config.topMargin})`);

  // Create cell groups first
  const cellGroups = gridGroup
    .selectAll('.cell-group')
    .data(Array(units).fill(0))
    .enter()
    .append('g')
    .attr('class', 'cell-group')
    .attr('transform', (d, i) => {
      const row = Math.floor(i / config.unitsPerRow);
      const col = i % config.unitsPerRow;
      const x = col * cellWithPadding;
      const y = row * cellWithPadding;
      return `translate(${x}, ${y})`;
    });

  // Create cells within groups
  const cells = cellGroups
    .append('path')
    .attr('class', 'cell')
    .attr('transform', `translate(${cellSize/2}, ${cellSize/2})`);

  // Add cell shapes and numbers
  cells.each(function(d, i) {
    const cell = d3.select(this);
    const isLived = i < progress.lived;
    const color = getActivityColorForCell(i, isLived);

    createGridCell({
      d3,
      cell,
      shape: currentShape,
      scale: config.shapeScale,
      color,
      defs,
      index: i
    });
  });

  // Add numbers directly to cell groups
  cellGroups
    .append('text')
    .attr('class', 'cell-number')
    .text((d, i) => i + 1)
    .attr('x', cellSize/2)
    .attr('y', cellSize/2)
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'middle')
    .attr('font-size', `${cellSize * 0.4}px`)
    .attr('font-family', 'Arial, sans-serif')
    .attr('font-weight', 'bold')
    .attr('fill', '#000000')
    .attr('stroke', 'white')
    .attr('stroke-width', '1px')
    .style('pointer-events', 'none')
    .style('z-index', 10);

  // Add hover effects
  cells
    .on('mouseover', function(event, d) {
      const cell = d3.select(this);
      const cellGroup = d3.select(this.parentNode);
      const number = cellGroup.select('.cell-number');
      
      // Scale up the cell
      cell
        .transition()
        .duration(200)
        .attr('transform', `translate(${cellSize/2}, ${cellSize/2}) scale(${config.hoverScale})`);
      
      // Scale up the number using fontScale
      number
        .transition()
        .duration(200)
        .attr('font-size', `${cellSize * config.fontScale}px`);
    })
    .on('mouseout', function(event, d) {
      const cell = d3.select(this);
      const cellGroup = d3.select(this.parentNode);
      const number = cellGroup.select('.cell-number');
      
      // Reset cell scale
      cell
        .transition()
        .duration(200)
        .attr('transform', `translate(${cellSize/2}, ${cellSize/2}) scale(1)`);
      
      // Reset number size
      number
        .transition()
        .duration(200)
        .attr('font-size', `${cellSize * 0.4}px`);
    });

  // Add default annotations
  addCellAnnotation(gridGroup, 0, 'Birth', 'left', '#3B82F6', {
    unitsPerRow: config.unitsPerRow,
    cellSize,
    padding,
    units
  }, { totalWidth, totalHeight });

  addCellAnnotation(gridGroup, units - 1, `Turning\n${lifespan}`, 'right', '#8B5CF6', {
    unitsPerRow: config.unitsPerRow,
    cellSize,
    padding,
    units
  }, { totalWidth, totalHeight });

  // Add custom annotations
  annotations.forEach(annotation => {
    // Only add cell annotations if their cells exist in the grid
    if (annotation.type === 'cell' && annotation.cellIndex >= units) {
      return; // Skip this annotation if the cell doesn't exist
    }

    if (annotation.type === 'cell') {
      addCellAnnotation(
        gridGroup,
        annotation.cellIndex,
        annotation.text,
        annotation.position,
        annotation.color,
        {
          unitsPerRow: config.unitsPerRow,
          cellSize,
          padding,
          units
        },
        { totalWidth, totalHeight }
      );
    } else if (annotation.type === 'grid') {
      addGridAnnotation(
        gridGroup,
        annotation.text,
        annotation.position,
        annotation.color,
        {
          unitsPerRow: config.unitsPerRow,
          cellSize,
          padding,
          units
        },
        { totalWidth, totalHeight }
      );
    }
  });

  return { gridGroup, gridWidth: totalWidth, gridHeight: totalHeight };
};
