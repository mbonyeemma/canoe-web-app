import { Routes, Route, Navigate } from 'react-router-dom';
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import Signup from './pages/Signup';
import SignupSuccessPatient from './pages/SignupSuccessPatient';
import Register from './pages/Register';
import OtpVerify from './pages/OtpVerify';
import PersonalDetails from './pages/PersonalDetails';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Contact from './pages/Contact';
import NotFound from './pages/NotFound';

import VideoCall from './pages/VideoCall';
import FindDoctors from './pages/FindDoctors';
import DoctorDetails from './pages/DoctorDetails';
import BookAppointment from './pages/BookAppointment';
import Dashboard from './pages/Dashboard';
import Appointments from './pages/Appointments';
import AppointmentDetails from './pages/AppointmentDetails';
import ProviderCalendar from './pages/ProviderCalendar';
import Availability from './pages/Availability';
import Clients from './pages/Clients';
import ClientFile from './pages/ClientFile';
import Wallet from './pages/Wallet';
import ChatsList from './pages/ChatsList';
import Chat from './pages/Chat';
import Profile from './pages/Profile';
import EditProfile from './pages/EditProfile';
import Settings from './pages/Settings';
import ChangePassword from './pages/ChangePassword';
import SettingsPaymentMethods from './pages/SettingsPaymentMethods';
import Credentials from './pages/Credentials';

export default function App() {
  return (
    <Routes>
      {/* App starts at login; landing lives on separate site (canoe-fe-website) */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/doctors" element={<FindDoctors />} />
      <Route path="/doctors/:id" element={<DoctorDetails />} />
      <Route path="/doctors/:id/book" element={<BookAppointment />} />

      {/* Auth pages */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/signup-success-patient" element={<SignupSuccessPatient />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify" element={<OtpVerify />} />
        <Route path="/personal-details" element={<PersonalDetails />} />
      </Route>

      {/* Protected provider dashboard */}
      <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/home" element={<Navigate to="/dashboard" replace />} />

        {/* Video / voice calls (full-screen overlay, covers the sidebar via fixed+z-50) */}
        <Route path="/call/:meetingId" element={<VideoCall />} />

        {/* Appointments */}
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/appointments/:id" element={<AppointmentDetails />} />

        {/* Schedule & Availability */}
        <Route path="/schedule" element={<ProviderCalendar />} />
        <Route path="/availability" element={<Availability />} />

        {/* Clients (patient files) */}
        <Route path="/clients" element={<Clients />} />
        <Route path="/clients/:id" element={<ClientFile />} />

        {/* Wallet */}
        <Route path="/wallet" element={<Wallet />} />

        {/* Messaging */}
        <Route path="/chats" element={<ChatsList />} />
        <Route path="/chats/:id" element={<Chat />} />

        {/* Profile & Settings */}
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/edit" element={<EditProfile />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/settings/password" element={<ChangePassword />} />
        <Route path="/settings/payment-methods" element={<SettingsPaymentMethods />} />

        {/* KYC / Credentials */}
        <Route path="/credentials" element={<Credentials />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
