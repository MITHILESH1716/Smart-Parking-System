import BookingWorkspace from '../../components/BookingWorkspace.jsx';

export default function NewBooking() {
  return (
    <>
      <div className="page-head"><div><h1>Book for a customer</h1>
        <p className="muted">Pick the slot on the map for a registered user (by email) or a walk-in customer.</p></div></div>
      <BookingWorkspace admin />
    </>
  );
}
