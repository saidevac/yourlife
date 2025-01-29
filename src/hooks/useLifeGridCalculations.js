import { useCallback } from 'react';

export const useLifeGridCalculations = (birthDate, lifespan, timeUnit, activities, windowWidth) => {
  const calculateBaseProgress = useCallback(() => {
    const today = new Date();
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
        const monthDiff = (today.getFullYear() - birth.getFullYear()) * 12 + today.getMonth() - birth.getMonth();
        lived = monthDiff;
        total = lifespan * 12;
        remaining = total - lived;
        break;
      default: // years
        lived = today.getFullYear() - birth.getFullYear();
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

    // Ensure activities is an array
    const activityList = Array.isArray(activities) ? activities : [];
    
    // Calculate extra time needed for activities
    const pastActivities = activityList.filter(a => a.spent);
    const futureActivities = activityList.filter(a => a.future);
    
    const totalPastHours = pastActivities.reduce((sum, a) => sum + (a.hoursPerDay || 0), 0);
    const totalFutureHours = futureActivities.reduce((sum, a) => sum + (a.hoursPerDay || 0), 0);
    
    // Adjust lived and remaining based on activities
    let adjustedLived = lived;
    let adjustedRemaining = remaining;
    
    if (totalPastHours > 0) {
      adjustedLived = lived * (totalPastHours / 24);
    }
    
    if (totalFutureHours > 0) {
      adjustedRemaining = remaining * (totalFutureHours / 24);
    }
    
    return {
      lived: adjustedLived,
      remaining: adjustedRemaining,
      total,
      progress
    };
  }, [calculateBaseProgress, activities]);

  const calculateActivityPastFutureUnits = useCallback((activity) => {
    const { total, lived, remaining } = calculateProgress();
    
    const hoursInDay = 24;
    const proportion = (activity.hoursPerDay || 0) / hoursInDay;
    
    return {
      total: total * proportion,
      past: (activity.spent ? lived : 0) * proportion,
      future: (activity.future ? remaining : 0) * proportion
    };
  }, [calculateProgress]);

  const getActivityColorForCell = useCallback((index, isLived) => {
    if (!isLived) return '#E5E7EB';

    // Ensure activities is an array
    const activityList = Array.isArray(activities) ? activities : [];
    
    // Find past activities
    const pastActivities = activityList.filter(a => a.spent);
    if (pastActivities.length === 0) return '#3B82F6';

    // Calculate total hours for past activities
    const totalHours = pastActivities.reduce((sum, a) => sum + (a.hoursPerDay || 0), 0);
    if (totalHours === 0) return '#3B82F6';

    // Get random activity weighted by hours
    const random = Math.random() * totalHours;
    let sum = 0;
    for (const activity of pastActivities) {
      sum += activity.hoursPerDay || 0;
      if (random <= sum) {
        return activity.color;
      }
    }

    return '#3B82F6';
  }, [activities]);

  const calculateAge = useCallback(() => {
    const today = new Date();
    const birth = new Date(birthDate);
    const diffTime = today - birth;
    
    switch (timeUnit) {
      case 'hours':
        return Math.floor(diffTime / (1000 * 60 * 60));
      case 'days':
        return Math.floor(diffTime / (1000 * 60 * 60 * 24));
      case 'weeks':
        return Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
      case 'months':
        return Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30.44));
      case 'years':
        return Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365.25));
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
