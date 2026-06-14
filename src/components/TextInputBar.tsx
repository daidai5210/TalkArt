/**
 * Styled text input for when voice is unavailable or user prefers typing.
 */

import React from 'react';
import { MaterialIcon } from './MaterialIcon';

interface TextInputBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
}

export const TextInputBar: React.FC<TextInputBarProps> = ({
  value,
  onChange,
  onSubmit,
  placeholder = '你想画什么呢？比如：画一只黄色的猫',
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-2xl mx-auto px-margin-mobile md:px-0 mt-2"
    >
      <div className="flex gap-2 items-center bg-surface-container-lowest border-2 border-outline-variant rounded-full px-4 py-2 tactile-shadow-level-1 focus-within:border-primary transition-colors">
        <MaterialIcon name="edit" className="text-on-surface-variant text-2xl shrink-0" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent border-none outline-none font-body-md text-on-surface placeholder:text-on-surface-variant/60 min-w-0"
          aria-label="文字输入"
        />
        <button
          type="submit"
          disabled={!value.trim()}
          className="shrink-0 bg-primary text-on-primary font-label-bold px-5 py-2 rounded-full tactile-active shadow-[#005227] tactile-button-shadow disabled:opacity-40 disabled:shadow-none text-sm"
        >
          发送
        </button>
      </div>
    </form>
  );
};
