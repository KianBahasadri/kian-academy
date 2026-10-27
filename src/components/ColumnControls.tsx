import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Columns3, EyeOff, ListOrdered, RotateCcw } from 'lucide-react';
import type { ColumnFilter, ColumnSort, FilterChoice, TableColumn } from '../table';
import { Select } from './ui';
import { TablePopover } from './TablePopover';

type ColumnOptionsProps = { columns: TableColumn[]; selected: string[]; onVisibility: (key: string, visible: boolean) => void; onReset: () => void };

function ColumnOptions({ columns, selected, onVisibility, onReset }: ColumnOptionsProps) {
  return <>
    <div className="column-options">{columns.map(column => <label key={column.key}><input type="checkbox" checked={selected.includes(column.key)} disabled={column.required} onChange={event => onVisibility(column.key, event.target.checked)} /><span>{column.title}</span></label>)}</div>
    <div className="column-menu-footer"><button type="button" className="button quiet" onClick={onReset}>Reset to default</button></div>
  </>;
}

export function ColumnPicker(props: ColumnOptionsProps) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  return <div className="column-picker"><button ref={trigger} type="button" className="button secondary columns-button" aria-expanded={open} onClick={() => setOpen(!open)}><Columns3 size={16} aria-hidden="true" />Columns</button>
    {open && <TablePopover anchor={trigger.current!} label="Table columns" className="column-menu" onClose={() => setOpen(false)}><ColumnOptions {...props} /></TablePopover>}
  </div>;
}

export function ColumnMenu({ column, columns, selected, choices, sorting, filter, anchor, point, initialView = 'actions', onVisibility, onReset, onMove, onSort, onPriority, onFilter, onHide, onResetWidth, onClose }: ColumnOptionsProps & {
  column: TableColumn; choices?: FilterChoice[]; sorting: ColumnSort[]; filter?: ColumnFilter;
  anchor: HTMLElement; point?: { x: number; y: number }; initialView?: 'actions' | 'filter';
  onMove: (direction: -1 | 1) => void; onSort: (direction: 1 | -1 | 0) => void; onPriority: (index: number) => void;
  onFilter: (filter?: ColumnFilter) => void; onHide: () => void; onResetWidth: () => void; onClose: () => void;
}) {
  const [view, setView] = useState<'actions' | 'columns' | 'priority' | 'filter'>(initialView);
  const content = useRef<HTMLDivElement>(null);
  const sortIndex = sorting.findIndex(sort => sort.key === column.key);
  const direction = sorting[sortIndex]?.direction;
  const columnIndex = selected.indexOf(column.key);
  const finish = (action: () => void) => { action(); onClose(); if (anchor.isConnected) anchor.focus({ preventScroll: true }); };
  useEffect(() => { content.current?.querySelector<HTMLElement>('input:not(:disabled), button:not(:disabled), select')?.focus({ preventScroll: true }); }, [view]);
  const title = view === 'columns' ? 'Columns' : view === 'priority' ? `${column.title} sort priority` : view === 'filter' ? `Filter ${column.title}` : column.title;
  return <TablePopover anchor={anchor} point={point} label={view === 'columns' ? 'Table columns' : view === 'filter' ? title : `Column actions for ${column.title}`} className="column-context" onClose={onClose}>
    <div className="column-menu-heading">{view !== 'actions' && <button type="button" className="icon-button" aria-label="Back to column actions" title="Back to column actions" onClick={() => setView('actions')}><ArrowLeft size={16} aria-hidden="true" /></button>}<span>{title}</span></div>
    <div ref={content} className={`column-menu-content ${view === 'columns' ? 'column-menu-content-options' : ''}`}>
      {view === 'actions' && <>
        <div role="menu" aria-label={`Sort ${column.title}`}>
          <button type="button" role="menuitemradio" aria-checked={direction === 1} className="column-menu-action" onClick={() => finish(() => onSort(direction === 1 ? 0 : 1))}><ArrowUp size={16} aria-hidden="true" />Sort ascending</button>
          <button type="button" role="menuitemradio" aria-checked={direction === -1} className="column-menu-action" onClick={() => finish(() => onSort(direction === -1 ? 0 : -1))}><ArrowDown size={16} aria-hidden="true" />Sort descending</button>
          <button type="button" role="menuitem" className="column-menu-action" disabled={sortIndex < 0} onClick={() => finish(() => onSort(0))}>Clear sort</button>
          <button type="button" role="menuitem" className="column-menu-action" disabled={sortIndex < 0 || sorting.length < 2} onClick={() => setView('priority')}><ListOrdered size={16} aria-hidden="true" />Sort priority{sortIndex >= 0 && <span className="menu-value">{sortIndex + 1} of {sorting.length}</span>}</button>
        </div>
        <div className="column-menu-divider" role="separator" />
        <ColumnFilterForm column={column} choices={choices} filter={filter} onChange={onFilter} />
        <div className="column-menu-divider" role="separator" />
        <div role="menu" aria-label={`Arrange ${column.title}`}>
          <button type="button" role="menuitem" className="column-menu-action" disabled={columnIndex <= 0} onClick={() => finish(() => onMove(-1))}><ArrowLeft size={16} aria-hidden="true" />Move left</button>
          <button type="button" role="menuitem" className="column-menu-action" disabled={columnIndex < 0 || columnIndex === selected.length - 1} onClick={() => finish(() => onMove(1))}><ArrowRight size={16} aria-hidden="true" />Move right</button>
          <button type="button" role="menuitem" className="column-menu-action" disabled={column.required || !selected.includes(column.key)} onClick={onHide}><EyeOff size={16} aria-hidden="true" />Hide column</button>
          <button type="button" role="menuitem" className="column-menu-action" onClick={() => setView('columns')}><Columns3 size={16} aria-hidden="true" />Add or remove columns</button>
          <button type="button" role="menuitem" className="column-menu-action" onClick={() => finish(onResetWidth)}><RotateCcw size={16} aria-hidden="true" />Reset column width</button>
        </div>
      </>}
      {view === 'priority' && <div role="menu" aria-label={title}>{sorting.map((sort, index) => <button key={sort.key} type="button" role="menuitemradio" aria-checked={index === sortIndex} className="column-menu-action" onClick={() => finish(() => onPriority(index))}><span className="menu-priority">{index + 1}</span><span>{columns.find(option => option.key === sort.key)?.title}</span>{sort.direction === 1 ? <ArrowUp size={14} aria-label="Ascending" /> : <ArrowDown size={14} aria-label="Descending" />}</button>)}</div>}
      {view === 'columns' && <ColumnOptions columns={columns} selected={selected} onVisibility={onVisibility} onReset={onReset} />}
      {view === 'filter' && <ColumnFilterForm column={column} choices={choices} filter={filter} onChange={onFilter} />}
    </div>
  </TablePopover>;
}

