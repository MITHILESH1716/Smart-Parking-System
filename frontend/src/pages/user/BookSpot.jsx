import BookingWorkspace from '../../components/BookingWorkspace.jsx';

export default function BookSpot() {
  return (
    <>
      <div className="page-head"><div><h1>Choose your spot</h1><p className="muted">Tap a free slot on the map – just like picking a seat.</p></div></div>
      <BookingWorkspace admin={false} />
    </>
  );
}
