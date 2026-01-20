'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { isValidMessage } from '@/lib/utils/validators';
import { MAX_MESSAGE_LENGTH } from '@/lib/utils/constants';
import { useTranslation } from '@/lib/i18n/context';
import { EmojiPicker } from './EmojiPicker';

interface MessageInputProps {
  onSend: (content: string) => Promise<void>;
  disabled?: boolean;
  placeholder?: string;
}

export function MessageInput({
  onSend,
  disabled = false,
  placeholder,
}: MessageInputProps) {
  const { t } = useTranslation();
  const [content, setContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const inputPlaceholder = placeholder || t('chat.messagePlaceholder');
  const quickReplies = (t as (key: string) => string[])('chat.quickReplies');

  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [content, adjustTextareaHeight]);

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();

      const trimmedContent = content.trim();

      if (!trimmedContent || !isValidMessage(trimmedContent) || isSending || disabled) {
        return;
      }

      setIsSending(true);

      try {
        await onSend(trimmedContent);
        setContent('');
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }
      } catch (error) {
        console.error('Failed to send message:', error);
      } finally {
        setIsSending(false);
      }
    },
    [content, isSending, disabled, onSend]
  );

  const handleQuickReply = useCallback(
    async (quickReply: string) => {
      if (isSending || disabled) return;

      setIsSending(true);

      try {
        await onSend(quickReply);
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }
      } catch (error) {
        console.error('Failed to send message:', error);
      } finally {
        setIsSending(false);
      }
    },
    [isSending, disabled, onSend]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
      if (e.key === 'Escape') {
        setShowQuickReplies(false);
      }
    },
    [handleSubmit]
  );

  const handleEmojiSelect = (emoji: string) => {
    setContent((prev) => prev + emoji);
    setShowEmojiPicker(false);
    // Focus textarea after adding emoji
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setContent(e.target.value);
    },
    []
  );

  const remainingChars = MAX_MESSAGE_LENGTH - content.length;
  const isOverLimit = remainingChars < 0;
  const canSend = content.trim().length > 0 && !isOverLimit && !isSending && !disabled;

  return (
    <div className="flex flex-col gap-4">
      {/* Quick Replies */}
      {showQuickReplies && (
        <div className="flex flex-wrap gap-2 p-3 rounded-2xl bg-midnight/50 border border-steel/30">
          {quickReplies.map((reply, index) => (
            <button
              key={index}
              onClick={() => handleQuickReply(reply)}
              disabled={isSending || disabled}
              className="px-4 py-2 rounded-full bg-steel/20 border border-steel/30 text-soft-white text-sm hover:bg-neon-cyan/20 hover:border-neon-cyan/40 hover:text-neon-cyan transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {reply}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-end gap-3">
        {/* Quick Reply Toggle Button */}
        <button
          type="button"
          onClick={() => setShowQuickReplies(!showQuickReplies)}
          disabled={disabled}
          className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
            showQuickReplies
              ? 'bg-neon-cyan text-white shadow-lg shadow-neon-cyan/40'
              : 'bg-steel/20 text-muted hover:bg-steel/30 hover:text-soft-white'
          }`}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </button>

        {/* Emoji Picker Button */}
        <button
          type="button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          disabled={disabled}
          className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
            showEmojiPicker
              ? 'bg-neon-purple text-white shadow-lg shadow-neon-purple/40'
              : 'bg-steel/20 text-muted hover:bg-steel/30 hover:text-soft-white'
          }`}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </button>

        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={inputPlaceholder}
            disabled={disabled || isSending}
            maxLength={MAX_MESSAGE_LENGTH + 10}
            rows={1}
            className="w-full px-4 py-3 rounded-2xl bg-midnight border border-steel/50 text-soft-white placeholder:text-muted resize-none focus:outline-none focus:border-neon-cyan focus:ring-2 focus:ring-neon-cyan/20 focus:shadow-[0_0_20px_rgba(0,255,255,0.15),0_0_40px_rgba(0,255,255,0.1)] transition-all duration-200 disabled:opacity-50"
          />
          {content.length > 0 && (
            <span
              className={`absolute bottom-2 right-3 text-xs font-medium ${
                isOverLimit
                  ? 'text-red-400'
                  : remainingChars <= 50
                    ? 'text-yellow-400'
                    : 'text-muted'
              }`}
            >
              {remainingChars}
            </span>
          )}
        </div>

        <button
          type="submit"
          disabled={!canSend}
          className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-r from-neon-pink to-neon-purple text-white flex items-center justify-center transition-all duration-300 hover:shadow-lg hover:shadow-neon-pink/40 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:scale-100"
        >
          {isSending ? (
            <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          ) : (
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          )}
        </button>
      </form>

      {/* Emoji Picker */}
      <EmojiPicker
        isOpen={showEmojiPicker}
        onSelect={handleEmojiSelect}
        onClose={() => setShowEmojiPicker(false)}
      />
    </div>
  );
}
