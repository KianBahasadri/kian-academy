import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { ArrowDown, ArrowDownToLine, ArrowUp, Filter, MoreHorizontal, Search, SlidersHorizontal, X } from 'lucide-react';
import { createTableView, cycleColumnSort, filterChoices, filterLabel, filterRows, moveColumn, moveColumnSort, setColumnSort, sortRows } from '../table';
import type { ColumnDropTarget, ColumnFilter, TableColumn, TableModel, TableView } from '../table';
import { ColumnMenu, ColumnPicker } from './ColumnControls';
import { useColumnDrag } from './useColumnDrag';

export type TableViewUpdate = (current: TableView) => TableView;

export function CollectionTable<Row extends { id: string }>({ label, columns: available, defaults, rows, allRows, model, rowLabel, renderCell, view, onViewChange, onOpen, onColumnFilter, onResetFilters, hasFilters, toolbar, quickFilters, quickFilterCount, notice, emptyTitle, emptyDescription }: {
  label: string; columns: TableColumn[]; defaults: string[]; rows: Row[]; allRows: Row[]; model: TableModel<Row>;
  rowLabel: (item: Row) => string; renderCell: (item: Row, column: TableColumn, visible: string[]) => ReactNode;
  view: TableView; onViewChange: (update: TableViewUpdate) => void; onOpen: (item: Row) => void;
  onColumnFilter: (key: string, filter?: ColumnFilter) => void; onResetFilters: () => void; hasFilters: boolean;
  toolbar: ReactNode; quickFilters: (showAll: boolean) => ReactNode; quickFilterCount: number; notice?: ReactNode; emptyTitle: string; emptyDescription: string;
}) {
  const grid = useRef<HTMLDivElement>(null);
  const headerButtons = useRef(new Map<string, HTMLButtonElement>());
  const rowButtons = useRef(new Map<string, HTMLButtonElement>());
  const naturalWidths = useRef<Record<string, number>>({});
  const latest = useRef(view); latest.current = view;
  const id = useId();
  const filterButton = useRef<HTMLButtonElement>(null);
  const previousQuickCount = useRef(quickFilterCount);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const [page, setPage] = useState(0);
  const [menu, setMenu] = useState<{ id: number; key: string; anchor: HTMLElement; point?: { x: number; y: number }; initialView?: 'filter' } | null>(null);
  const sequence = useRef(0);
  const visibleKeys = view.preferences.order.filter(key => view.preferences.visible.includes(key));
  const columns = visibleKeys.map(key => available.find(column => column.key === key)!);
  const primary = available.find(column => column.required) ?? available[0];
  const filtered = filterRows(rows, view.filters, model);
  const sorted = sortRows(filtered, view.sorting, model);
  const resultIds = sorted.map(item => item.id).join('\0');
  useEffect(() => { setPage(0); }, [resultIds]);
  const pages = Math.max(1, Math.ceil(sorted.length / 50));
  const currentPage = Math.min(page, pages - 1);
  const visible = sorted.slice(currentPage * 50, (currentPage + 1) * 50);
  const selectedId = visible.some(item => item.id === view.selectedId) ? view.selectedId : visible[0]?.id;
  const changed = hasFilters || Object.keys(view.filters).length > 0;
  useEffect(() => {
    const removed = previousQuickCount.current > quickFilterCount;
    previousQuickCount.current = quickFilterCount;
    if (removed && !filtersOpen && document.activeElement === document.body) filterButton.current?.focus({ preventScroll: true });
  }, [filtersOpen, quickFilterCount]);
  const resetFilters = () => { onResetFilters(); filterButton.current?.focus({ preventScroll: true }); };

  const columnOrder = visibleKeys.join('|');
  useLayoutEffect(() => {
    const region = grid.current;
    const table = region?.querySelector('table');
    if (!region || !table) return;
    const measure = () => {
      const headers = [...table.querySelectorAll<HTMLTableCellElement>('th[data-column-key]')];
      if (headers[0]) region.style.setProperty('--first-column-width', `${headers[0].getBoundingClientRect().width}px`);
      for (const header of headers) if (!latest.current.widths[header.dataset.columnKey!]) naturalWidths.current[header.dataset.columnKey!] = header.getBoundingClientRect().width;
    };
    measure();
    const observer = new ResizeObserver(measure); observer.observe(table);
    return () => observer.disconnect();
  }, [columnOrder]);

  const openMenu = (key: string, anchor: HTMLElement, point?: { x: number; y: number }, initialView?: 'filter') => setMenu({ id: ++sequence.current, key, anchor, point, initialView });
  const closeMenu = () => {
    setMenu(null);
    requestAnimationFrame(() => { if (menu && !menu.anchor.isConnected && document.activeElement === document.body) headerButtons.current.get(primary.key)?.focus({ preventScroll: true }); });
  };
  const visibility = (key: string, show: boolean) => onViewChange(current => {
    if (available.find(column => column.key === key)?.required && !show) return current;
    const visible = current.preferences.order.filter(candidate => candidate === key ? show : current.preferences.visible.includes(candidate));
    return { ...current, preferences: { ...current.preferences, visible }, sorting: current.sorting.filter(sort => visible.includes(sort.key)) };
  });
  const resetColumns = () => onViewChange(current => {
    const initial = createTableView(available, defaults);
    return { ...current, preferences: initial.preferences, widths: {}, sorting: current.sorting.filter(sort => initial.preferences.visible.includes(sort.key)) };
  });
  const reorder = (key: string, target: ColumnDropTarget, reveal = true) => {
    const order = moveColumn(view.preferences.order, key, target);
    onViewChange(current => ({ ...current, preferences: { ...current.preferences, order } }));
    setAnnouncement(`${available.find(column => column.key === key)!.title} moved to column ${order.filter(column => visibleKeys.includes(column)).indexOf(key) + 1} of ${columns.length}.`);
    requestAnimationFrame(() => {
      const button = headerButtons.current.get(key); button?.focus({ preventScroll: true });
      if (reveal) button?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    });
  };
  const drag = useColumnDrag(grid, (key, target) => reorder(key, target, false), () => setMenu(null));
  const sortColumn = (key: string, direction: 1 | -1 | 0) => onViewChange(current => ({ ...current,
    sorting: setColumnSort(current.sorting, key, direction),
    preferences: direction && !current.preferences.visible.includes(key) ? { ...current.preferences, visible: [...current.preferences.visible, key] } : current.preferences,
  }));
  const captureWidths = () => Object.fromEntries([...grid.current!.querySelectorAll<HTMLTableCellElement>('th[data-column-key]')].map(header => [header.dataset.columnKey!, header.getBoundingClientRect().width]));
  const resize = useRef<{ key: string; x: number; widths: Record<string, number>; original: Record<string, number> } | null>(null);
  const setWidth = (column: TableColumn, width: number, widths = captureWidths()) => {
    const next = Math.round(Math.max(column.minWidth ?? 84, Math.min(column.maxWidth ?? 640, width)));
    onViewChange(current => ({ ...current, widths: { ...current.widths, ...widths, [column.key]: next } }));
  };
  const resetWidth = (column: TableColumn) => setWidth(column, naturalWidths.current[column.key] ?? column.width ?? 140);
  const moveRow = (index: number, event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.altKey || event.ctrlKey || event.metaKey || !['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = visible[event.key === 'Home' ? 0 : event.key === 'End' ? visible.length - 1 : Math.max(0, Math.min(visible.length - 1, index + (event.key === 'ArrowDown' ? 1 : -1)))];
    const button = rowButtons.current.get(next.id); button?.focus({ preventScroll: true }); button?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  };
  const exportCsv = () => {
    const cell = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`;
    const csv = '\uFEFF' + [columns.map(column => column.title), ...sorted.map(item => columns.map(column => model.value(item, column.key)))].map(row => row.map(cell).join(',')).join('\r\n') + '\r\n';
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = `kian-academy-${label.toLowerCase()}.csv`; link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setAnnouncement(`Exported ${sorted.length} matching ${label.toLowerCase()} with the visible columns.`);
  };
  const fixed = Object.keys(view.widths).length > 0;
  const menuColumn = menu && available.find(column => column.key === menu.key)!;
  return <section className="collection-section" aria-label={`${label} collection`}>
    <div className="toolbar collection-toolbar">{toolbar}
      <button ref={filterButton} type="button" className="button secondary" aria-label="Filters" aria-expanded={filtersOpen} aria-controls={`${id}-filters`} onClick={() => setFiltersOpen(!filtersOpen)}><SlidersHorizontal size={16} aria-hidden="true" />Filters{quickFilterCount > 0 && ` (${quickFilterCount})`}</button>
      <ColumnPicker columns={available} selected={visibleKeys} onVisibility={visibility} onReset={resetColumns} />
      {changed && <button type="button" className="button quiet" onClick={resetFilters}>Reset filters</button>}
      {view.sorting.length > 0 && <button type="button" className="button quiet" onClick={() => onViewChange(current => ({ ...current, sorting: [] }))}>Clear sorting</button>}
      <div className="toolbar-end"><span className="result-count" role="status">{filtered.length} of {allRows.length}</span><button type="button" className="button quiet export-button" title="Export matching rows in visible column order" disabled={!sorted.length} onClick={exportCsv}><ArrowDownToLine size={15} aria-hidden="true" />Export CSV</button></div>
    </div>
    {(filtersOpen || quickFilterCount > 0) && <div id={`${id}-filters`} className="collection-quick-filters" role="group" aria-label={filtersOpen ? `${label} filters` : `Active ${label.toLowerCase()} filters`}>{quickFilters(filtersOpen)}</div>}
    {notice}
    {Object.keys(view.filters).length > 0 && <div className="column-filter-list" role="group" aria-label="Column filters">{available.filter(column => view.filters[column.key]).map(column => <div className="column-filter-chip" key={column.key}>
      <button type="button" onClick={event => openMenu(column.key, event.currentTarget, undefined, 'filter')}><Filter size={14} aria-hidden="true" />{column.title}: {filterLabel(view.filters[column.key]!, filterChoices(column, allRows, model))}</button>
      <button type="button" className="icon-button" aria-label={`Remove ${column.title} filter`} title={`Remove ${column.title} filter`} onClick={() => { onColumnFilter(column.key); headerButtons.current.get(column.key)?.focus({ preventScroll: true }); }}><X size={14} aria-hidden="true" /></button>
    </div>)}</div>}
    <span className="sr-only" role="status">{announcement}</span>
    <div ref={grid} className="table-scroll collection-grid" role="region" aria-label={`${label} table`} tabIndex={0}>
      <table className={`collection-table${fixed ? ' fixed-columns' : ''}`} style={fixed ? { tableLayout: 'fixed', width: columns.reduce((sum, column) => sum + (view.widths[column.key] ?? column.width ?? 140), 0) } : undefined}>
        <caption className="sr-only">Published {label.toLowerCase()}. Select a title to open details. Sort with column headings. Drag headers to reorder; open column options or press Shift+F10 for filters and more actions. Resize columns by dragging their right edge or using Left and Right on the resize control.</caption>
        <colgroup>{columns.map(column => <col key={column.key} style={fixed ? { width: view.widths[column.key] ?? column.width ?? 140 } : undefined} />)}</colgroup>
        <thead><tr>{columns.map(column => {
          const priority = view.sorting.findIndex(sort => sort.key === column.key);
          const sort = view.sorting[priority];
          const descriptionId = `${id}-${column.key}-sort`;
          return <th key={column.key} scope="col" data-column-key={column.key} className={column.kind === 'number' || column.align === 'right' ? 'number-cell' : ''} {...drag.headerProps(column.key)} aria-sort={priority === 0 ? sort.direction === 1 ? 'ascending' : 'descending' : undefined}
            onContextMenu={event => { event.preventDefault(); openMenu(column.key, headerButtons.current.get(column.key)!, event.clientX || event.clientY ? { x: event.clientX, y: event.clientY } : undefined); }}
            onKeyDown={event => { if (event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10')) { event.preventDefault(); event.stopPropagation(); openMenu(column.key, event.target as HTMLElement); } }}>
            <div className="column-header"><button ref={node => { if (node) headerButtons.current.set(column.key, node); else headerButtons.current.delete(column.key); }} type="button" className="sort-button" aria-label={`Sort by ${column.title}`} aria-describedby={descriptionId} onClick={() => onViewChange(current => ({ ...current, sorting: cycleColumnSort(current.sorting, column.key) }))}><span className="column-title">{column.title}</span><span className="sort-indicator" aria-hidden="true">{sort && <>{sort.direction === 1 ? <ArrowUp size={14} /> : <ArrowDown size={14} />}{priority + 1}</>}</span></button>
              <button type="button" className="icon-button column-options-button" aria-label={`${column.title} column options`} title={`${column.title} column options`} aria-expanded={menu?.key === column.key} onClick={event => openMenu(column.key, event.currentTarget)}><MoreHorizontal size={15} aria-hidden="true" /></button>
            </div>
            <span id={descriptionId} className="sr-only">{sort ? `Sort priority ${priority + 1} of ${view.sorting.length}, ${sort.direction === 1 ? 'ascending' : 'descending'}` : 'Unsorted'}</span>
            <div role="separator" tabIndex={0} className="column-resize-handle" aria-label={`Resize ${column.title} column`} aria-orientation="vertical" aria-valuemin={column.minWidth ?? 84} aria-valuemax={column.maxWidth ?? 640} aria-valuenow={Math.round(view.widths[column.key] ?? naturalWidths.current[column.key] ?? column.width ?? 140)}
              onPointerDown={event => { if (event.button !== 0) return; event.preventDefault(); event.stopPropagation(); event.currentTarget.focus({ preventScroll: true }); event.currentTarget.setPointerCapture(event.pointerId); const widths = captureWidths(); resize.current = { key: column.key, x: event.clientX, widths, original: view.widths }; }}
              onPointerMove={event => { const active = resize.current; if (active?.key === column.key) setWidth(column, active.widths[column.key] + event.clientX - active.x, active.widths); }}
              onPointerUp={() => { resize.current = null; }} onPointerCancel={() => { const active = resize.current; if (active) onViewChange(current => ({ ...current, widths: active.original })); resize.current = null; }}
              onClick={event => event.stopPropagation()} onDoubleClick={() => resetWidth(column)} onKeyDown={event => { if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); event.stopPropagation(); const widths = captureWidths(); setWidth(column, widths[column.key] + (event.key === 'ArrowRight' ? 16 : -16), widths); } else if (event.key === 'Home') { event.preventDefault(); resetWidth(column); } }} />
          </th>;
        })}</tr></thead>
        <tbody>{visible.map((item, index) => <tr key={item.id} className={item.id === selectedId ? 'selected-row' : undefined} onClick={event => {
          if (!(event.target as HTMLElement).closest('button, input, textarea, select, a, label, [contenteditable]') && !window.getSelection()?.toString()) { rowButtons.current.get(item.id)?.focus({ preventScroll: true }); onOpen(item); }
        }}>{columns.map(column => <td key={column.key} data-column-key={column.key} className={`${column.key === primary.key ? 'primary-cell' : ''} ${column.kind === 'number' || column.align === 'right' ? 'number-cell' : ''} ${column.wrap ? 'wrapping-cell' : ''}`}>
          {column.key === primary.key ? <button ref={node => { if (node) rowButtons.current.set(item.id, node); else rowButtons.current.delete(item.id); }} type="button" className="item-title" aria-label={`Details for ${rowLabel(item)}`} tabIndex={item.id === selectedId ? 0 : -1} onFocus={() => onViewChange(current => current.selectedId === item.id ? current : { ...current, selectedId: item.id })} onClick={() => onOpen(item)} onKeyDown={event => moveRow(index, event)}>{renderCell(item, column, visibleKeys)}</button> : column.wrap ? <div className="table-cell-content">{renderCell(item, column, visibleKeys)}</div> : renderCell(item, column, visibleKeys)}
        </td>)}</tr>)}</tbody>
      </table>
      {!sorted.length && <div className="empty-state"><Search size={28} aria-hidden="true" /><h2>{changed ? 'No matches here' : emptyTitle}</h2><p>{changed ? 'Try another search or clear your filters.' : emptyDescription}</p>{changed && <button type="button" className="button secondary" onClick={resetFilters}>Clear filters</button>}</div>}
    </div>
    {pages > 1 && <nav className="collection-pagination" aria-label={`${label} pages`}><button type="button" className="button secondary" disabled={currentPage === 0} onClick={() => { setPage(currentPage - 1); grid.current?.scrollTo({ top: 0 }); }}>Previous</button><span>{currentPage + 1} / {pages}</span><button type="button" className="button secondary" disabled={currentPage + 1 === pages} onClick={() => { setPage(currentPage + 1); grid.current?.scrollTo({ top: 0 }); }}>Next</button></nav>}
    {menu && menuColumn && <ColumnMenu key={menu.id} column={menuColumn} columns={available} selected={visibleKeys} choices={filterChoices(menuColumn, allRows, model)} sorting={view.sorting} filter={view.filters[menu.key]} anchor={menu.anchor} point={menu.point} initialView={menu.initialView}
      onVisibility={visibility} onReset={resetColumns} onMove={direction => { const target = visibleKeys[visibleKeys.indexOf(menu.key) + direction]; if (target) reorder(menu.key, { key: target, edge: direction < 0 ? 'before' : 'after' }); }} onSort={direction => sortColumn(menu.key, direction)} onPriority={priority => onViewChange(current => ({ ...current, sorting: moveColumnSort(current.sorting, menu.key, priority) }))} onFilter={filter => onColumnFilter(menu.key, filter)}
      onResetWidth={() => resetWidth(menuColumn)} onHide={() => { visibility(menu.key, false); setMenu(null); headerButtons.current.get(primary.key)?.focus({ preventScroll: true }); }} onClose={closeMenu} />}
  </section>;
}
