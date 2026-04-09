import {
  RedirectToSignIn,
  SignedIn,
  UserButton,
} from '@neondatabase/neon-js/auth/react/ui';

const containerStyle = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '1.25rem',
  background: 'linear-gradient(180deg, #f8f8ff 0%, #ffffff 100%)',
} as const;

const cardStyle = {
  width: 'min(100%, 42rem)',
  border: '1px solid #e9e9f4',
  borderRadius: '1rem',
  backgroundColor: '#fff',
  boxShadow: '0 12px 32px rgba(15, 23, 42, 0.08)',
  padding: 'clamp(1.25rem, 3vw, 2rem)',
  textAlign: 'center' as const,
} as const;

export function Home() {
  return (
    <>
      <SignedIn>
        <div style={containerStyle}>
          <div style={cardStyle}>
            <h1 style={{ marginTop: 0 }}>Welcome!</h1>
            <p style={{ marginBottom: '1.25rem' }}>
              You're successfully authenticated.
            </p>
            <UserButton />
          </div>
        </div>
      </SignedIn>
      <RedirectToSignIn />
    </>
  );
}
