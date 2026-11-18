import { Button, Page } from '../ui/index.js';

export default function NotFound() {
  return (
    <Page className="flex items-center justify-center">
      <div className="max-w-md text-center space-y-3 py-16">
        <div className="font-display-lg text-[64px] leading-none font-bold bg-brand-gradient bg-clip-text text-transparent">404</div>
        <h1 className="font-headline-lg text-headline-lg text-on-surface">Page not found</h1>
        <p className="font-body-md text-body-md text-on-surface-variant">The page you're looking for doesn't exist or was moved.</p>
        <Button to="/" icon="dashboard">Back to dashboard</Button>
      </div>
    </Page>
  );
}
