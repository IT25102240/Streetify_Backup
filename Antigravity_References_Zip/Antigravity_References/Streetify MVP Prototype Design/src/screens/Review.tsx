/**
 * Screen E — Post-Ride Feedback & Dispute Form
 *
 * API hooks:
 *   POST /api/feedback { rideId, rating, tags, comment }
 *   POST /api/disputes  { rideId, type, description }    → { ticketId }
 */
import { useState } from "react";
import { Btn, Card, Toast } from "../ui";

const DISPUTE_OPTIONS = [
  "Driver didn't show up",
  "Unfair / incorrect route deviation",
  "Overcharged — incorrect fare amount",
  "Unsafe or reckless driving behaviour",
  "Driver was rude or unprofessional",
  "Wrong pickup location recorded",
  "Vehicle didn't match app listing",
  "Ride cancelled without reason",
  "Other issue not listed",
];

const QUICK_TAGS: Record<number, string[]> = {
  5: ["Smooth ride", "On time", "Clean car", "Professional", "Friendly", "Great music"],
  4: ["On time", "Clean car", "Friendly", "Good navigation"],
  3: ["Mostly okay", "Minor detour"],
  2: ["Late arrival", "Uncomfortable"],
  1: ["Very disappointed", "Not recommended"],
};

export default function ScreenReview() {
  const [rating, setRating]   = useState(0);
  const [hover, setHover]     = useState(0);
  const [comment, setComment] = useState("");
  const [dispute, setDispute] = useState("");
  const [tags, setTags]       = useState<Set<string>>(new Set());
  const [toast, setToast]     = useState(false);
  const [loading, setLoading] = useState(false);
  const MAX = 500;

  const EMOJI_LABEL = ["", "😤 Poor", "😐 Fair", "🙂 Good", "😊 Very Good", "🤩 Excellent!"];
  const availableTags = rating > 0 ? (QUICK_TAGS[rating] ?? []) : [];

  function toggleTag(t: string) {
    setTags(p => { const s = new Set(p); s.has(t) ? s.delete(t) : s.add(t); return s; });
  }

  async function submit() {
    setLoading(true);
    // TODO: await apiPost("/api/feedback", { rideId:"RIDE-88421", rating, tags:[...tags], comment });
    // TODO: if (dispute) await apiPost("/api/disputes", { rideId:"RIDE-88421", type: dispute, description: comment });
    await new Promise(r => setTimeout(r, 1000));
    setLoading(false);
    setToast(true);
    setTimeout(() => setToast(false), 4500);
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-start justify-center py-10 px-4">
      <Toast
        message="Ticket submitted successfully via API"
        sub="TKT-2026-88421 · Support responds within 24 hours"
        type="success"
        visible={toast}
      />

      <div className="w-full max-w-lg space-y-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Rate Your Trip</h1>
          <p className="text-sm text-slate-500 mt-0.5">Your feedback helps improve Streetify for all users</p>
        </div>

        {/* Trip summary card */}
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl flex items-center justify-center font-extrabold text-white flex-none">KP</div>
            <div className="flex-1 min-w-0">
              <p className="font-extrabold text-slate-900">Kasun Perera</p>
              <p className="text-xs text-slate-500 font-mono mt-0.5">CAB-4821 · 14 Sep 2026, 14:32</p>
              <p className="text-xs text-slate-400 mt-0.5 truncate">Colombo Fort → BIA Terminal 1</p>
            </div>
            <div className="text-right flex-none">
              <p className="font-extrabold font-mono text-blue-700">LKR 1,240</p>
              <p className="text-xs text-slate-400 font-mono">31.4 km</p>
            </div>
          </div>
        </Card>

        {/* Star rating */}
        <Card className="p-6 text-center">
          <p className="text-sm font-semibold text-slate-600 mb-5">How was your overall experience?</p>
          <div className="flex justify-center gap-3 mb-3">
            {[1,2,3,4,5].map(s => (
              <button key={s}
                onClick={() => { setRating(s); setTags(new Set()); }}
                onMouseEnter={() => setHover(s)}
                onMouseLeave={() => setHover(0)}
                className="text-5xl transition-all hover:scale-110 active:scale-95 focus:outline-none select-none">
                <span className={`transition-colors duration-100 ${s <= (hover || rating) ? "text-amber-400" : "text-slate-200"}`}>★</span>
              </button>
            ))}
          </div>
          {rating > 0 && (
            <p className="text-lg font-extrabold text-slate-700" style={{ animation: "fade-in .25s ease both" }}>
              {EMOJI_LABEL[rating]}
            </p>
          )}

          {/* Quick tag chips */}
          {availableTags.length > 0 && (
            <div className="mt-5 flex flex-wrap justify-center gap-2"
                 style={{ animation: "slide-up .38s cubic-bezier(.22,1,.36,1) both" }}>
              {availableTags.map(t => (
                <button key={t} onClick={() => toggleTag(t)}
                  className={`px-3 py-1.5 rounded-full text-sm font-semibold border-2 transition-all ${tags.has(t) ? "border-blue-700 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}>
                  {t}
                </button>
              ))}
            </div>
          )}
        </Card>

        {/* Dispute / comments */}
        <Card className="p-5 space-y-4">
          <div>
            <p className="font-extrabold text-slate-800">Report an Issue</p>
            <p className="text-xs text-slate-500 mt-0.5">Optional — only complete if something went wrong</p>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Dispute Type</label>
            <div className="relative">
              <select value={dispute} onChange={e => setDispute(e.target.value)}
                className="w-full appearance-none px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8">
                <option value="">Select a reason…</option>
                {DISPUTE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xs">▾</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-bold text-slate-700">Description</label>
              <span className={`text-xs font-mono font-bold ${comment.length > MAX * 0.9 ? "text-orange-500" : "text-slate-400"}`}>
                {comment.length} / {MAX}
              </span>
            </div>
            <textarea
              value={comment} onChange={e => setComment(e.target.value.slice(0, MAX))}
              rows={4}
              placeholder="Describe what happened — time, location, and any relevant details. Our support team responds within 24 hours…"
              className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none leading-relaxed"
            />
            <div className="mt-1.5 h-1 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${comment.length > MAX * 0.9 ? "bg-orange-500" : "bg-blue-500"}`}
                style={{ width: `${(comment.length / MAX) * 100}%` }}
              />
            </div>
          </div>
        </Card>

        <Btn v="primary" size="xl" full onClick={submit} loading={loading} disabled={loading || rating === 0}>
          {rating === 0 ? "Please select a rating first" : "Submit Feedback & Ticket →"}
        </Btn>
        <p className="text-center text-xs text-slate-400 pb-4">Your identity is kept confidential when submitting disputes.</p>
      </div>
    </div>
  );
}
