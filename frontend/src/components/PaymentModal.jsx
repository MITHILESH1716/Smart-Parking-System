import { useState } from 'react';
import { fmtDT, money } from '../api.js';

/** Demo payment sheet. Swap `onPay` for a real gateway (Razorpay / Stripe) call in production. */
export default function PaymentModal({ booking, onPay, onClose }) {
  const [method, setMethod] = useState('upi');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const pay = async (e) => {
    e.preventDefault();
    setBusy(true); setErr('');
    try {
      await new Promise((r) => setTimeout(r, 900)); // simulate gateway
      await onPay();
    } catch (ex) { setErr(ex.message); setBusy(false); }
  };

  return (
    <div className="modal-back" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={pay}>
        <h3>Complete payment</h3>
        <div className="receipt">
          <div><span>Lot</span><b>{booking.lotName}</b></div>
          <div><span>Slot</span><b>{booking.slotLabel}</b></div>
          <div><span>From</span><b>{fmtDT(booking.start)}</b></div>
          <div><span>To</span><b>{fmtDT(booking.end)}</b></div>
          <div className="total"><span>Total</span><b>{money(booking.amount)}</b></div>
        </div>
        <div className="seg">
          <button type="button" className={method === 'upi' ? 'on' : ''} onClick={() => setMethod('upi')}>UPI</button>
          <button type="button" className={method === 'card' ? 'on' : ''} onClick={() => setMethod('card')}>Card</button>
        </div>
        {method === 'upi'
          ? <label>UPI ID<input required placeholder="name@bank" /></label>
          : <>
              <label>Card number<input required inputMode="numeric" placeholder="4242 4242 4242 4242" /></label>
              <div className="row2">
                <label>Expiry<input required placeholder="MM/YY" /></label>
                <label>CVV<input required type="password" placeholder="•••" /></label>
              </div>
            </>}
        {err && <div className="alert error">{err}</div>}
        <div className="modal-actions">
          <button type="button" className="btn ghost" onClick={onClose} disabled={busy}>Pay later</button>
          <button className="btn primary" disabled={busy}>{busy ? 'Processing…' : `Pay ${money(booking.amount)}`}</button>
        </div>
        <p className="muted sm center">Demo payment – no real money is charged.</p>
      </form>
    </div>
  );
}
