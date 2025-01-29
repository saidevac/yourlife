import { useCallback } from 'react';

export const useLifeGridCalculations = (birthDate, lifespan, activities, timeUnit, windowWidth) => {
  const calculateBaseProgress = useCallback(() => {
    const birthDateTime = new Date(birthDate);
    const now = new Date('2025-01-28T18:08:03+11:00');
    const lived = Math.floor((now - birthDateTime) / (1000 * 60 * 60 * 24));
    const totalDays = lifespan * 365;

    // Calculate future activities impact
    const futureActivities = activities.filter(a => a.future);
    const totalFutureHours = futureActivities.reduce((sum, a) => sum + a.hoursPerDay, 0);
    const extraDays = totalFutureHours > 24 ? Math.ceil((totalDays - lived) * (totalFutureHours / 24 - 1)) : 0;
    const adjustedTotalDays = totalDays + extraDays;

    return {
      lived,
      totalDays: adjustedTotalDays,
      hasExtraDays: extraDays > 0
    };
  }, [birthDate, lifespan, activities]);

  const calculateProgress = useCallback(() => {
    const { lived, totalDays, hasExtraDays } = calculateBaseProgress();
    const baseDays = lifespan * 365;

    let units;
    switch (timeUnit) {
      case 'hours':
        units = {
          lived: lived * 24,
          remaining: (totalDays - lived) * 24,
          total: totalDays * 24
        };
        break;
      case 'days':
        units = {
          lived,
          remaining: totalDays - lived,
          total: totalDays
        };
        break;
      case 'weeks':
        units = {
          lived: Math.floor(lived / 7),
          remaining: Math.ceil((totalDays - lived) / 7),
          total: Math.ceil(totalDays / 7)
        };
        break;
      case 'months':
        units = {
          lived: Math.floor(lived / 30),
          remaining: Math.ceil((totalDays - lived) / 30),
          total: Math.ceil(totalDays / 30)
        };
        break;
      default: // years
        units = {
          lived: Math.floor(lived / 365),
          remaining: Math.ceil((totalDays - lived) / 365),
          total: Math.ceil(totalDays / 365)
        };
    }

    // Calculate progress based on original lifespan if no extra days
    const progress = Math.min(100, Math.round((lived / (hasExtraDays ? totalDays : baseDays)) * 100));

    return {
      ...units,
      progress
    };
  }, [timeUnit, calculateBaseProgress, lifespan, activities]);

  const calculateActivityPastFutureUnits = useCallback((activity) => {
    const progress = calculateProgress();
    const hoursPerDay = activity.hoursPerDay;
    const proportionOfDay = Math.min(1, hoursPerDay / 24);
    
    const past = Math.ceil(progress.lived * proportionOfDay * 10) / 10;
    const future = Math.ceil(progress.remaining * proportionOfDay * 10) / 10;
    
    return {
      past,
      future,
      total: past + future
    };
  }, [calculateProgress]);

  const getActivityColorForCell = useCallback((cellIndex, isLived) => {
    const progress = calculateProgress();
    
    if (isLived && cellIndex >= progress.lived) return '#E5E7EB';
    if (!isLived && cellIndex < progress.lived) return '#3B82F6';
    
    const activeActivities = activities.filter(activity => 
      (isLived && activity.spent) || (!isLived && activity.future)
    );
    
    let currentPosition = isLived ? 0 : progress.lived;
    
    for (const activity of activeActivities) {
      const units = calculateActivityPastFutureUnits(activity);
      const activityUnits = isLived ? units.past : units.future;
      const endPosition = currentPosition + activityUnits;
      
      if (cellIndex >= currentPosition && cellIndex < endPosition) {
        return activity.color;
      }
      
      currentPosition = endPosition;
    }
    
    return isLived ? '#3B82F6' : '#E5E7EB';
  }, [activities, calculateProgress, calculateActivityPastFutureUnits]);

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
    const { total } = calculateProgress();
    
    const maxUnitsPerRow = Math.floor((windowWidth * 0.95 - 40) / 30);
    const unitsPerRow = Math.min(maxUnitsPerRow, total);
    const rows = Math.ceil(total / unitsPerRow);
    const cellSize = Math.min(25, (windowWidth * 0.95 - 40) / unitsPerRow - 5);
    const padding = 5;

    return {
      units: total,
      unitsPerRow,
      rows,
      cellSize,
      padding
    };
  }, [windowWidth, calculateProgress]);

  return {
    calculateBaseProgress,
    calculateProgress,
    calculateAge,
    calculateActivityPastFutureUnits,
    calculateTimeUnits,
    getActivityColorForCell
  };
};
