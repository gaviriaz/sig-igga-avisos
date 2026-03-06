import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Infraestructura from './pages/Infraestructura';
import SistemasGIS from './pages/SistemasGIS';
import Ciberseguridad from './pages/Ciberseguridad';
import Protocolos from './pages/Protocolos';
import NOCCommand from './pages/NOCCommand';
import Logistica from './pages/Logistica';
import ProtectedRoute from './components/ProtectedRoute';

const App: React.FC = () => {
    // Keep Render instance awake (Senior Master Strategy)
    React.useEffect(() => {
        const apiUrl = import.meta.env.VITE_API_URL || 'https://sig-igga-avisos.onrender.com';
        const keepAlive = () => {
            fetch(`${apiUrl}/heartbeat`)
                .then(() => console.log('💓 Heartbeat sent to Render'))
                .catch(() => { });
        };

        // Ping every 10 minutes to prevent sleep
        const heartbeatInterval = setInterval(keepAlive, 10 * 60 * 1000);
        keepAlive();

        return () => clearInterval(heartbeatInterval);
    }, []);

    return (
        <HashRouter
            future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true,
            }}
        >
            <Routes>
                {/* 🌎 Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/infraestructura" element={<Infraestructura />} />
                <Route path="/sistemas-gis" element={<SistemasGIS />} />
                <Route path="/ciberseguridad" element={<Ciberseguridad />} />
                <Route path="/protocolos" element={<Protocolos />} />
                <Route path="/noc-command" element={<NOCCommand />} />
                <Route path="/logistica" element={<Logistica />} />

                {/* 🔐 Protected Routes */}
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    }
                />

                {/* 🔄 Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </HashRouter>
    );
};

export default App;
