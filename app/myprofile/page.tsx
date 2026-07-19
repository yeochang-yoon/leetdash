import { MyProfileSelector } from "@/app/components/my-profile-selector";
import { getDashboardData } from "@/lib/progress";

export default async function MyProfilePage() {
  const data = await getDashboardData();
  const users = data.users.map((user) => ({
    id: user.id,
    displayName: user.displayName,
    githubUsername: user.githubUsername,
  }));

  return <MyProfileSelector users={users} />;
}
