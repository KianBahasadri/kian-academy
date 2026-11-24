# Interface

The React app opens Resources at `#/resources` and Practice at `#/practice`. Opening the site without a hash shows Resources. The theme starts from the browser's color-scheme preference and follows live preference changes until the theme button, Alt+Shift+T, or the Toggle theme command selects a theme for the rest of the page's lifetime; reloading returns to the current system preference. Search, filters, column preferences, and sort priorities are held in memory, with independent collection settings. Reloading resets the view settings. [App](../src/App.tsx)

## Browsing

Use the status tabs and search field to narrow the current collection. **Filters** opens choices for subject and format, with a tier filter on Resources and a related-resource filter on Practice when work is available. Resource tiers use Roman numerals I through V in the table, filters, details, help, and CSV export. Resource subject filters match the individual subjects in a list. Updating a quick filter clears the column filter for that field, and updating the column filter clears its quick filter. **Reset filters** clears search and both kinds of filters.

Dropdowns accept listed values. Type to narrow the choices and use the arrow keys and Enter to select. Escape restores the committed selection. Leaving the field accepts an exact, case-insensitive label match and restores the current selection for unmatched text. [Select](../src/components/Select.tsx)

Select a row's title to open its detail panel. Arrow keys move between rows, with Home and End for the first and last rows on the page. A resource's practice count opens Practice filtered to that resource, and practice details link back to the associated resource when present. Resource details show published description, bibliographic metadata, and notes where available. They also show a compact tier tag and recorded progress. [Detail panels](../src/components/Details.tsx)

**Help** explains the current collection. The resource guide shows learning progress beside the five tier definitions on wide screens and stacks them on phones. Expand **Table controls** for sorting, filtering, layout, and export instructions. The search button opens the command dialog. It is also available with Ctrl+K, Cmd+K, or Ctrl+Space. Use **Keyboard shortcuts** in the command dialog or press Alt+/ to see the available keys. [Commands](../src/components/Commands.tsx) · [Help](../src/components/CollectionInfo.tsx)

## Shared table controls

- **Columns** shows, hides, and resets fields and widths. The title field remains visible. Drag a heading to move it or use **Move left** and **Move right** in its options.
- Right-click or touch and hold a heading to open its options. With the heading focused, use Shift+F10. Resize by dragging the right edge or using the left and right arrows on the focused resize handle. Home restores its width.
- Select a heading to cycle between ascending, descending, and unsorted. Multiple sorted fields act in priority order. Use the column options to change priorities, or **Clear sorting** to restore catalog order. Missing values sort last in either direction.
- Column filters support text matches, numeric comparisons, and include and exclude choices. Filters on different fields compose. Active column filters can be edited or removed using chips, including when their column is hidden.
- The table displays up to 50 rows at a time. **Export CSV** includes every matching row in sort order and uses the visible columns in their current order. It exports a resource's subject list in one comma-separated cell.

[Collection field definitions](../src/collections.tsx) define the defaults and how each field is rendered and compared. [Table operations](../src/table.ts) implement sorting, filtering, and column order. [CollectionTable](../src/components/CollectionTable.tsx) renders the rows and column controls. [The drag hook](../src/components/useColumnDrag.ts) uses an [inert preview](../src/components/columnDragPreview.ts) of the visible rows until the drop commits the new order.

## Visual style

The compact controls and tables are adapted from Grakata. The stylesheet defines color tokens for both themes, scrollable tables, a pinned first column on wide screens, and full-height detail panels on phones. IBM Plex fonts and Lucide icons ship with the static build. [Stylesheet](../src/styles.css) · [Bundled fonts](../src/main.tsx) · [Grakata collection table](https://github.com/KianBahasadri/warframe-toolkit/blob/5f35efbfb9e93950930fa484b1060c8ebd954d7d/src/components/CollectionTable.tsx)
