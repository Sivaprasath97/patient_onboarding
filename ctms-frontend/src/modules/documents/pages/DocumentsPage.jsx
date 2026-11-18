import { Page, PageHeader } from '../../../shared/ui/index.js';
import DocumentsPanel from '../components/DocumentsPanel.jsx';

export default function DocumentsPage() {
  return (
    <Page>
      <PageHeader title="Documents" subtitle="Study protocols, informed consent forms, assessment reports and regulatory documents with version control." />
      <DocumentsPanel showFilters title="Document library" />
    </Page>
  );
}
