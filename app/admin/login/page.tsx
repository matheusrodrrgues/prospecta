import Link from "next/link";
import { login } from "@/app/admin/actions";

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const query = await searchParams;
  return <main className="auth-shell"><form action={login} className="auth-card"><Link className="brand" href="/"><span>PROSPECTA</span><b>4.0</b></Link><div><div className="eyebrow">Área protegida</div><h1>Painel editorial.</h1><p>Entre com sua conta institucional.</p></div>{query.setup && <div className="notice">Configure as variáveis do Supabase e crie o primeiro administrador conforme o README.</div>}{query.error && <div className="notice error">E-mail ou senha inválidos.</div>}{query.forbidden && <div className="notice error">Esta conta não possui acesso editorial.</div>}<label>E-mail<input name="email" type="email" required /></label><label>Senha<input name="password" type="password" required minLength={8} /></label><button className="button">Entrar</button></form></main>;
}
