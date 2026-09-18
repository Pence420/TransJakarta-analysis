import PageTitle from '../components/PageTitle';
import MapView from '../components/MapView';

export default function NetworkPage() {
  return (
    <div className="space-y-5">
      <PageTitle
        title="Network Map"
        subtitle="Explore corridors across Jakarta — select a route to trace its shape on the live map."
      />
      <MapView />
    </div>
  );
}