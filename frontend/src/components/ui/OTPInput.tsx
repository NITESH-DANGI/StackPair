'use client';

import { useRef, useState, useCallback, useEffect, KeyboardEvent, ClipboardEvent } from 'react';

interface OTPInputProps {
  length?: number;
  onComplete: (otp: string) => void;
  disabled?: boolean;
  error?: boolean;
}

export default function OTPInput({ length = 6, onComplete, disabled = false, error = false }: OTPInputProps) {
  const [values, setValues] = useState<string[]>(new Array(length).fill(''));
  const [animatingIndex, setAnimatingIndex] = useState<number | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>(new Array(length).fill(null));

  useEffect(() => {
    // Auto-focus first input on mount
    inputRefs.current[0]?.focus();
  }, []);

  const triggerAnimation = (index: number) => {
    setAnimatingIndex(index);
    setTimeout(() => setAnimatingIndex(null), 150);
  };

  const handleChange = useCallback((index: number, value: string) => {
    if (disabled) return;
    
    const digit = value.replace(/[^0-9a-zA-Z]/g, '').slice(-1);
    
    const newValues = [...values];
    newValues[index] = digit;
    setValues(newValues);

    if (digit) {
      triggerAnimation(index);
      
      // Auto-advance to next cell
      if (index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      }

      // Check if all cells filled → auto-submit
      const otp = newValues.join('');
      if (otp.length === length && !newValues.includes('')) {
        onComplete(otp);
      }
    }
  }, [values, length, onComplete, disabled]);

  const handleKeyDown = useCallback((index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;
    
    if (e.key === 'Backspace') {
      if (!values[index] && index > 0) {
        // If current cell is empty, move to previous cell and clear it
        const newValues = [...values];
        newValues[index - 1] = '';
        setValues(newValues);
        inputRefs.current[index - 1]?.focus();
      } else {
        const newValues = [...values];
        newValues[index] = '';
        setValues(newValues);
      }
      e.preventDefault();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }, [values, length, disabled]);

  const handlePaste = useCallback((e: ClipboardEvent<HTMLInputElement>) => {
    if (disabled) return;
    e.preventDefault();

    const pastedData = e.clipboardData.getData('text').replace(/[^0-9a-zA-Z]/g, '').slice(0, length);
    
    if (pastedData.length > 0) {
      const newValues = [...values];
      for (let i = 0; i < pastedData.length; i++) {
        newValues[i] = pastedData[i];
      }
      setValues(newValues);

      // Focus the cell after the last pasted digit
      const focusIndex = Math.min(pastedData.length, length - 1);
      inputRefs.current[focusIndex]?.focus();

      // If all cells filled, auto-submit
      if (pastedData.length === length) {
        onComplete(pastedData);
      }
    }
  }, [values, length, onComplete, disabled]);

  const clearAll = useCallback(() => {
    setValues(new Array(length).fill(''));
    inputRefs.current[0]?.focus();
  }, [length]);

  // Expose clearAll for parent components
  useEffect(() => {
    if (error) {
      clearAll();
    }
  }, [error, clearAll]);

  return (
    <div className="flex gap-3 justify-center" role="group" aria-label="OTP verification code">
      {values.map((value, index) => (
        <input
          key={index}
          ref={(el) => { inputRefs.current[index] = el; }}
          type="text"
          inputMode="text"
          pattern="[0-9a-zA-Z]*"
          maxLength={1}
          value={value}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          disabled={disabled}
          aria-label={`OTP digit ${index + 1} of ${length}`}
          className={`
            w-12 h-14 text-center text-xl font-semibold rounded-xl
            border-2 transition-all duration-200 outline-none
            ${disabled 
              ? 'bg-[#F3F4F6] border-[#E5E5E3] text-[#9CA3AF] cursor-not-allowed' 
              : error 
                ? 'border-[#DC2626] bg-[#FEE2E2] text-[#DC2626]' 
                : value 
                  ? 'border-[#7A8EC0] bg-white text-[#1A1A1A]' 
                  : 'border-[#E5E5E3] bg-white text-[#1A1A1A] hover:border-[#D4D4D0] focus:border-[#7A8EC0]'
            }
            ${animatingIndex === index ? 'otp-cell-pop' : ''}
          `}
        />
      ))}
    </div>
  );
}
