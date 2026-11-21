import React, { useState } from 'react';
import {
  MessageSquare,
  AlertTriangle,
  Flame,
  ThumbsUp,
  AlertCircle,
  CheckCircle,
  Send,
  Info,
} from 'lucide-react';

const INITIAL_REACTIONS = [
  { id: 'concerned', label: 'Concerned', icon: AlertTriangle, count: 0 },
  { id: 'important', label: 'Important', icon: Flame, count: 0 },
  { id: 'support', label: 'Support', icon: ThumbsUp, count: 0 },
  { id: 'attention', label: 'Needs Attention', icon: AlertCircle, count: 0 },
];

const INITIAL_COMMENTS = [
  {
    id: 1,
    name: 'Bishnu Bahadur Thapa',
    role: 'Ward 3 Agricultural Cooperative Liaison',
    date: '2026-11-20',
    comment:
      'We rely on this crossing daily to transport morning milk and cabbage harvest to the valley hub. A temporary gabion revetment must be installed before the next rainfall surge.',
  },
  {
    id: 2,
    name: 'Shova Gurung',
    role: 'Sundar Gaun Community Member',
    date: '2026-11-21',
    comment:
      'School children from Tallo Basti are currently having to detour an extra 35 minutes along the ridge. Glad this is marked as field verified; hoping for rapid repair mobilization.',
  },
];

