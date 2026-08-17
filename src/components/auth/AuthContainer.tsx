"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { FirebaseError } from "firebase/app";
import { useRouter } from "next/navigation";
import { loginWithEmail, registerWithEmail } from "@/lib/firebase/auth.service";
import { AuthSwitch } from "./AuthSwitch";
import { LoginForm, type LoginData } from "./LoginForm";
import { RegisterForm, type RegisterData } from "./RegisterForm";
import { AuthLoadingScreen } from "./AuthLoadingScreen";
import { useAuth } from "@/contexts/AuthContext";

const initialLoginData: LoginData = { email: "", password: "" };
const initialRegisterData: RegisterData = {
  fullName: "",
  email: "",
  password: "",
  confirmPassword: "",
};

const authErrorMessages: Record<string, string> = {
  "auth/email-already-in-use": "Este correo ya está registrado.",
  "auth/invalid-email": "El correo electrónico no es válido.",
  "auth/weak-password": "La contraseña debe tener al menos 6 caracteres.",
  "auth/invalid-credential": "Correo o contraseña incorrectos.",
  "auth/too-many-requests": "Demasiados intentos. Espera un momento antes de continuar.",
  "auth/network-request-failed": "No fue posible conectar con Firebase. Revisa tu conexión.",
  "auth/operation-not-allowed": "El acceso con correo y contraseña no está habilitado en Firebase.",
  "permission-denied": "Firestore rechazó el perfil. La cuenta no fue completada; revisa sus reglas de seguridad.",
  "firestore/permission-denied": "Firestore rechazó el perfil. La cuenta no fue completada; revisa sus reglas de seguridad.",
};

function getAuthErrorMessage(error: unknown) {
  if (!(error instanceof FirebaseError)) {
    return "Ocurrió un error inesperado. Inténtalo nuevamente.";
  }

  return authErrorMessages[error.code] ?? "No fue posible completar la operación.";
}

export function AuthContainer() {
  const router = useRouter();
  const { setIsRegistering } = useAuth();
  const [isHydrated, setIsHydrated] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [loginData, setLoginData] = useState(initialLoginData);
  const [registerData, setRegisterData] = useState(initialRegisterData);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // El formulario no se renderiza en SSR para impedir un submit nativo pre-hidratación.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsHydrated(true);
  }, []);

  const updateLogin = (field: keyof LoginData) => (event: ChangeEvent<HTMLInputElement>) => {
    setLoginData((current) => ({ ...current, [field]: event.target.value }));
  };

  const updateRegister = (field: keyof RegisterData) => (event: ChangeEvent<HTMLInputElement>) => {
    setRegisterData((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    setError("");
    setSuccess("");
    setIsSubmitting(true);
    setIsRegistering(true);

    try {
      await loginWithEmail(loginData.email, loginData.password);
      router.replace("/mapa");
    } catch (authError) {
      setError(getAuthErrorMessage(authError));
    } finally {
      setIsRegistering(false);
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    setError("");
    setSuccess("");

    if (registerData.password !== registerData.confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setIsSubmitting(true);

    try {
      await registerWithEmail(registerData.fullName, registerData.email, registerData.password);
      setLoginData({ email: registerData.email.trim(), password: "" });
      setRegisterData(initialRegisterData);
      setIsLogin(true);
      setSuccess("Cuenta creada correctamente. Ahora puedes iniciar sesión.");
    } catch (authError) {
      setError(getAuthErrorMessage(authError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const changeView = (nextIsLogin: boolean) => {
    if (isSubmitting) return;
    setError("");
    setSuccess("");
    setIsLogin(nextIsLogin);
  };

  if (!isHydrated) return <AuthLoadingScreen />;

  return (
    <main className={`relative min-h-screen overflow-hidden px-4 py-10 transition-all duration-500 sm:px-6 ${isLogin ? "bg-emerald-100 text-slate-900" : "bg-emerald-900 text-white"}`}>
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-teal-300/20 blur-3xl" />

      <section className="relative mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-5xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-3xl bg-white shadow-2xl shadow-emerald-950/20 md:grid-cols-[0.8fr_1.2fr]">
          <aside className={`flex flex-col justify-between p-7 transition-all duration-500 sm:p-10 ${isLogin ? "bg-teal-600" : "bg-emerald-800"}`}>
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.28em] text-white/75">BioGrid</p>
              <h1 className="mt-6 text-3xl font-bold leading-tight text-white sm:text-4xl">
                {isLogin ? "Tu ecosistema comienza aquí." : "Cultivemos un futuro mejor."}
              </h1>
              <p className="mt-4 leading-relaxed text-white/80">
                {isLogin ? "Accede a tus proyectos, datos y comunidad en un solo lugar." : "Crea tu cuenta y conecta tecnología, personas y sostenibilidad."}
              </p>
            </div>
            <div className="mt-8">
              <AuthSwitch isLogin={isLogin} onChange={changeView} />
            </div>
          </aside>

          <div className="p-7 sm:p-10 md:p-12">
            <div className="mx-auto max-w-md">
              <p className="text-sm font-semibold text-emerald-700">{isLogin ? "Bienvenido de vuelta" : "Únete a BioGrid"}</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{isLogin ? "Iniciar sesión" : "Crear cuenta"}</h2>
              <p className="mb-7 mt-2 text-sm text-slate-500">{isLogin ? "Ingresa tus credenciales para continuar." : "Completa tus datos para comenzar."}</p>

              {error && <p role="alert" className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}
              {success && <p role="status" className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">{success}</p>}
              {isLogin ? (
                <LoginForm data={loginData} isSubmitting={isSubmitting} onChange={updateLogin} onSubmit={handleLogin} />
              ) : (
                <RegisterForm data={registerData} isSubmitting={isSubmitting} onChange={updateRegister} onSubmit={handleRegister} />
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
