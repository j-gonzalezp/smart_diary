'use client';
import { useAuth } from './AuthProvider';
import { signOutUser } from '@/lib/actions/user.actions'; 
import { useRouter } from 'next/navigation'; 

export default function Navbar() {
  const { user } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOutUser();
  };

  return (
    <nav>
      {/* ... otros elementos ... */}
      {user ? (
        <>
          <span>Hola, {user.fullName}</span>
          <button onClick={handleSignOut}>Cerrar Sesión</button>
        </>
      ) : (
        <a href="/sign-in">Iniciar Sesión</a>
      )}
    </nav>
  );
}