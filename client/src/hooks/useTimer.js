import { useState, useEffect, useRef, useCallback } from 'react';

export function useTimer(initialSeconds = 45, onTimeout = null) {
  const [timeRemaining, setTimeRemaining] = useState(initialSeconds * 1000);
  const timerIntervalRef = useRef(null);
  const onTimeoutRef = useRef(onTimeout);

  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  }, [onTimeout]);

  const pauseTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);

  const resumeTimer = useCallback(() => {
    if (timerIntervalRef.current) return;
    
    timerIntervalRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        const next = prev - 100;
        if (next <= 0) {
          pauseTimer();
          if (onTimeoutRef.current) onTimeoutRef.current();
          return 0;
        }
        return next;
      });
    }, 100);
  }, [pauseTimer]);

  const applyPenalty = useCallback((penaltySeconds) => {
    setTimeRemaining(prev => {
      const next = prev - (penaltySeconds * 1000);
      if (next <= 0) {
        pauseTimer();
        if (onTimeoutRef.current) onTimeoutRef.current();
        return 0;
      }
      return next;
    });
  }, [pauseTimer]);

  const resetTimer = useCallback((seconds) => {
    setTimeRemaining(seconds * 1000);
  }, []);

  useEffect(() => {
    return () => pauseTimer();
  }, [pauseTimer]);

  return { timeRemaining, pauseTimer, resumeTimer, applyPenalty, resetTimer };
}
