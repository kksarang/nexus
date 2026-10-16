import { POINT_MINUTES, REWARD_MINUTES, WEEKLY_TARGET } from "@/lib/loyalty";

export function SettingsDesk() {
  return (
    <div className="grid max-w-3xl gap-5">
      <div>
        <h1 className="text-4xl tracking-wide text-paper uppercase">Settings</h1>
        <p className="mt-2 text-sm text-mist">The loyalty rules the desk uses today. They stay in the app so a browser cannot invent a richer reward.</p>
      </div>
      <dl className="grid gap-3 sm:grid-cols-2">
        {[
          ["Point", `1 point for every ${POINT_MINUTES} paid minutes`],
          ["Weekly target", `${WEEKLY_TARGET} points, Monday to Sunday, India time`],
          ["Reward", `${REWARD_MINUTES} free minutes, once each week`],
          ["Balance", "Lifetime points stay. The weekly reward is not subtracted."],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-[#101624] p-4">
            <dt className="text-[0.62rem] tracking-[0.14em] text-mist uppercase">{label}</dt>
            <dd className="mt-2 text-sm text-paper">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="text-sm leading-relaxed text-mist">
        Phone SMS sign-in and Cloud Functions need a paid Firebase plan, so they are not enabled. Staff sign in with an email link.
        Session points are checked by Firestore rules: a client cannot award more than one point per 60 paid minutes, plus one banked point, and cannot award the same session twice.
        A custom earn rate faster than that would need a rules change. Manual point corrections are limited to admins in this desk and are written to the ledger with a reason.
      </p>
    </div>
  );
}
