// Dynamic annotation system for the life grid

// Calculate position for an annotation relative to a cell
const calculateAnnotationPosition = (cellIndex, totalCells, config, gridDimensions) => {
  const { unitsPerRow, cellSize, padding } = config;
  const cellWithPadding = cellSize + padding;
  
  // Calculate row and column of the cell
  const row = Math.floor(cellIndex / unitsPerRow);
  const col = cellIndex % unitsPerRow;
  
  // Calculate x and y coordinates of the cell
  const x = col * cellWithPadding;
  const y = row * cellWithPadding;
  
  return { x, y, cellSize, row, col };
};

// Add an annotation with arrow pointing to a specific cell
export const addCellAnnotation = (
  gridGroup,
  cellIndex,
  text,
  position = 'right',
  color = '#3B82F6',
  config,
  gridDimensions
) => {
  const { x, y, cellSize } = calculateAnnotationPosition(
    cellIndex,
    config.units,
    config,
    gridDimensions
  );

  // Define position offsets and arrow paths for different positions
  const positions = {
    top: {
      textX: x,
      textY: y - 25,
      arrowPath: `M ${x + cellSize/2},${y - 20} L ${x + cellSize/2},${y}`,
      textAnchor: 'middle'
    },
    right: {
      textX: x + cellSize + 60,
      textY: y + cellSize/2,
      arrowPath: `M ${x + cellSize + 55},${y + cellSize/2} L ${x + cellSize},${y + cellSize/2}`,
      textAnchor: 'start'
    },
    bottom: {
      textX: x + cellSize/2,
      textY: y + cellSize + 30,
      arrowPath: `M ${x + cellSize/2},${y + cellSize + 25} L ${x + cellSize/2},${y + cellSize}`,
      textAnchor: 'middle'
    },
    left: {
      textX: x - 55,
      textY: y + cellSize/2,
      arrowPath: `M ${x - 55},${y + cellSize/2} L ${x},${y + cellSize/2}`,
      textAnchor: 'end'
    }
  };

  const pos = positions[position];

  // Add text annotation with support for line breaks
  const textElement = gridGroup.append('text')
    .attr('class', 'annotation')
    .attr('x', pos.textX)
    .attr('y', pos.textY)
    .attr('text-anchor', pos.textAnchor)
    .style('font-size', '18px')
    .style('fill', color)
    .style('font-weight', 'bold');

  // Split text by newline and create tspan elements
  const lines = text.split('\n');
  lines.forEach((line, i) => {
    textElement.append('tspan')
      .attr('x', pos.textX)
      .attr('dy', i === 0 ? 0 : '1.1em')
      .attr('text-anchor', pos.textAnchor)
      .text(line);
  });

  // Add arrow
  gridGroup.append('path')
    .attr('d', pos.arrowPath)
    .attr('stroke', color)
    .attr('stroke-width', 2.5)
    .attr('marker-end', `url(#arrowhead-${color.replace('#', '')})`);
};

// Add a grid-level annotation
export const addGridAnnotation = (
  gridGroup,
  text,
  position = 'top',
  color = '#3B82F6',
  config,
  gridDimensions
) => {
  const { totalWidth, totalHeight } = gridDimensions;
  const { cellSize, padding, unitsPerRow } = config;
  const cellWithPadding = cellSize + padding;
  
  // Define positions for grid-level annotations
  const positions = {
    top: {
      x: totalWidth / 2,
      y: -35,
      textAnchor: 'middle',
      arrowPath: null
    },
    topWithArrows: {  // New position type for annotations with bi-directional arrows
      x: totalWidth / 2,
      y: -35,
      textAnchor: 'middle',
      getArrowPaths: (textWidth) => {
        const textStart = totalWidth/2 - textWidth/2;
        const textEnd = totalWidth/2 + textWidth/2;
        const firstCellX = 0;
        const lastCellX = (unitsPerRow - 1) * cellWithPadding + cellSize;
        
        return [
          // Left arrow - straight line with left-facing arrow at start
          `M ${firstCellX},${-20} L ${textStart - 20},${-20}`,
          // Right arrow - straight line with right-facing arrow at end
          `M ${textEnd + 20},${-20} L ${lastCellX},${-20}`
        ];
      }
    }
  };

  const pos = positions[position];

  // Add text annotation
  const textElement = gridGroup.append('text')
    .attr('class', 'grid-annotation')
    .attr('x', pos.x)
    .attr('y', pos.y)
    .attr('text-anchor', pos.textAnchor)
    .style('font-size', '20px')
    .style('fill', color)
    .style('font-weight', 'bold')
    .style('background', 'white')
    .text(text);

  // If using arrows, we need to wait for the text to be rendered to get its width
  if (position === 'topWithArrows') {
    // Get the text width after it's rendered
    const textWidth = textElement.node().getBBox().width;
    const arrowPaths = pos.getArrowPaths(textWidth);
    
    // Add left arrow
    gridGroup.append('path')
      .attr('d', arrowPaths[0])
      .attr('stroke', color)
      .attr('stroke-width', 2.5)
      .attr('fill', 'none')
      .attr('marker-start', `url(#arrowhead-start-${color.replace('#', '')})`);

    // Add right arrow
    gridGroup.append('path')
      .attr('d', arrowPaths[1])
      .attr('stroke', color)
      .attr('stroke-width', 2.5)
      .attr('fill', 'none')
      .attr('marker-end', `url(#arrowhead-${color.replace('#', '')})`);
  }
};

// Create arrow markers for different colors
export const createColoredArrowMarkers = (svg) => {
  // Add birthday colors: 22C55E (green), EAB308 (yellow), 8B5CF6 (purple)
  const colors = ['3B82F6', '8B5CF6', 'EF4444', '10B981', '22C55E', 'EAB308'];
  const defs = svg.append('defs');
  
  colors.forEach(color => {
    // Regular arrow (end)
    defs.append('marker')
      .attr('id', `arrowhead-${color}`)
      .attr('viewBox', '-0 -5 10 10')
      .attr('refX', 8)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 8)
      .attr('markerHeight', 8)
      .attr('xoverflow', 'visible')
      .append('svg:path')
      .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
      .style('fill', `#${color}`);

    // Left arrow (start)
    defs.append('marker')
      .attr('id', `arrowhead-start-${color}`)
      .attr('viewBox', '-0 -5 10 10')
      .attr('refX', 2)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 8)
      .attr('markerHeight', 8)
      .attr('xoverflow', 'visible')
      .append('svg:path')
      .attr('d', 'M 10,-5 L 0 ,0 L 10,5')
      .style('fill', `#${color}`);
  });
};
