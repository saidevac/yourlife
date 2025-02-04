// Grid shape definitions and utilities
export const shapes = {
  heart: (scale) => `
    M ${0 * scale},${7 * scale}
    C ${0 * scale},${5 * scale} ${0 * scale},${3 * scale} ${3 * scale},${3 * scale}
    C ${6 * scale},${3 * scale} ${8 * scale},${6 * scale} ${8 * scale},${8 * scale}
    C ${8 * scale},${10 * scale} ${7 * scale},${12 * scale} ${4 * scale},${14 * scale}
    C ${1 * scale},${12 * scale} ${0 * scale},${10 * scale} ${0 * scale},${8 * scale}
    Z
  `,
  square: (scale) => `
    M ${-8 * scale},${-8 * scale}
    L ${8 * scale},${-8 * scale}
    L ${8 * scale},${8 * scale}
    L ${-8 * scale},${8 * scale}
    Z
  `,
  circle: (scale) => `
    M ${0},${-10 * scale}
    A ${10 * scale},${10 * scale} 0 1,1 ${0},${10 * scale}
    A ${10 * scale},${10 * scale} 0 1,1 ${0},${-10 * scale}
    Z
  `,
  diamond: (scale) => `
    M ${0},${-10 * scale}
    L ${10 * scale},${0}
    L ${0},${10 * scale}
    L ${-10 * scale},${0}
    Z
  `,
  hexagon: (scale) => `
    M ${8.66 * scale},${5 * scale}
    L ${0},${10 * scale}
    L ${-8.66 * scale},${5 * scale}
    L ${-8.66 * scale},${-5 * scale}
    L ${0},${-10 * scale}
    L ${8.66 * scale},${-5 * scale}
    Z
  `
};

// Create a grid cell with the specified shape and attributes
export const createGridCell = ({
  d3,
  cell,
  shape,
  scale,
  color,
  defs,
  index,
  defaultColor = '#E5E7EB'
}) => {
  if (typeof color === 'object') {
    const gradientId = `gradient-${index}`;
    const gradient = defs.append('linearGradient')
      .attr('id', gradientId)
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '0%');

    if (color.type === 'multiGradient') {
      // Add initial default color
      gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', defaultColor);

      // Add each color segment
      color.segments.forEach(segment => {
        gradient.append('stop')
          .attr('offset', `${segment.start}%`)
          .attr('stop-color', defaultColor);

        gradient.append('stop')
          .attr('offset', `${segment.start}%`)
          .attr('stop-color', segment.color);

        gradient.append('stop')
          .attr('offset', `${segment.end}%`)
          .attr('stop-color', segment.color);

        gradient.append('stop')
          .attr('offset', `${segment.end}%`)
          .attr('stop-color', defaultColor);
      });

      gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', defaultColor);
    } else {
      gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', color.color);

      gradient.append('stop')
        .attr('offset', `${color.percentage}%`)
        .attr('stop-color', color.color);

      gradient.append('stop')
        .attr('offset', `${color.percentage}%`)
        .attr('stop-color', defaultColor);

      gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', defaultColor);
    }

    cell.attr('fill', `url(#${gradientId})`);
  } else {
    cell.attr('fill', color);
  }

  cell.attr('d', shapes[shape](scale))
    .attr('stroke', '#D1D5DB')
    .attr('stroke-width', 1);
};

// Create arrow markers for annotations
export const createArrowMarkers = (defs) => {
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
};

// Add decade annotation to the grid
export const addDecadeAnnotation = (svg, gridLeftOffset, rowWidth) => {
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
};

// Add birth and age annotations
export const addAgeAnnotations = (gridGroup, lastCellX, lastCellY, cellSize, lifespan) => {
  // Birth annotation
  gridGroup.append('text')
    .attr('class', 'annotation')
    .attr('x', -80)
    .attr('y', cellSize)
    .style('font-size', '14px')
    .style('fill', '#3B82F6')
    .style('font-weight', 'bold')
    .text('Birth');

  gridGroup.append('path')
    .attr('d', `M -40,${cellSize} L -5,${cellSize}`)
    .attr('stroke', '#3B82F6')
    .attr('stroke-width', 2)
    .attr('marker-end', 'url(#arrowhead)');

  // Age annotation
  gridGroup.append('text')
    .attr('class', 'annotation')
    .attr('x', lastCellX + cellSize + 45)
    .attr('y', lastCellY + cellSize)
    .style('font-size', '14px')
    .style('fill', '#8B5CF6')
    .style('font-weight', 'bold')
    .text(`Turning ${lifespan}`);

  gridGroup.append('path')
    .attr('d', `M ${lastCellX + cellSize + 40},${lastCellY + cellSize} L ${lastCellX + cellSize + 5},${lastCellY + cellSize}`)
    .attr('stroke', '#8B5CF6')
    .attr('stroke-width', 2)
    .attr('marker-end', 'url(#arrowhead-purple)');
};
