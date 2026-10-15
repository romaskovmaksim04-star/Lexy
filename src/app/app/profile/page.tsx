import { logout } from "@/app/actions";
import { currentUser } from "@/lib/auth";

export default async function Profile() {
  const user = (await currentUser())!;
  return (
    <div className="grid max-w-md gap-6">
      <h1 className="display text-3xl font-bold">Профиль</h1>
      <div className="card grid gap-1 p-6"><p className="font-bold">{user.name}</p><p className="text-muted">{user.email}</p></div>
      <form action={logout}><button className="btn btn-ghost">Выйти</button></form>
    </div>
  );
}
