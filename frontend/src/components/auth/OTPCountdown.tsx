'use client';

import { useState, useEffect, useCallback } from 'react';

interface OTPCountdownProps {
  seconds?: number;
  onExpire: () => void;
  onResend: () => void;
  isResending?: boolean;
}

export default function OTPCountdown({ seconds = 60, onExpire, onResend, isResending = false }: OTPCountdownProps) {
  const [secondsLeft, setSecondsLeft] = useState(seconds);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (secondsLeft <= 0) {
      setIsExpired(true);
      onExpire();
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft, onExpire]);

  const handleResend = useCallback(() => {
    onResend();
    setSecondsLeft(seconds);
    setIsExpired(false);
  }, [onResend, seconds]);

  const progress = (secondsLeft / seconds) * 100;
  const minutes = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;

  return (
    <div className="w-full space-y-3">
      {/* Progress bar */}
      <div className="w-full h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-linear"
          style={{
            width: `${progress}%`,
            backgroundColor: secondsLeft > 15 ? '#7A8EC0' : secondsLeft > 5 ? '#D97706' : '#DC2626',
          }}
        />
      </div>

      {/* Timer text */}
      <div className="flex items-center justify-between text-sm">
        <span className={`${isExpired ? 'text-[#DC2626]' : 'text-[#6B7280]'}`}>
          {isExpired ? 'Code expired' : `Code expires in ${minutes}:${secs.toString().padStart(2, '0')}`}
        </span>

        <div className="flex items-center gap-1">
          <span className="text-[#6B7280]">Didn&apos;t receive a code?</span>
          <button
            onClick={handleResend}
            disabled={!isExpired || isResending}
            className={`font-medium transition-colors ${
              isExpired && !isResending
                ? 'text-[#7A8EC0] hover:text-[#6A7EB0] cursor-pointer'
                : 'text-[#9CA3AF] cursor-not-allowed'
            }`}
          >
            {isResending ? 'Sending...' : 'Resend code'}
          </button>
        </div>
      </div>
    </div>
  );
}
