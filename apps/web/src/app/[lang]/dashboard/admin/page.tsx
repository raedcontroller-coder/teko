import { redirect } from "next/navigation";
import { getSession } from "../../../../actions/auth";

export default async function ObsoleteAdminPage() {
  const session = await getSession();
  
  // Se estiver logado, joga para o dashboard raiz (que agora é inteligente)
  if (session) {
    redirect("/pt/dashboard");
  }
  
  redirect("/pt/login");
}
