import { signInWithPopup, signOut } from "firebase/auth";
import { fireAuth, googleProvider } from "./firebase";

function LoginButton({ user }) {
  const login = async () => {
    try {
      await signInWithPopup(fireAuth, googleProvider);
    } catch (error) {
      console.error("Login failed:", error);
      alert("Login failed. Please check Firebase settings.");
    }
  };

  const logout = async () => {
    await signOut(fireAuth);
  };

  if (user) {
    return (
      <div>
        <p>Logged in as: {user.displayName || user.email}</p>
        <button onClick={logout}>Logout</button>
      </div>
    );
  }

  return <button onClick={login}>Login with Google</button>;
}

export default LoginButton;