'use client'

import styles from './page.module.css';
import { ArrowRight, QrCode, UserPlus } from 'lucide-react';
import { login, register } from './actions';
import { useState } from 'react';

export default function Home() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true);
    setError(null);

    let result;
    if (isLogin) {
      result = await login(formData);
    } else {
      result = await register(formData);
    }

    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
    }
  };

  return (
    <main className={styles.container}>
      <div className={styles.accentMagenta}></div>
      <div className={styles.accentBlue}></div>

      <div className={`glass-panel animate-fade-in ${styles.authCard}`}>
        <div className={styles.logoContainer}>
          <QrCode className={styles.logoIcon} size={48} />
          <h1 className="text-gradient">NovaCard</h1>
        </div>

        <p className={styles.subtitle}>
          Digital Cards & Smart Attendance
        </p>

        <form action={handleSubmit} className={styles.form}>
          {!isLogin && (
            <>
              <div className={styles.inputGroup}>
                <label>Nombre Completo</label>
                <input
                  name="fullName"
                  type="text"
                  required={!isLogin}
                  className="input-base"
                  placeholder="Juan Pérez"
                />
              </div>

              <div className={styles.inputGroup}>
                <label>Rol en la plataforma</label>
                <select name="role" required={!isLogin} className="input-base" style={{ appearance: 'auto' }}>
                  <option value="admin">Administrador (Crear y gestionar cuenta de empresa)</option>
                  <option value="employee">Empleado (Acceso a tu tarjeta digital)</option>
                </select>
              </div>
            </>
          )}

          <div className={styles.inputGroup}>
            <label>Email</label>
            <input
              name="email"
              type="email"
              required
              className="input-base"
              placeholder="tu@empresa.com"
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Contraseña</label>
            <input
              name="password"
              type="password"
              required
              className="input-base"
              placeholder="••••••••"
            />
          </div>

          {error && <p className={styles.errorText}>{error}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className={`btn btn-primary ${styles.submitBtn}`}
          >
            {isLoading ? 'Cargando...' : (isLogin ? 'Ingresar' : 'Crear Cuenta')}
            {isLogin ? <ArrowRight size={18} /> : <UserPlus size={18} />}
          </button>
        </form>

        <div className={styles.footer}>
          <button
            type="button"
            className={styles.link}
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
            }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            {isLogin ? '¿No tienes cuenta? Regístrate y explora' : '¿Ya tienes cuenta? Ingresa aquí'}
          </button>
        </div>
      </div>
    </main>
  );
}
