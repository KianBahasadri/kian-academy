import { BookOpen, ChartNoAxesColumnIncreasing, ChevronDown, Library, SlidersHorizontal } from 'lucide-react';
import { Dialog, Status } from './ui';
import { resourceTiers } from '../model';

export function CollectionInfo({ collection, onClose }: { collection: 'resources' | 'practice'; onClose: () => void }) {
  const isResources = collection === 'resources';
  return <Dialog title={isResources ? 'About learning resources' : 'About practice'} onClose={onClose} className={isResources ? 'resource-guide' : ''}>
    <div className="dialog-body collection-info">
      {isResources ? <div className="guide-columns">
        <div className="guide-overview">
          <section>
            <h3><Library aria-hidden="true" />Browsing</h3>
            <p>Find resources by status, subject, format, or tier. A subject filter matches any subject listed on a resource.</p>
            <p>Open a title for its description, notes, related practice, and a link to the original material.</p>
          </section>
          <section>
            <h3><BookOpen aria-hidden="true" />Learning progress</h3>
            <p>Progress and notes reflect Kian’s published updates.</p>
            <dl className="progress-legend">
              <div><dt><Status value="prerequisites" /></dt><dd>Building the foundations</dd></div>
              <div><dt><Status value="planned" /></dt><dd>Ready to start</dd></div>
              <div><dt><Status value="learning" /></dt><dd>Currently studying</dd></div>
              <div><dt><Status value="completed" /></dt><dd>Finished</dd></div>
            </dl>
          </section>
        </div>
        <section className="guide-tiers">
          <h3><ChartNoAxesColumnIncreasing aria-hidden="true" />Resource tiers</h3>
          <p>Tiers describe the intended audience and assumed knowledge, independently of learning progress.</p>
          <dl className="tier-legend">{resourceTiers.map(tier => <div key={tier.value}>
            <dt>Tier {tier.numeral}<span className="tier-scale" aria-hidden="true">{resourceTiers.map(step =>
              <i key={step.value} className={step.value <= tier.value ? 'filled' : ''} />)}</span></dt>
            <dd>{tier.description}</dd>
          </div>)}</dl>
        </section>
      </div> : <>
        <p>Kian’s own essays, videos, projects, and notes, created while learning.</p>
        <h3>Browsing</h3>
        <p>Search or filter by status, subject, and format. Select a piece of work to read it here or open its published link. Drafts are work in progress; finished pieces are marked Finished.</p>
        <h3>Related resources</h3>
        <p>Practice can be linked to the learning material it builds on, or marked Independent. Use the resource filter to explore related work when practice is available.</p>
      </>}
      {isResources ? <details className="guide-controls">
        <summary><SlidersHorizontal size={16} aria-hidden="true" />Table controls<ChevronDown size={16} aria-hidden="true" /></summary>
        <TableHelp />
      </details> : <><h3>Table controls</h3><TableHelp /></>}
    </div>
  </Dialog>;
}

function TableHelp() {
  return <div className="table-help">
    <p><strong>Columns.</strong> Show or hide fields and reset the layout. Right-click a heading, touch and hold it, or focus it and press <kbd>Shift+F10</kbd> to open its options. Drag a heading or use Move left and Move right to reorder it. Drag its right edge to resize.</p>
    <p><strong>Sort and filter.</strong> Select a heading to cycle through ascending, descending, and unsorted. Use column options to reorder sort priorities or include and exclude values. Active filters stay visible when a column is hidden.</p>
    <p><strong>Export CSV.</strong> Download all matching rows with the visible columns in their current order. Table settings reset when you reload the page.</p>
  </div>;
}
