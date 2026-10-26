import { Dialog } from './ui';

export function CollectionInfo({ collection, onClose }: { collection: 'resources' | 'practice'; onClose: () => void }) {
  const isResources = collection === 'resources';
  return <Dialog title={isResources ? 'About learning resources' : 'About practice'} onClose={onClose}>
    <div className="dialog-body collection-info">
      {isResources ? <>
        <p>The books, textbooks, courses, playlists, and articles in Kian’s learning collection.</p>
        <h3>Browsing</h3>
        <p>Search or filter by status, subject, and format. Select a resource to read its description and notes, see related practice, or open the original material.</p>
        <h3>Learning progress</h3>
        <p>To learn means not started, In progress shows ongoing learning, and Completed means finished. Progress and notes reflect Kian’s published updates.</p>
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
