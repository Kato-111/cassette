import { isAuthConfigured } from "@/lib/auth";
import { LogoutSection } from "../_components/logout-section";
import { SettingsContent } from "../_components/settings-content";

export const dynamic = "force-dynamic";

const SessionSettingsPage = () => {
  const authConfigured = isAuthConfigured();

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden pt-4">
      <SettingsContent title="Session" className="gap-6">
        {authConfigured ? <LogoutSection /> : null}
      </SettingsContent>
    </div>
  );
};

export default SessionSettingsPage;
