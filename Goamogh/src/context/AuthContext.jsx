'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { verifyOtp, sendOtp, logoutUser, refreshAuthToken, updateUserProfile, fetchUserProfile } from '../api/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loginModalOpen, setLoginModalOpen] = useState(false);
    const [loginPendingItem, setLoginPendingItem] = useState(null);
    const [legalModal, setLegalModal] = useState(null);
    const [previousUrl, setPreviousUrl] = useState(null);

    const openLegalModal = (type = 'terms') => {
        if (typeof window !== 'undefined') {
            if (!previousUrl) {
                setPreviousUrl(window.location.pathname + window.location.search);
            }
            const targetUrl = type === 'privacy' ? '/privacy' : '/terms';
            window.history.pushState({ legalModal: type }, '', targetUrl);
        }
        setLegalModal(type);
    };

    const closeLegalModal = () => {
        setLegalModal(null);
        if (typeof window !== 'undefined' && previousUrl) {
            window.history.pushState(null, '', previousUrl);
            setPreviousUrl(null);
        }
    };

    useEffect(() => {
        const handlePopState = () => {
            if (legalModal) {
                setLegalModal(null);
                setPreviousUrl(null);
            }
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [legalModal]);

    useEffect(() => {
        const initializeAuth = async () => {
            try {
                if (typeof window === 'undefined') return;
                const savedToken = localStorage.getItem('goamogh_access_token');
                const savedRefreshToken = localStorage.getItem('goamogh_refresh_token');

                if (savedToken) {
                    try {
                        const profileResponse = await fetchUserProfile(savedToken);
                        if (profileResponse.success) {
                            const userObj = profileResponse.data.user || profileResponse.data;
                            setUser(userObj);
                            setToken(savedToken);
                            localStorage.setItem('goamogh_user', JSON.stringify(userObj));
                        } else {
                            clearSession();
                        }
                    } catch (err) {
                        if (savedRefreshToken) {
                            try {
                                const refreshResponse = await refreshAuthToken(savedRefreshToken);
                                if (refreshResponse.success && refreshResponse.data) {
                                    const newAccessToken = refreshResponse.data.access_token;
                                    const newRefreshToken = refreshResponse.data.refresh_token;

                                    localStorage.setItem('goamogh_access_token', newAccessToken);
                                    localStorage.setItem('goamogh_refresh_token', newRefreshToken);

                                    const profileResponse = await fetchUserProfile(newAccessToken);
                                    if (profileResponse.success) {
                                        const userObj = profileResponse.data.user || profileResponse.data;
                                        setUser(userObj);
                                        setToken(newAccessToken);
                                        localStorage.setItem('goamogh_user', JSON.stringify(userObj));
                                    } else {
                                        clearSession();
                                    }
                                } else {
                                    clearSession();
                                }
                            } catch (refreshErr) {
                                clearSession();
                            }
                        } else {
                            clearSession();
                        }
                    }
                } else {
                    clearSession();
                }
            } catch (e) {
                console.error('Failed to restore auth session:', e);
            } finally {
                setLoading(false);
            }
        };

        initializeAuth();
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleTokenRefreshed = (e) => {
            const { accessToken } = e.detail;
            setToken(accessToken);
        };

        const handleAuthError = () => {
            clearSession();
            triggerLoginModal();
        };

        window.addEventListener('goamogh-token-refreshed', handleTokenRefreshed);
        window.addEventListener('goamogh-auth-error', handleAuthError);

        return () => {
            window.removeEventListener('goamogh-token-refreshed', handleTokenRefreshed);
            window.removeEventListener('goamogh-auth-error', handleAuthError);
        };
    }, []);

    const clearSession = () => {
        setUser(null);
        setToken(null);
        setLoginPendingItem(null);
        setLoginModalOpen(false);
        setLegalModal(null);
        setPreviousUrl(null);
        if (typeof window !== 'undefined') {
            localStorage.removeItem('goamogh_access_token');
            localStorage.removeItem('goamogh_refresh_token');
            localStorage.removeItem('goamogh_user');
            localStorage.removeItem('goamogh_admin_token');
            localStorage.removeItem('customer_token');
            try {
                sessionStorage.clear();
            } catch (_) {}
            window.dispatchEvent(new CustomEvent('goamogh-auth-logout'));
            window.dispatchEvent(new Event('storage'));
        }
    };

    const triggerLoginModal = (pendingItem = null) => {
        setLoginPendingItem(pendingItem);
        setLoginModalOpen(true);
    };

    const closeLoginModal = () => {
        setLoginModalOpen(false);
        setLoginPendingItem(null);
    };

    const requestOtp = async (phone) => {
        return await sendOtp(phone);
    };

    const submitOtpVerify = async (phone, otp_code) => {
        const response = await verifyOtp(phone, otp_code);
        if (response.success && response.data) {
            const accessToken = response.data.access_token;
            const refreshToken = response.data.refresh_token;
            const userObj = response.data.user || response.data;

            if (typeof window !== 'undefined') {
                localStorage.setItem('goamogh_access_token', accessToken);
                localStorage.setItem('goamogh_refresh_token', refreshToken);
                localStorage.setItem('goamogh_user', JSON.stringify(userObj));
            }

            setToken(accessToken);
            setUser(userObj);
        }
        return response;
    };

    const updateProfile = async (profileData) => {
        if (!token) throw new Error('No authentication session active');
        const response = await updateUserProfile(token, profileData);
        if (response.success && response.data) {
            setUser(response.data);
            if (typeof window !== 'undefined') {
                localStorage.setItem('goamogh_user', JSON.stringify(response.data));
            }
        }
        return response;
    };

    const logout = async () => {
        if (token) {
            try {
                await logoutUser(token);
            } catch (e) {
                console.error('Logout API execution error:', e);
            }
        }
        clearSession();
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                loading,
                loginModalOpen,
                loginPendingItem,
                triggerLoginModal,
                closeLoginModal,
                legalModal,
                openLegalModal,
                closeLegalModal,
                requestOtp,
                submitOtpVerify,
                updateProfile,
                logout,
                setLoginPendingItem,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be wrapped inside AuthProvider');
    }
    return context;
}
