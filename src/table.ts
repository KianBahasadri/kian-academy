export type ColumnKey = string;
export type TableValue = string | string[] | number | boolean | null;
export type FilterChoice = { value: string; label: string };
export type TableColumn = {
  key: ColumnKey; title: string; kind?: 'boolean' | 'number'; required?: boolean; wrap?: boolean;
  width?: number; minWidth?: number; maxWidth?: number; align?: 'right';
  choices?: 'values' | FilterChoice[];
  number?: { min: number; max: number; step?: number | 'any'; unknown?: boolean };
};
export interface TableModel<Row> {
  value: (item: Row, key: ColumnKey) => TableValue;
  compare?: (a: Row, b: Row, key: ColumnKey) => number | undefined;
  matchesChoice?: (item: Row, key: ColumnKey, choice: string) => boolean | undefined;
}
export type ColumnSort = { key: ColumnKey; direction: 1 | -1 };
export type ColumnFilter = { kind: 'text'; value: string } | { kind: 'choice'; values: string[]; excludedValues?: string[] } | { kind: 'number'; operator: 'equals' | 'atLeast' | 'atMost' | 'unknown'; value: number };
export type ColumnFilters = Partial<Record<ColumnKey, ColumnFilter>>;
export type ColumnPreferences = { order: ColumnKey[]; visible: ColumnKey[] };
export type ColumnDropTarget = { key: ColumnKey; edge: 'before' | 'after' };

export function tableValueText(value: TableValue): string {
  return Array.isArray(value) ? value.join(', ') : String(value ?? '');
}

export function moveColumn(order: ColumnKey[], key: ColumnKey, target: ColumnDropTarget): ColumnKey[] {
  if (key === target.key || !order.includes(key) || !order.includes(target.key)) return order;
  const next = order.filter(column => column !== key);
  next.splice(next.indexOf(target.key) + (target.edge === 'after' ? 1 : 0), 0, key);
  return next;
}

export function sortRows<Row>(items: Row[], sorting: ColumnSort[], model: TableModel<Row>): Row[] {
  return [...items].sort((a, b) => {
    for (const sort of sorting) {
      const av = model.value(a, sort.key), bv = model.value(b, sort.key);
      if (av === null || bv === null) {
        if (av !== bv) return av === null ? 1 : -1;
        continue;
      }
      const result = model.compare?.(a, b, sort.key) ?? (((typeof av === 'boolean' && typeof bv === 'boolean') || (typeof av === 'number' && typeof bv === 'number'))
        ? Number(av) - Number(bv) : tableValueText(av).localeCompare(tableValueText(bv), undefined, { sensitivity: 'base', numeric: true }));
      if (result) return result * sort.direction;
    }
    return 0;
  });
}

export function filterRows<Row>(items: Row[], filters: ColumnFilters, model: TableModel<Row>): Row[] {
  return items.filter(item => Object.entries(filters).every(([key, filter]) => {
    if (!filter) return true;
    const value = model.value(item, key);
    if (filter.kind === 'text') return tableValueText(value).toLocaleLowerCase().includes(filter.value.trim().toLocaleLowerCase());
    if (filter.kind === 'choice') {
      const matches = (choice: string) => model.matchesChoice?.(item, key, choice) ?? (Array.isArray(value) ? value.includes(choice) : String(value) === choice);
      return (!filter.values.length || filter.values.some(matches)) && !filter.excludedValues?.some(matches);
    }
    if (filter.operator === 'unknown') return value === null;
    if (typeof value !== 'number') return false;
    return filter.operator === 'atLeast' ? value >= filter.value : filter.operator === 'atMost' ? value <= filter.value : value === filter.value;
  }));
}

export function setColumnSort(sorting: ColumnSort[], key: ColumnKey, direction: 1 | -1 | 0): ColumnSort[] {
  if (!direction) return sorting.filter(sort => sort.key !== key);
  return sorting.some(sort => sort.key === key) ? sorting.map(sort => sort.key === key ? { key, direction } : sort) : [...sorting, { key, direction }];
}

export function moveColumnSort(sorting: ColumnSort[], key: ColumnKey, priority: number): ColumnSort[] {
  const selected = sorting.find(sort => sort.key === key);
  if (!selected) return sorting;
  const remaining = sorting.filter(sort => sort.key !== key);
  remaining.splice(Math.max(0, Math.min(remaining.length, priority)), 0, selected);
  return remaining;
}

export function filterLabel(filter: ColumnFilter, choices?: FilterChoice[]): string {
  if (filter.kind === 'text') return `Contains “${filter.value}”`;
  if (filter.kind === 'choice') {
    const labels = (values: string[]) => values.map(value => choices?.find(choice => choice.value === value)?.label ?? value).join(' or ');
    const included = labels(filter.values) || 'Any';
    return filter.excludedValues?.length ? `${included} except ${labels(filter.excludedValues)}` : included;
  }
  return filter.operator === 'unknown' ? 'Unknown' : `${filter.operator === 'atLeast' ? 'At least' : filter.operator === 'atMost' ? 'At most' : 'Equals'} ${filter.value}`;
}

export function filterChoices<Row>(column: TableColumn, items: Row[], model: TableModel<Row>): FilterChoice[] | undefined {
  if (Array.isArray(column.choices)) return column.choices;
  if (column.kind === 'boolean') return [{ value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }];
  if (column.choices === 'values') return [...new Set(items.flatMap(item => {
    const value = model.value(item, column.key);
    return Array.isArray(value) ? value : [String(value)];
  }))].sort().map(value => ({ value, label: value }));
  return undefined;
}

export type TableView = { preferences: ColumnPreferences; sorting: ColumnSort[]; filters: ColumnFilters; widths: Record<string, number>; selectedId: string };

export function createTableView(columns: TableColumn[], defaults: string[]): TableView {
  return { preferences: { order: columns.map(column => column.key), visible: columns.filter(column => column.required || defaults.includes(column.key)).map(column => column.key) }, sorting: [], filters: {}, widths: {}, selectedId: '' };
}

export function cycleColumnSort(sorting: ColumnSort[], key: string): ColumnSort[] {
  const current = sorting.find(sort => sort.key === key);
  return setColumnSort(sorting, key, current?.direction === 1 ? -1 : current?.direction === -1 ? 0 : 1);
}

export type DragColumn = { key: string; width: number };
// Swap with a neighbor only after crossing its midpoint. A small dead band keeps
// a steady hand near a boundary from repeatedly swapping unequal-width columns.
export function projectColumnOrder(columns: DragColumn[], order: string[], key: string, left: number): string[] {
  const next = [...order];
  const width = (key: string) => columns.find(column => column.key === key)!.width;
  let index = next.indexOf(key);
  if (index < 0) return order;
  let position = next.slice(0, index).reduce((sum, key) => sum + width(key), 0);
  while (index < next.length - 1 && left > position + width(next[index + 1]) / 2 + 6) {
    position += width(next[index + 1]);
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    index++;
  }
  while (index > 0 && left < position - width(next[index - 1]) / 2 - 6) {
    position -= width(next[index - 1]);
    [next[index], next[index - 1]] = [next[index - 1], next[index]];
    index--;
  }
  return next;
}
