import { useCallback } from 'react';
import * as d3 from 'd3-color';

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
    
    // Calculate exact years with 1 decimal place
    const yearDiff = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    const dayDiff = today.getDate() - birth.getDate();
    
    let exactYears = yearDiff;
    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
      exactYears--;
    }
    exactYears += monthDiff / 12;
    if (dayDiff < 0) {
      exactYears -= 1/12;
    }
    
    // Round to 1 decimal place
    const yearsLived = Math.round(exactYears * 10) / 10;
    
    let lived = 0;
    let total = 0;
    
    switch (timeUnit) {
      case 'hours':
        lived = Math.round(yearsLived * 365.25 * 24 * 10) / 10;
        total = Math.round(lifespan * 365.25 * 24 * 10) / 10;
        break;
      case 'days':
        lived = Math.round(yearsLived * 365.25 * 10) / 10;
        total = Math.round(lifespan * 365.25 * 10) / 10;
        break;
      case 'weeks':
        lived = Math.round(yearsLived * 52.1775 * 10) / 10;
        total = Math.round(lifespan * 52.1775 * 10) / 10;
        break;
      case 'months':
        lived = Math.round(yearsLived * 12 * 10) / 10;
        total = Math.round(lifespan * 12 * 10) / 10;
        break;
      default: // years
        lived = yearsLived;
        total = lifespan;
    }
    
    const remaining = Math.round((total - lived) * 10) / 10;
    
    return {
      lived,
      remaining,
      total
    };
  }, [birthDate, lifespan, timeUnit]);

  const calculateProgress = useCallback(() => {
    const { lived, total } = calculateBaseProgress();
    const progress = Math.round((lived / total) * 1000) / 10; // Round to 1 decimal place
    return {
      lived,
      remaining: total - lived,
      total,
      progress
    };
  }, [calculateBaseProgress]);

  const calculateActivityPastFutureUnits = useCallback((activity) => {
    const { lived, remaining, total } = calculateBaseProgress();
    const hoursPerDay = activity.hours || 0;
    
    // Calculate proportion of time spent on activity based on time unit
    let activityProportion;
    switch (timeUnit) {
      case 'hours':
        activityProportion = hoursPerDay;
        break;
      case 'days':
        activityProportion = hoursPerDay / 24;
        break;
      case 'weeks':
        activityProportion = (hoursPerDay * 7) / (24 * 7);
        break;
      case 'months':
        activityProportion = (hoursPerDay * 30) / (24 * 30);
        break;
      default: // years
        activityProportion = (hoursPerDay * 365) / (24 * 365);
        break;
    }
    
    // Convert to selected time unit with activity proportion
    const past = Math.round(lived * activityProportion * 10) / 10;
    const future = Math.round(remaining * activityProportion * 10) / 10;

    return { past, future };
  }, [calculateBaseProgress, timeUnit]);

  const getActivityColorForCell = useCallback((index, isLived) => {
    // Ensure activities is an array
    const activityList = Array.isArray(activities) ? activities : [];
    const { lived } = calculateBaseProgress();
    
    // Get all activities that affect this cell (past or future)
    const relevantActivities = activityList.filter(activity => {
      if (isLived) {
        // For lived cells, include activities with past hours
        return activity.spent;
      } else {
        // For future cells, include activities with future hours
        return activity.future;
      }
    });
    
    const cellFills = new Map(); // Track fill percentage for each cell
    const cellColors = new Map(); // Track color info for each cell
    let currentCell = 0;
    // For future cells, adjust the index to be relative to the lived boundary
    const effectiveIndex = isLived ? index : (index - Math.ceil(lived));
    
    if (relevantActivities.length > 0) {
      let remainingUnits = 0;
      
      for (const activity of relevantActivities) {
        // Get both past and future units for this activity
        const { past, future } = calculateActivityPastFutureUnits(activity);
        // Use past for lived cells, future for non-lived cells
        let unitsToFill = isLived ? past : future;
        unitsToFill += remainingUnits;
        
        // Skip if no units to fill for this section
        if (unitsToFill <= 0) continue;
        
        while (unitsToFill > 0) {
          const cellIndex = currentCell;
          const currentFill = cellFills.get(cellIndex) || 0;
          const availableSpace = 1 - currentFill;
          
          if (availableSpace > 0) {
            const fillAmount = Math.min(unitsToFill, availableSpace);
            const newFill = currentFill + fillAmount;
            cellFills.set(cellIndex, newFill);
            
            // Store color info
            if ((isLived && index === cellIndex) || (!isLived && effectiveIndex === cellIndex)) {
              let colorInfo = cellColors.get(cellIndex);
              if (!colorInfo) {
                colorInfo = {
                  segments: []
                };
              }
              
              // Add new color segment
              colorInfo.segments.push({
                color: activity.color,
                start: currentFill * 100,
                end: newFill * 100
              });
              
              cellColors.set(cellIndex, colorInfo);
            }
            
            unitsToFill -= fillAmount;
            if (newFill === 1) {
              currentCell++;
            }
          } else {
            currentCell++;
          }
        }
        
        remainingUnits = Math.max(0, -unitsToFill);
      }
      
      // Return color info for the requested cell
      const targetIndex = isLived ? index : effectiveIndex;
      if (cellColors.has(targetIndex)) {
        const colorInfo = cellColors.get(targetIndex);
        const segments = colorInfo.segments;
        
        if (segments.length === 1) {
          if (segments[0].end === 100) {
            return segments[0].color;
          }
          return {
            type: 'gradient',
            color: segments[0].color,
            percentage: segments[0].end,
            defaultColor: isLived ? '#818CF8' : '#E5E7EB'
          };
        } else if (segments.length > 1) {
          return {
            type: 'multiGradient',
            segments: segments,
            defaultColor: isLived ? '#818CF8' : '#E5E7EB'
          };
        }
      }
    }
    
    // Return default color if no activities affect this cell
    return isLived ? '#818CF8' : '#E5E7EB';
  }, [activities, calculateBaseProgress, calculateActivityPastFutureUnits]);

  const calculateAge = useCallback(() => {
    const today = new Date('2025-01-30'); // Use the provided current time
    const birth = new Date(birthDate);
    
    switch (timeUnit) {
      case 'hours':
        return Math.round((today - birth) / (1000 * 60 * 60) * 10) / 10;
      case 'days':
        return Math.round((today - birth) / (1000 * 60 * 60 * 24) * 10) / 10;
      case 'weeks':
        return Math.round((today - birth) / (1000 * 60 * 60 * 24 * 7) * 10) / 10;
      case 'months':
        return Math.round((today - birth) / (1000 * 60 * 60 * 24 * 30.44) * 10) / 10;
      case 'years':
        return Math.round(getExactYears(birth, today) * 10) / 10;
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
      'days': 0.15,   // 15% of base size
      'weeks': 0.4,   // 40% of base size
      'months': 0.6,  // 60% of base size
      'years': 1      // 100% of base size (no reduction)
    };
    
    // Calculate cell size based on time unit
    const cellSize = Math.max(baseSize * sizeFactors[timeUnit], 6); // minimum 6px
    const padding = cellSize * 0.2;

    switch (timeUnit) {
      case 'hours':
        units = Math.round(lifespan * 365.25 * 24);
        unitsPerRow = 24; // 24 hours per day
        break;
      case 'days':
        units = Math.round(lifespan * 365.25);
        unitsPerRow = 100; // 100 days per row
        break;
      case 'weeks':
        units = Math.round(lifespan * 52);  // Use integer weeks
        unitsPerRow = 52; // One year per row
        break;
      case 'months':
        units = Math.round(lifespan * 12);
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
