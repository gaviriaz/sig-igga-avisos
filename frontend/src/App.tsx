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
