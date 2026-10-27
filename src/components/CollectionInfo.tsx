import { Dialog } from './ui';
import { resourceTiers } from '../model';

export function CollectionInfo({ collection, onClose }: { collection: 'resources' | 'practice'; onClose: () => void }) {
  const isResources = collection === 'resources';
  return <Dialog title={isResources ? 'About learning resources' : 'About practice'} onClose={onClose}>
    <div className="dialog-body collection-info">
      {isResources ? <>
        <p>The books, textbooks, courses, playlists, and articles in Kian’s learning collection.</p>
        <h3>Browsing</h3>
        <p>Search or filter by status, subject, format, and tier. Select a resource to read its description and notes, see related practice, or open the original material.</p>
        <h3>Learning progress</h3>
        <p>To learn means not started, In progress shows ongoing learning, and Completed means finished. Progress and notes reflect Kian’s published updates.</p>
        <h3>Resource tiers</h3>
        <p>Tiers describe the intended audience and assumed knowledge, independently of learning progress.</p>
        <dl className="tier-legend">{resourceTiers.map(tier => <div key={tier.value}><dt>Tier {tier.value}</dt><dd>{tier.description}</dd></div>)}</dl>
      </> : <>
        <p>Kian’s own essays, videos, projects, and notes, created while learning.</p>
        <h3>Browsing</h3>
        <p>Search or filter by status, subject, and format. Select a piece of work to read it here or open its published link. Drafts are work in progress; finished pieces are marked Finished.</p>
        <h3>Related resources</h3>
        <p>Practice can be linked to the learning material it builds on, or marked Independent. Use the resource filter to explore related work when practice is available.</p>
      </>}
      <h3>Table controls</h3>
      <p>Use Columns to show or hide fields and reset the layout. Right-click or touch and hold a heading, or focus it and press Shift+F10, to open its column options. Drag a header to move it, or use Move left and Move right in its options. Drag the right edge to resize a column.</p>
      <p>Select a heading to cycle through ascending, descending, and unsorted. Sorting several columns adds priorities; column options can change their order. Each column also has its own filters, including include and exclude choices. Active filters stay visible even when their column is hidden.</p>
      <p>Export CSV downloads all matching rows using the visible columns in their current order. Table settings last for the current page session and reset on reload.</p>
    </div>
  </Dialog>;
}
