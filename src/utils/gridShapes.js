// Import annotation functions
import { addAgeAnnotations } from './annotations';

// Grid shape definitions and utilities
export const shapes = {
  heart: (scale) => `
    M ${0},${4 * scale}
    C ${0},${-4 * scale} ${-10 * scale},${-4 * scale} ${-10 * scale},${2 * scale}
    C ${-10 * scale},${6 * scale} ${0},${12 * scale} ${0},${12 * scale}
    C ${0},${12 * scale} ${10 * scale},${6 * scale} ${10 * scale},${2 * scale}
    C ${10 * scale},${-4 * scale} ${0},${-4 * scale} ${0},${4 * scale}
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
