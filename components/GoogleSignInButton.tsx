export default function GoogleSignInButton({ next }: { next: string }) {
  const href = `/api/auth/google?next=${encodeURIComponent(next)}`;
  return (
    <a
      href={href}
      className="flex w-full items-center justify-center gap-3 rounded-lg border border-line bg-card px-4 py-2.5 font-medium hover:bg-accent-soft"
    >
      <svg aria-hidden="true" width="18" height="18" viewBox="0 0 48 48">
        <path
          fill="#EA4335"
          d="M24 9.5c3.5 0 6.6 1.2 9.1 3.5l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"
        />
        <path
          fill="#4285F4"
          d="M46.5 24.5c0-1.6-.1-2.8-.4-4H24v8.1h12.9c-.3 2.2-1.7 5.4-4.8 7.6l7.4 5.7c4.4-4.1 7-10.1 7-17.4z"
        />
        <path
          fill="#FBBC05"
          d="M10.5 28.7A14.5 14.5 0 0 1 9.7 24c0-1.6.3-3.2.8-4.7l-7.9-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.8l7.9-6.1z"
        />
        <path
          fill="#34A853"
          d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.7c-2 1.4-4.8 2.4-8.5 2.4-6.3 0-11.6-4.1-13.5-9.9l-7.9 6.1C6.5 42.6 14.6 48 24 48z"
        />
      </svg>
      Continue with Google
    </a>
  );
}
