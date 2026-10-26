import { useEffect, useId, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { Dialog } from './ui';

export type Command = { label: string; keys: string[]; run: () => void };
export type CommandMode = 'commands' | 'pages';

function Keys({ keys }: { keys: string[] }) {
  const apple = /Mac|iPhone|iPad|iPod/.test(navigator.platform);
  return <span className="command-keys" aria-hidden="true">{keys.map(key => <kbd key={key}>{key === 'Alt' && apple ? '⌥' : key}</kbd>)}</span>;
}

export function Commands({ commands, destinations, initialMode, onClose, returnFocus }: { commands: Command[]; destinations: Command[]; initialMode: CommandMode; onClose: () => void; returnFocus: HTMLElement | null }) {
  const [mode, setMode] = useState(initialMode);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const listId = useId();
  const list = useRef<HTMLDivElement>(null);
  const jump = mode === 'pages';
  const options = (jump ? destinations : [
    { label: 'Jump to…', keys: ['Alt', 'J'], run: () => { setMode('pages'); setQuery(''); setActive(0); } },
    ...commands,
  ]).filter(command => command.label.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
  const selected = Math.min(active, Math.max(0, options.length - 1));

  useEffect(() => {
    list.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [selected, query, mode]);

  function execute(index: number) {
    const command = options[index];
    if (!command) return;
    if (!jump && index === 0 && command.label === 'Jump to…') { command.run(); return; }
    onClose();
    requestAnimationFrame(command.run);
  }

  return <Dialog title={jump ? 'Jump to a page' : 'Search and commands'} onClose={onClose} className="command-dialog" returnFocus={returnFocus}>
    <div className="command-search"><Search size={15} aria-hidden="true" focusable="false" /><input data-autofocus role="combobox" aria-label={jump ? 'Jump to a page' : 'Search commands'} aria-autocomplete="list" aria-haspopup="listbox" aria-expanded="true" aria-controls={listId} aria-activedescendant={options.length ? `${listId}-${selected}` : undefined} autoComplete="off" spellCheck={false} placeholder={jump ? 'Jump to a page' : 'Search commands…'} value={query} onChange={event => { setQuery(event.target.value); setActive(0); }} onKeyDown={event => {
      if (event.nativeEvent.isComposing) return;
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        setActive(Math.max(0, Math.min(options.length - 1, selected + (event.key === 'ArrowDown' ? 1 : -1))));
      } else if (event.key === 'Enter') { event.preventDefault(); execute(selected); }
    }} /></div>
    <div ref={list} id={listId} className="command-list" role="listbox" aria-label={jump ? 'Pages' : 'Commands'}>{options.map((command, index) => <div key={command.label} id={`${listId}-${index}`} className="command-option" role="option" aria-selected={selected === index} aria-keyshortcuts={command.keys.join('+')} onPointerMove={() => setActive(index)} onMouseDown={event => event.preventDefault()} onClick={() => execute(index)}><span>{command.label}</span><Keys keys={command.keys} /></div>)}{!options.length && <p className="command-empty" role="presentation">No matching {jump ? 'pages' : 'commands'}</p>}</div>
    <span className="sr-only" role="status">{options.length} {jump ? 'pages' : 'commands'} available</span>
  </Dialog>;
}

export function KeyboardShortcuts({ onClose, returnFocus }: { onClose: () => void; returnFocus: HTMLElement | null }) {
  const shortcuts = [
    { label: 'Search and commands', alternatives: [['Ctrl', 'K'], ['⌘', 'K'], ['Ctrl', 'Space']] },
    { label: 'Jump to a page', alternatives: [['Alt', 'J']] },
    { label: 'Resources', alternatives: [['Alt', '1']] },
    { label: 'Practice', alternatives: [['Alt', '2']] },
    { label: 'Search this collection', alternatives: [['/']] },
    { label: 'Toggle theme', alternatives: [['Alt', 'Shift', 'T']] },
    { label: 'Keyboard shortcuts', alternatives: [['Alt', '/']] },
    { label: 'Close dialog', alternatives: [['Esc']] },
  ];
  return <Dialog title="Keyboard shortcuts" onClose={onClose} className="shortcuts-dialog" returnFocus={returnFocus}><dl className="dialog-body shortcut-list">{shortcuts.map(shortcut => <div key={shortcut.label}><dt>{shortcut.label}</dt><dd aria-label={shortcut.alternatives.map(keys => keys.join(' + ')).join(' or ')}>{shortcut.alternatives.map((keys, index) => <span className="shortcut-alternative" key={keys.join('-')}>{index > 0 && <span aria-hidden="true">or</span>}<Keys keys={keys} /></span>)}</dd></div>)}</dl></Dialog>;
}
