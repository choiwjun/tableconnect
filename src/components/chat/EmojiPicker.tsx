'use client';

import { useState } from 'react';

interface EmojiCategory {
  name: string;
  emojis: string[];
}

const EMOJI_CATEGORIES: EmojiCategory[] = [
  {
    name: '감정',
    emojis: ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '🤪', '🤨', '🤯', '😐', '😑', '😶', '😏', '🙄', '🤔', '🤐', '🤤', '😒', '🤬', '🤥'],
  },
  {
    name: '축하',
    emojis: ['🎉', '🎊', '🎈', '🎇', '🎆', '✨', '🎁', '🎀', '🎂', '🎋', '🎁', '🎄', '🎃', '🥳', '🧧', '🎨', '🎭', '🎬', '🎵', '🎹', '🎺', '🥁', '🔔', '🎊'],
  },
  {
    name: '식음료',
    emojis: ['🍻', '🍺', '🥂', '🍹', '🍸', '🍶', '🍾', '🍷', '🍵', '🥃', '🥤', '🧊', '🍸', '🍽', '🥄', '🍾', '🥃', '🍜', '🍢', '🥡', '🍤', '🥫', '🍝', '🍟', '🌽', '🍎', '🍏', '🧁', '🥧', '🍦', '🍌�', '🥛'],
  },
  {
    name: '음식',
    emojis: ['🍣', '🍔', '🍟', '🍙', '🍕', '🍗', '🥩', '🌭', '🍖', '🍤', '🌮', '🥓', '🥥', '🧀', '🍱', '🍛', '🥘', '🍚', '🍜', '🍝', '🍞', '🥠', '🧆', '🥡', '🥫', '🦪', '🧈', '🌮'],
  },
  {
    name: '약속',
    emojis: ['✨', '🤝', '🤙', '👋', '💕', '💞', '💓', '💘', '💝', '💖', '❤️', '🧡', '💗', '💓', '💞', '❤️', '💔', '💘', '💕', '👍', '👎', '✌', '🌟', '⭐', '💯', '✊', '✋'],
  },
  {
    name: '기호',
    emojis: ['👍', '👎', '👏', '🙏', '🙋', '🙌', '🤙', '🤝', '💪', '👊', '✌️', '✨', '⭐', '🔥', '💥', '✨', '❤️', '💔', '💕', '❌', '⭕', '🌸', '💋', '💀', '🤣', '🙏', '🤷', '💪'],
  },
];

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function EmojiPicker({ onSelect, isOpen, onClose }: EmojiPickerProps) {
  const [activeCategory, setActiveCategory] = useState(0);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-[90vw] max-w-md max-h-[80vh] glass-panel rounded-3xl border border-steel/30 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-steel/20 flex items-center justify-between">
          <h3 className="font-display text-xl text-soft-white">이모지</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-steel/20 rounded-full transition-colors"
          >
            <svg
              className="w-6 h-6 text-muted"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex h-[calc(80vh-64px)]">
          {/* Category Sidebar */}
          <div className="w-20 bg-midnight/50 border-r border-steel/20 overflow-y-auto">
            {EMOJI_CATEGORIES.map((category, index) => (
              <button
                key={category.name}
                onClick={() => setActiveCategory(index)}
                className={`w-full py-3 px-2 text-left text-sm transition-all ${
                  activeCategory === index
                    ? 'bg-neon-cyan/20 text-neon-cyan'
                    : 'text-muted hover:text-soft-white hover:bg-steel/20'
                }`}
              >
                <div className="truncate">{category.name}</div>
              </button>
            ))}
          </div>

          {/* Emoji Grid */}
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="grid grid-cols-6 gap-2">
              {EMOJI_CATEGORIES[activeCategory].emojis.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    onSelect(emoji);
                    onClose();
                  }}
                  className="w-10 h-10 text-2xl hover:bg-neon-cyan/20 rounded-lg transition-all transform hover:scale-110"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
