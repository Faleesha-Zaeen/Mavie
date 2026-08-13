import { Routes, Route } from 'react-router-dom';

import Layout from './components/Layout.jsx';
import Moment from './pages/Moment.jsx';
import Looks from './pages/Looks.jsx';
import TryOn from './pages/TryOn.jsx';
import Aftermath from './pages/Aftermath.jsx';
import Closet from './pages/Closet.jsx';
import Profile from './pages/Profile.jsx';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Moment />} />
        <Route path="/looks" element={<Looks />} />
        <Route path="/try-on" element={<TryOn />} />
        <Route path="/aftermath" element={<Aftermath />} />
        <Route path="/closet" element={<Closet />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </Layout>
  );
}
