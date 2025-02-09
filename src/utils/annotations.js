// Annotation functions for the life grid

export const addAgeAnnotations = (gridGroup, lastCellX, lastCellY, cellSize, lifespan) => {
  gridGroup.append('text')
    .attr('class', 'annotation')
    .attr('x', -80)
    .attr('y', cellSize/2)
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
  const ageText = gridGroup.append('text')
    .attr('class', 'annotation')
    .attr('x', lastCellX + cellSize + 45)
    .attr('y', lastCellY + cellSize - 8)  // Move up to account for two lines
    .style('font-size', '14px')
    .style('fill', '#8B5CF6')
    .style('font-weight', 'bold')
    .style('text-anchor', 'start');  // Ensure text aligns consistently

  // First line: "Turning"
  ageText.append('tspan')
    .attr('x', lastCellX + cellSize + 45)
    .text('Turning');

  // Second line: lifespan number
  ageText.append('tspan')
    .attr('x', lastCellX + cellSize + 45)
    .attr('dy', '1.1em')  // Add vertical spacing between lines
    .text(lifespan);

  // Add arrow
  gridGroup.append('path')
    .attr('d', `M ${lastCellX + cellSize + 40},${lastCellY + cellSize} L ${lastCellX + cellSize + 5},${lastCellY + cellSize}`)
    .attr('stroke', '#8B5CF6')
    .attr('stroke-width', 2)
    .attr('marker-end', 'url(#arrowhead-purple)');
};
