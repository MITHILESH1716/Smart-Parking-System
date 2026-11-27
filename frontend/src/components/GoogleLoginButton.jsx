import { GoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth.jsx";
import { api } from "../api.js";
export default function GoogleLoginButton() {
const navigate = useNavigate();
const { login } = useAuth();
const handleSuccess = async (credentialResponse) => {
try {
if (!credentialResponse.credential) throw new Error("Google did not return a sign-in credential.");
const data = await api("/auth/google", {
  method: "POST",
  body: { credential: credentialResponse.credential },
  auth: false,
});
login(data);
navigate(data.role === "ADMIN" ? "/admin" : "/", { replace: true });
} catch (err) {
alert(err.message || "Google sign-in failed. Please try again.");
}
};
return (
  <div className="google-login">
    <div className="google-login-divider"><span>or continue with</span></div>
    <GoogleLogin
      onSuccess={handleSuccess}
      onError={() => alert("Google sign-in was cancelled or failed")}
      theme="outline"
      size="large"
      shape="pill"
      text="continue_with"
      logo_alignment="center"
      width="320"
    />
  </div>
);
}