export function CommunityFeedback({ issueTitle = 'this infrastructure report' }) {
  const [selectedReaction, setSelectedReaction] = useState(null);
  const [reactions, setReactions] = useState(INITIAL_REACTIONS);
  const [comments, setComments] = useState(INITIAL_COMMENTS);
  const [formData, setFormData] = useState({ name: '', email: '', comment: '' });
  const [submittedMessage, setSubmittedMessage] = useState(false);

  const handleToggleReaction = (reactionId) => {
    if (selectedReaction === reactionId) {
      setSelectedReaction(null);
      setReactions((prev) =>
        prev.map((r) => (r.id === reactionId ? { ...r, count: Math.max(0, r.count - 1) } : r))
      );
    } else {
      setReactions((prev) =>
        prev.map((r) => {
          if (r.id === reactionId) return { ...r, count: r.count + 1 };
          if (r.id === selectedReaction) return { ...r, count: Math.max(0, r.count - 1) };
          return r;
        })
      );
      setSelectedReaction(reactionId);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.comment.trim()) return;

    const newComment = {
      id: Date.now(),
      name: formData.name.trim(),
      role: 'Community Observer',
      date: new Date().toISOString().split('T')[0],
      comment: formData.comment.trim(),
    };

    setComments([newComment, ...comments]);
    setFormData({ name: '', email: '', comment: '' });
    setSubmittedMessage(true);
    setTimeout(() => setSubmittedMessage(false), 5000);
  };

  return (
    <section className="mt-12 pt-10 border-t border-[#E5E7EB] text-[#1B2923]">
      {/* Section Masthead */}
      <div className="mb-8">
        <span className="text-[11px] font-bold tracking-[0.14em] uppercase text-[#438A70] block mb-1.5">
          PUBLIC VOICES & FEEDBACK
        </span>
        <h3 className="text-xl sm:text-2xl font-bold text-[#173D32] tracking-tight">
          Community Reactions & Observations
        </h3>
        <p className="text-sm text-[#485650] mt-1.5 leading-relaxed">
          How does this infrastructure issue affect you or your neighborhood? Share your perspective for ward planning.
        </p>
      </div>

      {/* 4 Simple Reactions */}
      <div className="mb-10">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#173D32] mb-3">
          Express Your View
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          {reactions.map((reaction) => {
            const Icon = reaction.icon;
            const isSelected = selectedReaction === reaction.id;
            return (
              <button
                key={reaction.id}
                type="button"
                onClick={() => handleToggleReaction(reaction.id)}
                className={`flex items-center justify-center gap-2 px-3.5 py-3 rounded-[6px] border text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#173D32] text-white border-[#173D32] shadow-xs'
                    : 'bg-white text-[#173D32] border-[#E5E7EB] hover:border-[#438A70] hover:bg-[#F7F8FA]'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-[#E3AD58]' : 'text-[#438A70]'}`} />
                <span>{reaction.label}</span>
                {reaction.count > 0 && (
                  <span
                    className={`ml-1 text-[11px] px-1.5 py-0.5 rounded-full ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-[#E5E7EB] text-[#173D32]'
                    }`}
                  >
                    {reaction.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Community Observations / Comments List */}
      <div className="mb-10">
        <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB] mb-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#173D32] flex items-center gap-2">
            <MessageSquare className="w-3.5 h-3.5 text-[#438A70]" />
            <span>Community Notes & Observations ({comments.length})</span>
          </h4>
          <span className="text-[11px] text-[#485650]">Demonstration Activity</span>
        </div>

        <div className="space-y-4">
          {comments.map((c) => (
            <div
              key={c.id}
              className="p-4 rounded-[6px] bg-[#F7F8FA] border border-[#E5E7EB]/80 text-left"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-1 mb-1.5">
                <div className="flex items-center gap-2">
                  <h5 className="text-[14px] font-bold text-[#173D32]">{c.name}</h5>
                  <span className="text-[11px] text-[#438A70] font-medium">• {c.role}</span>
                </div>
                <span className="text-[11px] text-[#485650]">{c.date}</span>
              </div>
              <p className="text-sm text-[#485650] leading-relaxed font-normal">{c.comment}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Feedback Submission Form */}
      <div className="p-6 rounded-[6px] bg-white border border-[#E5E7EB]">
        <h4 className="text-base font-bold text-[#173D32] mb-1">
          Submit Citizen Feedback
        </h4>
        <p className="text-xs text-[#485650] mb-5 leading-relaxed">
          Provide ground-level updates on {issueTitle}. Constructive community feedback helps prioritize repair budgets.
        </p>

        {submittedMessage && (
          <div className="mb-4 p-3 rounded-[6px] bg-[#DDEBE2] border border-[#438A70]/30 flex items-center gap-2 text-xs font-semibold text-[#173D32]">
            <CheckCircle className="w-4 h-4 text-[#438A70] shrink-0" />
            <span>Thank you! Your feedback has been noted for this demonstration session.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="fb-name" className="block text-xs font-semibold text-[#173D32] mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                id="fb-name"
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Ramesh Shrestha"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#F7F8FA] border border-[#E5E7EB] rounded-[6px] text-[#173D32] placeholder-[#485650]/60 focus:bg-white focus:border-[#438A70] focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label htmlFor="fb-email" className="block text-xs font-semibold text-[#173D32] mb-1">
                Email Address <span className="text-[11px] text-[#485650] font-normal">(optional)</span>
              </label>
              <input
                id="fb-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="your.email@example.com"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#F7F8FA] border border-[#E5E7EB] rounded-[6px] text-[#173D32] placeholder-[#485650]/60 focus:bg-white focus:border-[#438A70] focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label htmlFor="fb-comment" className="block text-xs font-semibold text-[#173D32] mb-1">
              Your Comment / Observation <span className="text-red-500">*</span>
            </label>
            <textarea
              id="fb-comment"
              required
              rows={4}
              value={formData.comment}
              onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
              placeholder="Describe current road/bridge conditions, safety concerns, or local impact..."
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#F7F8FA] border border-[#E5E7EB] rounded-[6px] text-[#173D32] placeholder-[#485650]/60 focus:bg-white focus:border-[#438A70] focus:outline-none transition-colors"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-[6px] bg-[#173D32] hover:bg-[#122F26] text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit Feedback</span>
            </button>

            <span className="text-[11px] text-[#485650] flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-[#438A70] shrink-0" />
              <span>Demonstration only: input is recorded locally for this session.</span>
            </span>
          </div>
        </form>
      </div>
    </section>
  );
}

export default CommunityFeedback;
