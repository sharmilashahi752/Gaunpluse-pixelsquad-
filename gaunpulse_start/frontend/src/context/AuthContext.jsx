import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const TOKEN_KEY = 'gaunpulse_auth_token';
const USER_KEY = 'gaunpulse_auth_user';
const MUNICIPALITY_KEY = 'gaunpulse_active_municipality_id';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem(TOKEN_KEY) || null;
    } catch {
      return null;
    }
  });

  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem(USER_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [activeMunicipalityId, setActiveMunicipalityIdState] = useState(() => {
    try {
      const stored = localStorage.getItem(MUNICIPALITY_KEY);
      return stored ? Number(stored) : null;
    } catch {
      return null;
    }
  });

  const [municipalities, setMunicipalities] = useState([]);
  const [currentWorkspace, setCurrentWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Fetch current workspace and municipalities
  const fetchWorkspace = useCallback(async (authToken) => {
    const activeToken = authToken || token;
    const headers = {
      Accept: 'application/json',
      ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
    };

    try {
      const muniRes = await fetch('http://127.0.0.1:8000/api/municipalities', { headers });
      if (muniRes.ok) {
        const muniData = await muniRes.json();
        setMunicipalities(Array.isArray(muniData) ? muniData : (muniData.data || []));
      }

      if (activeToken) {
        const wsRes = await fetch('http://127.0.0.1:8000/api/workspace/current', { headers });
        if (wsRes.ok) {
          const wsData = await wsRes.json();
          setCurrentWorkspace(wsData);
          if (wsData?.municipality?.id && !activeMunicipalityId) {
            setActiveMunicipalityIdState(wsData.municipality.id);
          }
        }
      }
    } catch (err) {
      console.warn('Could not fetch municipal workspace details:', err);
    }
  }, [token, activeMunicipalityId]);

  // Initial verification on mount
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      if (storedToken) {
        try {
          const res = await fetch('http://127.0.0.1:8000/api/user', {
            headers: {
              Accept: 'application/json',
              Authorization: `Bearer ${storedToken}`,
            },
          });

          if (res.ok) {
            const data = await res.json();
            if (isMounted) {
              const freshUser = data.user || data;
              setUser(freshUser);
              localStorage.setItem(USER_KEY, JSON.stringify(freshUser));
              await fetchWorkspace(storedToken);
            }
          } else {
            // Token expired or deactivated
            if (isMounted) {
              setToken(null);
              setUser(null);
              localStorage.removeItem(TOKEN_KEY);
              localStorage.removeItem(USER_KEY);
            }
          }
        } catch (err) {
          console.warn('Auth token verification skipped:', err);
        }
      } else {
        // Fetch public list of municipalities
        await fetchWorkspace(null);
      }

      if (isMounted) setLoading(false);
    }

    initAuth();

    return () => {
      isMounted = false;
    };
  }, [fetchWorkspace]);

  // Login handler
  const login = useCallback(async (email, password) => {
    setAuthError(null);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errorMsg = data.errors
          ? Object.values(data.errors).flat().join(' ')
          : (data.message || 'Authentication failed. Please verify your credentials.');
        setAuthError(errorMsg);
        return { success: false, message: errorMsg };
      }

      const receivedToken = data.token;
      const receivedUser = data.user;

      setToken(receivedToken);
      setUser(receivedUser);
      localStorage.setItem(TOKEN_KEY, receivedToken);
      localStorage.setItem(USER_KEY, JSON.stringify(receivedUser));

      if (receivedUser?.municipality_id) {
        setActiveMunicipalityIdState(receivedUser.municipality_id);
        localStorage.setItem(MUNICIPALITY_KEY, String(receivedUser.municipality_id));
      }

      await fetchWorkspace(receivedToken);

      return { success: true, user: receivedUser };
    } catch (err) {
      const msg = err.message || 'Network error while connecting to authentication server.';
      setAuthError(msg);
      return { success: false, message: msg };
    }
  }, [fetchWorkspace]);

  // Logout handler
  const logout = useCallback(async () => {
    try {
      if (token) {
        await fetch('http://127.0.0.1:8000/api/logout', {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch (err) {
      console.warn('Logout API notification failed:', err);
    } finally {
      setToken(null);
      setUser(null);
      setCurrentWorkspace(null);
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
  }, [token]);

  // Update profile
  const updateProfile = useCallback(async (profileData) => {
    if (!token) return { success: false, message: 'Not authenticated' };

    try {
      const res = await fetch('http://127.0.0.1:8000/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
      });

      const data = await res.json();

      if (!res.ok) {
        const msg = data.errors ? Object.values(data.errors).flat().join(' ') : (data.message || 'Update failed');
        return { success: false, message: msg };
      }

      const updated = data.user;
      setUser(updated);
      localStorage.setItem(USER_KEY, JSON.stringify(updated));
      return { success: true, user: updated, message: data.message };
    } catch (err) {
      return { success: false, message: err.message };
    }
  }, [token]);

  // Change password
  const changePassword = useCallback(async (currentPassword, newPassword, newPasswordConfirmation) => {
    if (!token) return { success: false, message: 'Not authenticated' };

    try {
      const res = await fetch('http://127.0.0.1:8000/api/user/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
          new_password_confirmation: newPasswordConfirmation,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const msg = data.errors ? Object.values(data.errors).flat().join(' ') : (data.message || 'Password change failed');
        return { success: false, message: msg };
      }

      return { success: true, message: data.message };
    } catch (err) {
      return { success: false, message: err.message };
    }
  }, [token]);

  // Switch municipality (system admin only)
  const switchMunicipality = useCallback((muniId) => {
    const id = Number(muniId);
    setActiveMunicipalityIdState(id);
    localStorage.setItem(MUNICIPALITY_KEY, String(id));
  }, []);

  // Compute active municipality
  const activeMunicipality = useMemo(() => {
    if (!municipalities || municipalities.length === 0) {
      return user?.municipality || null;
    }

    if (activeMunicipalityId) {
      const found = municipalities.find((m) => m.id === activeMunicipalityId);
      if (found) return found;
    }

    if (user?.municipality_id) {
      const userMuni = municipalities.find((m) => m.id === user.municipality_id);
      if (userMuni) return userMuni;
    }

    return municipalities[0] || null;
  }, [municipalities, activeMunicipalityId, user]);

  // Role helpers
  const role = user?.role || 'guest';
  const isSystemAdmin = role === 'system_admin';
  const isMunicipalityAdmin = role === 'municipality_admin' || role === 'admin';
  const isWardOfficer = role === 'ward_officer';
  const isCitizen = role === 'citizen';
  const isAdmin = isSystemAdmin || isMunicipalityAdmin;
  const isStaff = isAdmin || isWardOfficer;

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      authError,
      role,
      isSystemAdmin,
      isMunicipalityAdmin,
      isWardOfficer,
      isCitizen,
      isAdmin,
      isStaff,
      activeMunicipality,
      activeMunicipalityId: activeMunicipality?.id || null,
      municipalities,
      currentWorkspace,
      login,
      logout,
      updateProfile,
      changePassword,
      switchMunicipality,
      refreshWorkspace: () => fetchWorkspace(token),
    }),
    [
      user,
      token,
      loading,
      authError,
      role,
      isSystemAdmin,
      isMunicipalityAdmin,
      isWardOfficer,
      isCitizen,
      isAdmin,
      isStaff,
      activeMunicipality,
      municipalities,
      currentWorkspace,
      login,
      logout,
      updateProfile,
      changePassword,
      switchMunicipality,
      fetchWorkspace,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