function ColumnFilterForm({ column, choices, filter, onChange }: { column: TableColumn; choices?: FilterChoice[]; filter?: ColumnFilter; onChange: (filter?: ColumnFilter) => void }) {
  const form = useRef<HTMLFormElement>(null);
  const [value, setValue] = useState(filter && filter.kind !== 'choice' ? String(filter.value) : '');
  const [operator, setOperator] = useState(filter?.kind === 'number' ? filter.operator : 'equals');
  const [numberValid, setNumberValid] = useState(true);
  const included = filter?.kind === 'choice' ? filter.values : [];
  const excluded = filter?.kind === 'choice' ? filter.excludedValues ?? [] : [];
  const changeNumber = (next: string, condition: typeof operator, valid: boolean) => {
    setValue(next); setOperator(condition); setNumberValid(valid);
    if (condition === 'unknown') onChange({ kind: 'number', operator: condition, value: 0 });
    else if (valid) onChange(next !== '' ? { kind: 'number', operator: condition, value: Number(next) } : undefined);
  };
  const changeChoices = (values: string[], excludedValues: string[]) => onChange(values.length || excludedValues.length ? { kind: 'choice', values, excludedValues } : undefined);
  return <form ref={form} className="column-filter-form" aria-label={`Filter ${column.title}`} onSubmit={event => event.preventDefault()}>
    {column.kind === 'number' ? <>
      <label>Condition<Select label={`${column.title} condition`} mode="list-only" value={operator} onChange={next => changeNumber(value, next as typeof operator, numberValid)} options={[{ value: 'equals', label: 'Equals' }, { value: 'atLeast', label: 'At least' }, { value: 'atMost', label: 'At most' }, ...(column.number?.unknown ? [{ value: 'unknown', label: 'Unknown' }] : [])]} /></label>
      {operator !== 'unknown' && <label>{column.title}<input aria-label={`Filter ${column.title.toLowerCase()}`} aria-invalid={!numberValid || undefined} type="number" min={column.number?.min} max={column.number?.max} step={column.number?.step ?? 1} value={value} onChange={event => changeNumber(event.target.value, operator, event.target.validity.valid)} /></label>}
    </> : choices ? <fieldset className="column-filter-choices" aria-label={`${column.title} filter values`}>
      <legend>Filter</legend><div className="column-filter-sides" aria-hidden="true"><span>Include</span><span>Exclude</span></div>
      <div className="column-filter-options">{choices.map(choice => <div className="column-filter-option" key={choice.value}>
        <label><input type="checkbox" aria-label={`Include ${choice.label}`} checked={included.includes(choice.value)} onChange={event => changeChoices(event.target.checked ? [...included, choice.value] : included.filter(value => value !== choice.value), excluded.filter(value => value !== choice.value))} /><span>{choice.label}</span></label>
        <label className="column-filter-exclude" title={`Exclude ${choice.label}`}><input type="checkbox" aria-label={`Exclude ${choice.label}`} checked={excluded.includes(choice.value)} onChange={event => changeChoices(included.filter(value => value !== choice.value), event.target.checked ? [...excluded, choice.value] : excluded.filter(value => value !== choice.value))} /></label>
      </div>)}</div>
    </fieldset> : <label>Contains<input aria-label={`${column.title} contains`} value={value} onChange={event => { setValue(event.target.value); onChange(event.target.value.trim() ? { kind: 'text', value: event.target.value.trim() } : undefined); }} /></label>}
    <div className="column-filter-actions"><button type="button" className="button quiet" disabled={!filter && !value} onClick={() => { form.current?.querySelector<HTMLElement>('input, select')?.focus({ preventScroll: true }); setValue(''); setOperator('equals'); setNumberValid(true); onChange(); }}>Clear filter</button></div>
  </form>;
}
