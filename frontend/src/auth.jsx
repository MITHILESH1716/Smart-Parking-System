import { createContext, useContext, useState } from 'react';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const t = localStorage.getItem('token');
    return t ? { name: localStorage.getItem('name'), email: localStorage.getItem('email'), role: localStorage.getItem('role') } : null;
  });

  const login = (d) => {
    localStorage.setItem('token', d.token);
    localStorage.setItem('name', d.name);
    localStorage.setItem('email', d.email);
    localStorage.setItem('role', d.role);
    setUser({ name: d.name, email: d.email, role: d.role });
  };
  const logout = () => { localStorage.clear(); setUser(null); };

  return <Ctx.Provider value={{ user, login, logout }}>{children}</Ctx.Provider>;
}
