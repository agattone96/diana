import { AuthView } from '@neondatabase/neon-js/auth/react/ui';
import { useParams } from 'react-router-dom';

const wrapperStyle = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '1rem',
  background: 'linear-gradient(180deg, #f8f8ff 0%, #ffffff 100%)',
} as const;

const contentStyle = {
  width: 'min(100%, 28rem)',
} as const;

export function Auth() {
  const { pathname } = useParams();
  return (
    <div style={wrapperStyle}>
      <div style={contentStyle}>
        <AuthView pathname={pathname} />
      </div>
    </div>
  );
}
