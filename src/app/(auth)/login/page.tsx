import { appName } from "@/lib/config";
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return <LoginForm appName={appName} />;
}
