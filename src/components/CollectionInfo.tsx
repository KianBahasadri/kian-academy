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
        <dl className="tier-legend">{resourceTiers.map(tier => <div key={tier.value}><dt>Tier {tier.value} · {tier.name}</dt><dd>{tier.description}</dd></div>)}</dl>
      </> : <>
        <p>Kian’s own essays, videos, projects, and notes, created while learning.</p>
        <h3>Browsing</h3>
        <p>Search or filter by status, subject, and format. Select a piece of work to read it here or open its published link. Drafts are work in progress; finished pieces are marked Finished.</p>
        <h3>Related resources</h3>
        <p>Practice can be linked to the learning material it builds on, or marked Independent. Use the resource filter to explore related work when practice is available.</p>
      </>}
    </div>
  </Dialog>;
}
