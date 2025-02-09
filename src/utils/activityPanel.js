// Create an activity row in the activities panel
export const createActivityRow = (
  activity,
  index,
  activitiesContent,
  {
    handleActivityColorChange,
    handleActivityNameChange,
    handleActivityHoursChange,
    handleActivityTimeUnitChange,
    handleActivitySpentChange,
    handleActivityFutureChange,
    calculateActivityPastFutureUnits,
    formatNumber,
    getTimeUnitSuffix
  }
) => {
  const yOffset = index * 140;
  const row = activitiesContent.append('g')
    .attr('transform', `translate(0, ${yOffset})`);

  // Activity name and color row
  const nameGroup = row.append('g');

  // Color picker
  const colorContainer = nameGroup.append('foreignObject')
    .attr('width', 20)
    .attr('height', 24);

  colorContainer.append('xhtml:input')
    .attr('type', 'color')
    .attr('value', activity.color)
    .style('width', '20px')
    .style('height', '20px')
    .style('padding', '0')
    .style('border', 'none')
    .style('cursor', 'pointer')
    .on('change', function() {
      handleActivityColorChange(activity.id, this.value);
    });

  // Activity name input
  const nameContainer = nameGroup.append('foreignObject')
    .attr('x', 30)
    .attr('width', 160)
    .attr('height', 24);

  nameContainer.append('xhtml:input')
    .attr('type', 'text')
    .attr('value', activity.name)
    .style('width', '100%')
    .style('font-size', '14px')
    .style('border', 'none')
    .style('background', 'transparent')
    .style('outline', 'none')
    .style('color', '#1F2937')
    .on('change', function() {
      handleActivityNameChange(activity.id, this.value);
    });

  // Hours input and unit selector on second row
  const configGroup = row.append('g')
    .attr('transform', 'translate(30, 32)');

  const hoursContainer = configGroup.append('foreignObject')
    .attr('width', 50)
    .attr('height', 24);

  hoursContainer.append('xhtml:input')
    .attr('type', 'number')
    .attr('min', '0')
    .attr('max', '24')
    .attr('step', '0.5')
    .attr('value', activity.hours)
    .style('width', '100%')
    .style('font-size', '13px')
    .style('border', '1px solid #D1D5DB')
    .style('border-radius', '4px')
    .style('padding', '1px 4px')
    .on('change', function() {
      const value = parseFloat(this.value) || 0;
      const rounded = Math.round(value * 2) / 2;
      handleActivityHoursChange(activity.id, Math.min(24, Math.max(0, rounded)));
    });

  // Add hrs/ label
  configGroup.append('text')
    .attr('x', 55)
    .attr('y', 16)
    .style('font-size', '13px')
    .style('fill', '#4B5563')
    .text('hrs/');

  const unitContainer = configGroup.append('foreignObject')
    .attr('x', 80)
    .attr('width', 70)
    .attr('height', 24);

  const unitSelect = unitContainer.append('xhtml:select')
    .style('width', '100%')
    .style('font-size', '13px')
    .style('border', '1px solid #D1D5DB')
    .style('border-radius', '4px')
    .style('padding', '1px 4px')
    .on('change', function() {
      handleActivityTimeUnitChange(activity.id, this.value);
    });

  ['day', 'week', 'month', 'year'].forEach(unit => {
    unitSelect.append('xhtml:option')
      .attr('value', unit)
      .property('selected', activity.timeUnit === unit)
      .text(unit);
  });

  // Past checkbox and value on third row
  const pastGroup = row.append('g')
    .attr('transform', 'translate(30, 64)');

  const pastContainer = pastGroup.append('foreignObject')
    .attr('width', 60)
    .attr('height', 16);

  const pastLabel = pastContainer.append('xhtml:label')
    .style('display', 'flex')
    .style('align-items', 'center')
    .style('gap', '4px')
    .style('font-size', '13px')
    .style('color', '#4B5563');

  pastLabel.append('xhtml:input')
    .attr('type', 'checkbox')
    .property('checked', activity.spent)
    .on('change', function() {
      handleActivitySpentChange(activity.id, this.checked);
    });

  pastLabel.append('xhtml:span')
    .text('Past');

  // Past hours with unit display
  const { pastInCurrentUnit, futureInCurrentUnit, totalInCurrentUnit } = calculateActivityPastFutureUnits(activity);
  pastGroup.append('text')
    .attr('x', 80)
    .attr('y', 12)
    .style('font-size', '13px')
    .style('fill', activity.spent ? '#1F2937' : '#6B7280')
    .text(`${formatNumber(pastInCurrentUnit)} ${getTimeUnitSuffix(pastInCurrentUnit)}`);

  // Future checkbox and value on fourth row
  const futureGroup = row.append('g')
    .attr('transform', 'translate(30, 88)');

  const futureContainer = futureGroup.append('foreignObject')
    .attr('width', 60)
    .attr('height', 16);

  const futureLabel = futureContainer.append('xhtml:label')
    .style('display', 'flex')
    .style('align-items', 'center')
    .style('gap', '4px')
    .style('font-size', '13px')
    .style('color', '#4B5563');

  futureLabel.append('xhtml:input')
    .attr('type', 'checkbox')
    .property('checked', activity.future)
    .on('change', function() {
      handleActivityFutureChange(activity.id, this.checked);
    });

  futureLabel.append('xhtml:span')
    .text('Future');

  // Future hours with unit display
  futureGroup.append('text')
    .attr('x', 80)
    .attr('y', 12)
    .style('font-size', '13px')
    .style('fill', activity.future ? '#1F2937' : '#6B7280')
    .text(`${formatNumber(futureInCurrentUnit)} ${getTimeUnitSuffix(futureInCurrentUnit)}`);

  // Total (always show)
  const totalGroup = row.append('g')
    .attr('transform', 'translate(30, 112)');

  totalGroup.append('text')
    .attr('y', 12)
    .style('font-size', '13px')
    .style('fill', '#1F2937')
    .text('Total:');

  totalGroup.append('text')
    .attr('x', 80)
    .attr('y', 12)
    .style('font-size', '13px')
    .style('fill', '#1F2937')
    .text(`${formatNumber(totalInCurrentUnit)} ${getTimeUnitSuffix(totalInCurrentUnit)}`);
};
