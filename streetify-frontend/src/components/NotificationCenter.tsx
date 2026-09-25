import { useState, useEffect } from "react";
import { NotificationService, AppNotification } from "../services/notificationService";

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [activeToast, setActiveToast] = useState<AppNotification | null>(null);

  const loadNotifications = () => {
    setNotifications(NotificationService.getNotifications());
  };

  useEffect(() => {
    loadNotifications();

    const handleNew = (e: any) => {
      const n = e.detail as AppNotification;
      loadNotifications();
      // Show floating popup toast for 6 seconds
      setActiveToast(n);
      const timer = setTimeout(() => {
        setActiveToast(prev => prev?.id === n.id ? null : prev);
      }, 6500);
      return () => clearTimeout(timer);
    };

    const handleUpdate = () => {
      loadNotifications();
    };

    window.addEventListener("streetify-notification-received", handleNew);
    window.addEventListener("streetify-notification-updated", handleUpdate);

    return () => {
      window.removeEventListener("streetify-notification-received", handleNew);
      window.removeEventListener("streetify-notification-updated", handleUpdate);
    };
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <>
      {/* ── Bell Icon Button ── */}
      <div className="relative">
        <button
          onClick={() => {
            setIsOpen(!isOpen);
            if (!isOpen && unreadCount > 0) {
              NotificationService.markAllAsRead();
            }
          }}
          className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all flex items-center justify-center"
          title="Notification Center"
        >
          <span className="text-base">🔔</span>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center animate-pulse shadow-md">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {/* ── Dropdown Drawer ── */}
        {isOpen && (
          <div
            className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl z-[999] overflow-hidden flex flex-col text-slate-100"
            style={{ maxHeight: "480px" }}
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">📡</span>
                <p className="font-extrabold text-sm text-white">Notification Service</p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                {notifications.length > 0 && (
                  <button
                    onClick={() => NotificationService.clearAll()}
                    className="text-slate-400 hover:text-red-400 text-[11px] font-mono"
                  >
                    Clear All
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-slate-400 hover:text-white text-sm"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2 divide-y divide-slate-800/40">
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-slate-500">
                  <span className="text-3xl block mb-2">📭</span>
                  <p className="text-xs font-semibold">No notifications yet</p>
                  <p className="text-[11px] text-slate-600 mt-0.5">OTP codes, trip alerts & receipts will appear here</p>
                </div>
              ) : (
                notifications.map(n => (
                  <div
                    key={n.id}
                    className={`p-3 rounded-xl transition-all ${
                      n.read ? "bg-slate-800/40" : "bg-blue-950/40 border border-blue-500/30"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">
                          {n.type === "OTP" && "🔐"}
                          {n.type === "TRIP_ALERT" && "🚖"}
                          {n.type === "RECEIPT" && "🧾"}
                          {n.type === "SUPPORT" && "🎧"}
                          {n.type === "SYSTEM" && "⚙️"}
                        </span>
                        <p className="font-bold text-xs text-white leading-tight">{n.title}</p>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 flex-none">{n.timestamp}</span>
                    </div>

                    <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">{n.message}</p>

                    {/* Quick action for OTP */}
                    {n.code && (
                      <div className="mt-2.5 flex items-center justify-between bg-slate-950/60 border border-slate-700/60 rounded-lg p-2">
                        <span className="text-xs font-mono font-extrabold text-blue-400 tracking-wider">
                          PIN: {n.code}
                        </span>
                        <button
                          onClick={() => copyToClipboard(n.code!)}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[10px] font-bold transition-all"
                        >
                          📋 Copy PIN
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 border-t border-slate-800 bg-slate-950/50 text-[10px] text-slate-500 text-center font-mono">
              Live Mock Gateway: SMS, WebPush & Email Services
            </div>
          </div>
        )}
      </div>

      {/* ── Active Real-time Floating Toast Alert ── */}
      {activeToast && (
        <div
          className="fixed top-16 right-4 z-[9999] max-w-sm w-full bg-slate-900 border border-blue-500/60 rounded-2xl p-4 shadow-2xl text-white backdrop-blur-md"
          style={{ animation: "slide-in .35s cubic-bezier(.22,1,.36,1) both" }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <span className="text-2xl mt-0.5">
                {activeToast.type === "OTP" ? "📲" : activeToast.type === "RECEIPT" ? "🧾" : "🔔"}
              </span>
              <div>
                <p className="font-extrabold text-xs text-blue-400 uppercase tracking-wider font-mono">
                  {activeToast.type === "OTP" ? "SMS Alert Received" : "Notification Service"}
                </p>
                <p className="font-bold text-sm text-white mt-0.5 leading-snug">{activeToast.title}</p>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">{activeToast.message}</p>
                {activeToast.code && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="px-2 py-1 bg-blue-600/30 border border-blue-500/50 rounded font-mono font-bold text-xs text-blue-300">
                      {activeToast.code}
                    </span>
                    <button
                      onClick={() => copyToClipboard(activeToast.code!)}
                      className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[11px] font-bold transition-all"
                    >
                      Copy
                    </button>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => setActiveToast(null)}
              className="text-slate-400 hover:text-white text-xs p-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
}
