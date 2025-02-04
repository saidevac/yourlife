import { createGridCell, createArrowMarkers, addDecadeAnnotation, addAgeAnnotations } from './gridShapes';

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
  gridLeftOffset = 0
}) => {
  const { units, unitsPerRow, rows, cellSize, padding } = calculateTimeUnits();
  const gridWidth = (cellSize + padding) * unitsPerRow;

  svg.selectAll('*').remove();

  // Create defs for gradients and markers
  const defs = svg.append('defs');
  if (timeUnit === 'years') {
    createArrowMarkers(defs);
  }

  // Create grid group
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
    .attr('data-index', (d, i) => i)
    .each(function(d) {
      const cell = d3.select(this);
      const isLived = d < progress.lived;
      const color = getActivityColorForCell(d, isLived);

      createGridCell({
        d3,
        cell,
        shape: currentShape,
        scale: 1,
        color,
        defs,
        index: d
      });
    });

  // Add hover effects
  cells.on('mouseover', function(event, d) {
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
    addDecadeAnnotation(svg, gridLeftOffset, gridWidth);

    // Calculate last cell position for age annotation
    const lastCellX = ((units - 1) % unitsPerRow) * (cellSize + padding);
    const lastCellY = Math.floor((units - 1) / unitsPerRow) * (cellSize + padding);
    addAgeAnnotations(gridGroup, lastCellX, lastCellY, cellSize, lifespan);
  }

  return {
    gridGroup,
    gridWidth,
    gridHeight: (cellSize + padding) * rows
  };
};
