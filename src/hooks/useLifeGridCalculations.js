import { useCallback } from 'react';

export const useLifeGridCalculations = (birthDate, lifespan, timeUnit, activities, windowWidth) => {
  // Helper function to calculate exact years between dates
  const getExactYears = (start, end) => {
    const yearDiff = end.getFullYear() - start.getFullYear();
    const monthDiff = end.getMonth() - start.getMonth();
    const dayDiff = end.getDate() - start.getDate();
    
    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
      return yearDiff - 1;
    }
    return yearDiff;
  };

  const calculateBaseProgress = useCallback(() => {
    const today = new Date('2025-01-30'); // Use the provided current time
    const birth = new Date(birthDate);
    
    let lived = 0;
    let remaining = 0;
    let total = 0;
    
    switch (timeUnit) {
      case 'hours':
        lived = Math.floor((today - birth) / (1000 * 60 * 60));
        total = lifespan * 365 * 24;
        remaining = total - lived;
        break;
      case 'days':
        lived = Math.floor((today - birth) / (1000 * 60 * 60 * 24));
        total = lifespan * 365;
        remaining = total - lived;
        break;
      case 'weeks':
        lived = Math.floor((today - birth) / (1000 * 60 * 60 * 24 * 7));
        total = Math.ceil(lifespan * 52.143);
        remaining = total - lived;
        break;
      case 'months':
        const yearDiff = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        lived = yearDiff * 12 + monthDiff;
        if (today.getDate() < birth.getDate()) {
          lived--;
        }
        total = lifespan * 12;
        remaining = total - lived;
        break;
      default: // years
        lived = getExactYears(birth, today);
        total = lifespan;
        remaining = total - lived;
    }
    
    return {
      lived: Math.max(0, lived),
      remaining: Math.max(0, remaining),
      total
    };
  }, [birthDate, lifespan, timeUnit]);

  const calculateProgress = useCallback(() => {
    const { lived, remaining, total } = calculateBaseProgress();
    const progress = (lived / total) * 100;

    return {
      lived,
      remaining,
      total,
      progress
    };
  }, [calculateBaseProgress]);

  const calculateActivityPastFutureUnits = useCallback((activity) => {
    const { total, lived, remaining } = calculateProgress();
    
    const hoursInDay = 24;
    const proportion = (activity.hoursPerDay || 0) / hoursInDay;
    
    // Always calculate both past and future units regardless of selection
    return {
      total: total * proportion,
      past: lived * proportion,
      future: remaining * proportion
    };
  }, [calculateProgress]);

  const getActivityColorForCell = useCallback((index, isLived) => {
    // Ensure activities is an array
    const activityList = Array.isArray(activities) ? activities : [];
    const progress = calculateProgress();
    
    if (isLived) {
      // Handle past cells
      const pastActivities = activityList.filter(a => a.spent);
      
      // Calculate total hours for past activities
      const totalHours = pastActivities.reduce((sum, a) => sum + (a.hoursPerDay || 0), 0);
      
      // If there are selected past activities
      if (pastActivities.length > 0 && totalHours > 0) {
        // Calculate how many cells should be colored for activities
        const hoursPerDay = 24;
        const activityProportion = totalHours / hoursPerDay;
        const activityCells = progress.lived * activityProportion;
        const fullCells = Math.floor(activityCells);
        
        // Calculate which activity and what portion of it belongs in this cell
        const cellHourStart = (index / progress.lived) * hoursPerDay;
        const cellHourEnd = ((index + 1) / progress.lived) * hoursPerDay;
        
        let currentHour = 0;
        let gradientStops = [];
        
        // Find which activities fall within this cell's hour range
        for (const activity of pastActivities) {
          const activityStart = currentHour;
          const activityEnd = currentHour + (activity.hoursPerDay || 0);
          
          // Check if this activity overlaps with the current cell
          if (activityEnd > cellHourStart && activityStart < cellHourEnd) {
            const startPercent = Math.max(0, (activityStart - cellHourStart) / (cellHourEnd - cellHourStart) * 100);
            const endPercent = Math.min(100, (activityEnd - cellHourStart) / (cellHourEnd - cellHourStart) * 100);
            
            gradientStops.push({
              color: activity.color,
              startPercent,
              endPercent
            });
          }
          
          currentHour = activityEnd;
        }
        
        // If we have gradient stops, return them
        if (gradientStops.length > 0) {
          return {
            type: 'gradient',
            stops: gradientStops,
            defaultColor: '#3B82F6'
          };
        }
      }
      
      // Default blue for lived cells that aren't part of an activity
      return '#3B82F6';
    } else {
      // Handle future cells
      const futureActivities = activityList.filter(a => a.future);
      
      // Calculate total hours for future activities
      const totalHours = futureActivities.reduce((sum, a) => sum + (a.hoursPerDay || 0), 0);
      
      // If there are selected future activities
      if (futureActivities.length > 0 && totalHours > 0) {
        // Calculate how many cells should be colored for activities
        const hoursPerDay = 24;
        const activityProportion = totalHours / hoursPerDay;
        const activityCells = progress.remaining * activityProportion;
        const remainingIndex = index - progress.lived;
        
        // Calculate which activity and what portion of it belongs in this cell
        const cellHourStart = (remainingIndex / progress.remaining) * hoursPerDay;
        const cellHourEnd = ((remainingIndex + 1) / progress.remaining) * hoursPerDay;
        
        let currentHour = 0;
        let gradientStops = [];
        
        // Find which activities fall within this cell's hour range
        for (const activity of futureActivities) {
          const activityStart = currentHour;
          const activityEnd = currentHour + (activity.hoursPerDay || 0);
          
          // Check if this activity overlaps with the current cell
          if (activityEnd > cellHourStart && activityStart < cellHourEnd) {
            const startPercent = Math.max(0, (activityStart - cellHourStart) / (cellHourEnd - cellHourStart) * 100);
            const endPercent = Math.min(100, (activityEnd - cellHourStart) / (cellHourEnd - cellHourStart) * 100);
            
            gradientStops.push({
              color: activity.color,
              startPercent,
              endPercent
            });
          }
          
          currentHour = activityEnd;
        }
        
        // If we have gradient stops, return them
        if (gradientStops.length > 0) {
          return {
            type: 'gradient',
            stops: gradientStops,
            defaultColor: '#E5E7EB'
          };
        }
      }
      
      // Default gray for future cells that aren't part of an activity
      return '#E5E7EB';
    }
  }, [activities, calculateProgress]);

  const calculateAge = useCallback(() => {
    const today = new Date('2025-01-30'); // Use the provided current time
    const birth = new Date(birthDate);
    
    switch (timeUnit) {
      case 'hours':
        return Math.floor((today - birth) / (1000 * 60 * 60));
      case 'days':
        return Math.floor((today - birth) / (1000 * 60 * 60 * 24));
      case 'weeks':
        return Math.floor((today - birth) / (1000 * 60 * 60 * 24 * 7));
      case 'months':
        return Math.floor((today - birth) / (1000 * 60 * 60 * 24 * 30.44));
      case 'years':
        return getExactYears(birth, today);
      default:
        return 0;
    }
  }, [birthDate, timeUnit]);

  const calculateTimeUnits = useCallback(() => {
    let units, unitsPerRow;
    
    // Calculate base cell size for years view
    const baseSize = Math.min(Math.max(windowWidth / 40, 20), 40);
    
    // Define size reduction factors for each time unit
    const sizeFactors = {
      'hours': 0.2,   // 20% of base size
      'days': 0.3,    // 30% of base size
      'weeks': 0.4,   // 40% of base size
      'months': 0.6,  // 60% of base size
      'years': 1      // 100% of base size (no reduction)
    };
    
    // Calculate cell size based on time unit
    const cellSize = Math.max(baseSize * sizeFactors[timeUnit], 8); // minimum 8px
    const padding = cellSize * 0.2;

    switch (timeUnit) {
      case 'hours':
        units = lifespan * 365 * 24;
        unitsPerRow = 24; // 24 hours per day
        break;
      case 'days':
        units = lifespan * 365;
        unitsPerRow = 30; // Roughly a month per row
        break;
      case 'weeks':
        units = Math.ceil(lifespan * 52.143);
        unitsPerRow = 52; // One year per row
        break;
      case 'months':
        units = lifespan * 12;
        unitsPerRow = 36; // Three years per row
        break;
      default: // years
        units = lifespan;
        unitsPerRow = 10; // One decade per row
    }

    const rows = Math.ceil(units / unitsPerRow);

    return {
      units,
      unitsPerRow,
      rows,
      cellSize,
      padding
    };
  }, [timeUnit, windowWidth, lifespan]);

  return {
    calculateBaseProgress,
    calculateProgress,
    calculateAge,
    calculateActivityPastFutureUnits,
    calculateTimeUnits,
    getActivityColorForCell
  };
};
