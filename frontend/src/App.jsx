import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import UserLayout from './components/UserLayout.jsx';
import AdminLayout from './components/AdminLayout.jsx';
import Lots from './pages/user/Lots.jsx';
import BookSpot from './pages/user/BookSpot.jsx';
import MyBookings from './pages/user/MyBookings.jsx';
import Plans from './pages/user/Plans.jsx';
import SubscriptionPlans from './pages/admin/SubscriptionPlans.jsx';
import Dashboard from './pages/admin/Dashboard.jsx';
import AdminLots from './pages/admin/AdminLots.jsx';
import GridDesigner from './pages/admin/GridDesigner.jsx';
import AdminBookings from './pages/admin/AdminBookings.jsx';
import NewBooking from './pages/admin/NewBooking.jsx';

function Guard({ role, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to={role === 'ADMIN' ? '/admin/login' : '/login'} replace />;
  if (user.role !== role) return <Navigate to={user.role === 'ADMIN' ? '/admin' : '/'} replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login admin={false} />} />
      <Route path="/admin/login" element={<Login admin />} />
      <Route path="/register" element={<Register />} />

      <Route path="/" element={<Guard role="USER"><UserLayout /></Guard>}>
        <Route index element={<Lots />} />
        <Route path="book" element={<BookSpot />} />
        <Route path="my-bookings" element={<MyBookings />} />
        <Route path="plans" element={<Plans />} />
      </Route>

      <Route path="/admin" element={<Guard role="ADMIN"><AdminLayout /></Guard>}>
        <Route index element={<Dashboard />} />
        <Route path="lots" element={<AdminLots />} />
        <Route path="lots/:id/design" element={<GridDesigner />} />
        <Route path="book" element={<NewBooking />} />
        <Route path="bookings" element={<AdminBookings />} />
        <Route path="subscription-plans" element={<SubscriptionPlans />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
