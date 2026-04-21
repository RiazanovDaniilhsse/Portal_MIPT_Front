import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import ActivationPending from './pages/ActivationPending';
import Activate from './pages/Activate';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import Listing from './pages/Listing';
import Deals from './pages/Deals';
import Messages from './pages/Messages';
import Profile from './pages/Profile';
import Wallet from './pages/Wallet';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/activation-pending" element={<ActivationPending />} />
      <Route path="/activate" element={<Activate />} />
      <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
      <Route path="/catalog" element={<ProtectedRoute><Catalog /></ProtectedRoute>} />
      <Route path="/listing/:id" element={<ProtectedRoute><Listing /></ProtectedRoute>} />
      <Route path="/deals" element={<ProtectedRoute><Deals /></ProtectedRoute>} />
      <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/wallet" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
