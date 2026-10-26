import { useEffect, useId, useRef } from 'react';
import type { ReactNode } from 'react';
import { Book, BookOpen, Check, ChevronDown, Code2, FileText, GraduationCap, Link2, NotebookPen, Play, Video, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const formatIcons: Record<string, LucideIcon> = {
  Playlist: Play, Course: GraduationCap, Book, Textbook: BookOpen, Article: FileText,
  Essay: FileText, Video, Project: Code2, Notes: NotebookPen, Other: Link2,
};

export function FormatIcon({ format, size = 18 }: { format: string; size?: number }) {
  const Icon = formatIcons[format] ?? Link2;
  return <Icon size={size} strokeWidth={1.6} aria-hidden="true" />;
}

export function ResourceMark({ format, subject, large = false }: { format: string; subject: string; large?: boolean }) {
  const tone = subject === 'Mathematics' ? 'blue' : subject === 'Computer science' ? 'purple' : subject === 'Writing' ? 'sand' : subject === 'Biology' ? 'green' : 'neutral';
  return <span className={`resource-mark ${tone}${large ? ' large' : ''}`}><FormatIcon format={format} size={large ? 27 : 21} /></span>;
}

export function Status({ value }: { value: string }) {
  const text: Record<string, string> = { planned: 'To learn', learning: 'In progress', completed: 'Completed', draft: 'Draft', finished: 'Finished' };
  return <span className={`status status-${value}`}>{value === 'completed' || value === 'finished' ? <Check size={13} /> : <span className="status-dot" />}{text[value] ?? value}</span>;
}

export function Select({ label, value, onChange, children, className = '' }: { label: string; value: string; onChange: (value: string) => void; children: ReactNode; className?: string }) {
  return <span className={`select-wrap ${className}`}><select aria-label={label} value={value} onChange={event => onChange(event.target.value)}>{children}</select><ChevronDown size={14} aria-hidden="true" /></span>;
}

export function Dialog({ title, onClose, children, wide = false, drawer = false }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean; drawer?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current!;
    const previous = document.activeElement;
    dialog.showModal();
    dialog.querySelector<HTMLElement>('[data-autofocus]')?.focus();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      dialog.close();
      document.body.style.overflow = overflow;
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus();
    };
  }, []);
  return <dialog ref={ref} className={`dialog${wide ? ' wide' : ''}${drawer ? ' drawer' : ''}`} aria-labelledby={titleId} onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => { if (event.target === event.currentTarget) { const rect = event.currentTarget.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose(); } }}>
    <div className="dialog-header"><h2 id={titleId}>{title}</h2><button type="button" className="icon-button" aria-label="Close dialog" onClick={onClose}><X size={19} /></button></div>
    {children}
  </dialog>;
}
