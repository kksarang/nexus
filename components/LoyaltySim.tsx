"use client";

import { Lock, Trophy } from "lucide-react";
import { useId, useState } from "react";
import { POINT_MINUTES, REWARD_MINUTES, WEEKLY_TARGET } from "@/lib/loyalty";

export function LoyaltySim() {
  const inputId = useId();
  const [hours, setHours] = useState(6);
  const points = Math.floor((hours * 60) / POINT_MINUTES);
  const unlocked = points >= WEEKLY_TARGET;
  const Icon = unlocked ? Trophy : Lock;

  return (
    <div className={`panel p-5 sm:p-8 ${unlocked ? "panel-featured" : ""}`}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <label htmlFor={inputId} className="font-display text-sm tracking-[0.16em] text-cyan uppercase">
          Try it: paid hours this week
        </label>
        <p data-points className="font-tech text-2xl text-paper">
          {Math.min(points, WEEKLY_TARGET)}/{WEEKLY_TARGET} XP
        </p>
      </div>
      <input
        id={inputId}
        type="range"
        min={0}
        max={WEEKLY_TARGET + 2}
        value={hours}
        onChange={(event) => setHours(Number(event.target.value))}
        className="mt-4 w-full accent-magenta"
        aria-valuetext={`${hours} hours, ${points} points`}
      />
      <div className="mt-4 flex items-center gap-3">
        <div className="grid flex-1 gap-1.5 px-1" style={{ gridTemplateColumns: `repeat(${WEEKLY_TARGET}, minmax(0, 1fr))` }} aria-hidden="true">
          {Array.from({ length: WEEKLY_TARGET }, (_, cell) => (
            <span key={cell} className={`xp-cell ${cell < points ? "" : "is-empty"}`} />
          ))}
        </div>
        <Icon size={22} className={`shrink-0 ${unlocked ? "text-magenta" : "text-mist"}`} aria-hidden="true" />
      </div>
      <p className="mt-4 text-sm text-paper" aria-live="polite">
        {hours} paid {hours === 1 ? "hour" : "hours"}: {unlocked ? `reward unlocked, ${REWARD_MINUTES} minutes of free play.` : `${WEEKLY_TARGET - points} more ${WEEKLY_TARGET - points === 1 ? "point" : "points"} to unlock ${REWARD_MINUTES} free minutes.`}
      </p>
    </div>
  );
}
