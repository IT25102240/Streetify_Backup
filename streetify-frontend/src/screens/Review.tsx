/**
 * Screen E — Post-Ride Feedback & Dispute Form
 *
 * API hooks:
 *   POST /api/feedback { rideId, rating, tags, comment }
 *   POST /api/disputes  { rideId, type, description }    → { ticketId }
 */
import { useState, useEffect } from "react";
import { Btn, Card, Toast } from "../ui";
import { apiClient } from "../api/apiClient";

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
  const [trip, setTrip] = useState<any>(null);
  const [errorToast, setErrorToast] = useState("");

  useEffect(() => {
    const lastTrip = localStorage.getItem("last_completed_trip");
    if (lastTrip) {
      try {
        setTrip(JSON.parse(lastTrip));
      } catch (e) {
        console.error("Failed to parse last trip");
      }
    }
  }, []);

  const MAX = 500;

  const EMOJI_LABEL = ["", "😤 Poor", "😐 Fair", "🙂 Good", "😊 Very Good", "🤩 Excellent!"];
  const availableTags = rating > 0 ? (QUICK_TAGS[rating] ?? []) : [];

  function toggleTag(t: string) {
    setTags(p => { const s = new Set(p); s.has(t) ? s.delete(t) : s.add(t); return s; });
  }

  async function submit() {
    setLoading(true);
    setErrorToast("");
    
    if (!trip || !trip.tripId) {
       setErrorToast("No trip context found to review.");
       setLoading(false);
       setToast(true);
       setTimeout(() => setToast(false), 4500);
       return;
    }

    try {
      const combinedComment = tags.size > 0 
        ? `[${Array.from(tags).join(", ")}] ${comment}` 
        : comment;

      await apiClient("/reviews", {
        method: "POST",
        body: JSON.stringify({
          tripId: trip.tripId,
          rating,
          comment: combinedComment.slice(0, 1000)
        })
      });

      if (dispute) {
        await apiClient("/disputes/create", {
          method: "POST",
          body: JSON.stringify({
            tripId: trip.tripId,
            subject: `Dispute: ${dispute}`,
            description: comment || "No description provided",
            disputeType: "OTHER"
          })
        });
      }
      
      setLoading(false);
      setToast(true);
      setTimeout(() => {
        setToast(false);
        window.dispatchEvent(new CustomEvent('navigate', { detail: { screen: 'history' } }));
      }, 3000);
    } catch (err: any) {
      setLoading(false);
      setErrorToast(err.message || "Failed to submit review");
      setToast(true);
      setTimeout(() => setToast(false), 4500);
    }
  }

  return (
    <div className="min-h-screen  flex items-start justify-center py-10 px-4 relative z-0" >
      <div className="absolute inset-0 -z-10 bg-[url('/hero-bg.jpg')] bg-cover bg-center opacity-30" />
      <div className="absolute inset-0 -z-10 bg-slate-950/70 backdrop-blur-[40px]" />
      <Toast
        message={errorToast ? "Failed to submit" : "Submitted successfully"}
        sub={errorToast || "Support responds within 24 hours if disputed"}
        type={errorToast ? "error" : "success"}
        visible={toast}
      />

      <div className="w-full max-w-lg space-y-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Rate Your Trip</h1>
          <p className="text-sm text-slate-500 mt-0.5">Your feedback helps improve Streetify for all users</p>
        </div>

        {/* Trip summary card */}
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl flex items-center justify-center font-extrabold text-white flex-none">
              {trip?.driverName?.slice(0, 2)?.toUpperCase() || "KP"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-extrabold text-white">{trip?.driverName || "Kasun Perera"}</p>
              <p className="text-xs text-slate-500 font-mono mt-0.5">{trip?.vehiclePlate || "CAB-4821"} · {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</p>
              <p className="text-xs text-slate-400 mt-0.5 truncate">{trip?.pickup?.slice(0,10) || "Colombo"} → {trip?.dropoff?.slice(0,10) || "BIA"}</p>
            </div>
            <div className="text-right flex-none">
              <p className="font-extrabold font-mono text-eco">LKR {trip?.fare?.toFixed(0) || "1,240"}</p>
              <p className="text-xs text-slate-400 font-mono">{trip?.distance || 31.4} km</p>
            </div>
          </div>
        </Card>

        {/* Star rating */}
        <Card className="p-6 text-center">
          <p className="text-sm font-semibold text-slate-300 mb-5">How was your overall experience?</p>
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
            <p className="text-lg font-extrabold text-slate-200" style={{ animation: "fade-in .25s ease both" }}>
              {EMOJI_LABEL[rating]}
            </p>
          )}

          {/* Quick tag chips */}
          {availableTags.length > 0 && (
            <div className="mt-5 flex flex-wrap justify-center gap-2"
                 style={{ animation: "slide-up .38s cubic-bezier(.22,1,.36,1) both" }}>
              {availableTags.map(t => (
                <button key={t} onClick={() => toggleTag(t)}
                  className={`px-3 py-1.5 rounded-full text-sm font-semibold border-2 transition-all ${tags.has(t) ? "border-eco bg-eco-dark/20 text-eco" : "border-slate-800 bg-navy border-eco/10 text-slate-300 hover:border-slate-700"}`}>
                  {t}
                </button>
              ))}
            </div>
          )}
        </Card>

        {/* Dispute / comments */}
        <Card className="p-5 space-y-4">
          <div>
            <p className="font-extrabold text-slate-100">Report an Issue</p>
            <p className="text-xs text-slate-500 mt-0.5">Optional — only complete if something went wrong</p>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-200 mb-1.5">Dispute Type</label>
            <div className="relative">
              <select value={dispute} onChange={e => setDispute(e.target.value)}
                className="w-full appearance-none px-4 py-2.5 bg-navy border-eco/10 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-eco pr-8">
                <option value="">Select a reason…</option>
                {DISPUTE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xs">▾</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-bold text-slate-200">Description</label>
              <span className={`text-xs font-mono font-bold ${comment.length > MAX * 0.9 ? "text-orange-500" : "text-slate-400"}`}>
                {comment.length} / {MAX}
              </span>
            </div>
            <textarea
              value={comment} onChange={e => setComment(e.target.value.slice(0, MAX))}
              rows={4}
              placeholder="Describe what happened — time, location, and any relevant details. Our support team responds within 24 hours…"
              className="w-full px-4 py-3 bg-navy border-eco/10 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-eco resize-none leading-relaxed"
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
