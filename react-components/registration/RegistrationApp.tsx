import { RegistrationWizard } from "./components/RegistrationWizard.tsx";
import "./registration.css";

export function RegistrationApp() {
  return (
    <div className="reg-root" dir="rtl" lang="fa">
      <RegistrationWizard />
    </div>
  );
}

export default RegistrationApp;
