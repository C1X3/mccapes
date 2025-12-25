"use client";

import { useEffect, useState, useMemo } from "react";

export default function ChristmasSaleModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const snowflakes = useMemo(() => {
    return [...Array(50)].map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      animationDuration: `${10 + Math.random() * 10}s`,
      animationDelay: `${Math.random() * 5}s`,
      fontSize: `${20 + Math.random() * 30}px`,
      opacity: 0.3 + Math.random() * 0.7,
    }));
  }, []);

  useEffect(() => {
    const hasSeenModal = sessionStorage.getItem("christmas-modal-seen");
    if (!hasSeenModal) {
      setIsOpen(true);
    }

    const calculateTimeLeft = () => {
      const now = new Date();
      const est = new Date(
        now.toLocaleString("en-US", { timeZone: "America/New_York" })
      );

      const midnight = new Date(est);
      midnight.setHours(24, 0, 0, 0);

      const difference = midnight.getTime() - est.getTime();

      if (difference > 0) {
        return {
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        };
      }

      return { hours: 0, minutes: 0, seconds: 0 };
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    sessionStorage.setItem("christmas-modal-seen", "true");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      <div className="christmas-snowflakes">
        {snowflakes.map((flake) => (
          <div
            key={flake.id}
            className="snowflake"
            style={{
              left: flake.left,
              animationDuration: flake.animationDuration,
              animationDelay: flake.animationDelay,
              fontSize: flake.fontSize,
              opacity: flake.opacity,
            }}
          >
            ❄
          </div>
        ))}
      </div>

      <div className="relative z-10 w-full max-w-lg mx-4 bg-gradient-to-br from-red-600 via-red-700 to-green-700 p-1 rounded-2xl shadow-2xl">
        <div className="bg-white rounded-2xl p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-red-100/50 to-transparent pointer-events-none" />

          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl font-bold z-10 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            ×
          </button>

          <div className="space-y-4">
            <h2 className="text-4xl font-bold text-red-600 drop-shadow-lg">
              Christmas Sale
            </h2>

            <div className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-green-600 to-red-600 drop-shadow-2xl animate-pulse-slow">
              40% OFF
            </div>

            <div className="bg-gradient-to-r from-red-50 to-green-50 rounded-xl p-6 shadow-inner">
              <p className="text-sm font-medium text-gray-600 mb-3">
                Time Remaining
              </p>
              <div className="flex justify-center gap-4">
                <div className="bg-white rounded-lg px-4 py-3 shadow-lg min-w-[80px]">
                  <div className="text-4xl font-bold text-red-600">
                    {String(timeLeft.hours).padStart(2, "0")}
                  </div>
                  <div className="text-xs font-medium text-gray-500 uppercase mt-1">
                    Hours
                  </div>
                </div>
                <div className="bg-white rounded-lg px-4 py-3 shadow-lg min-w-[80px]">
                  <div className="text-4xl font-bold text-green-600">
                    {String(timeLeft.minutes).padStart(2, "0")}
                  </div>
                  <div className="text-xs font-medium text-gray-500 uppercase mt-1">
                    Minutes
                  </div>
                </div>
                <div className="bg-white rounded-lg px-4 py-3 shadow-lg min-w-[80px]">
                  <div className="text-4xl font-bold text-red-600">
                    {String(timeLeft.seconds).padStart(2, "0")}
                  </div>
                  <div className="text-xs font-medium text-gray-500 uppercase mt-1">
                    Seconds
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="w-full bg-gradient-to-r from-red-600 to-green-600 hover:from-red-700 hover:to-green-700 text-white font-bold py-4 px-8 rounded-xl text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200"
            >
              Shop Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

