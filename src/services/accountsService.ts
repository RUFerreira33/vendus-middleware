import { ApiError } from "../errors.js";
import { supabaseAdmin } from "./supabaseAdmin.js";
import type { SupabaseClient } from "@supabase/supabase-js";

type CreateParams = { email: string; password: string; vendusClientId: number };

export class AccountsService {
  private _admin: SupabaseClient | null = null;

  private admin() {
    if (!this._admin) this._admin = supabaseAdmin; // ✅ sem ()
    return this._admin;
  }

  private normEmail(email: string) {
    return (email || "").trim().toLowerCase();
  }

  private isEmailExistsError(err: any) {
    // supabase costuma devolver 422 + code email_exists (ou msg "User already registered")
    return err?.code === "email_exists" || err?.status === 422;
  }

  private async getUserByEmail(email: string) {
    const admin = this.admin();

    // Nota: listUsers é paginado; aqui vai só à 1ª página (200)
    const { data, error } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });

    if (error) {
      throw new ApiError(400, "Erro a listar utilizadores no Supabase", error);
    }

    const user = data?.users?.find((u) => (u.email || "").toLowerCase() === email);
    if (!user) {
      throw new ApiError(404, "Utilizador já existe mas não foi encontrado pelo admin", { email });
    }

    return user;
  }

  private async ensureCustomerAccountLink(params: {
    userId: string;
    email: string;
    vendusClientId: number;
  }) {
    const admin = this.admin();
    const { userId, email, vendusClientId } = params;

    const { data: existing, error: selErr } = await admin
      .from("customer_accounts")
      .select("user_id, vendus_client_id, email, tipo_utilizador")
      .eq("user_id", userId)
      .limit(1);

    if (selErr) throw new ApiError(400, "Erro a consultar customer_accounts", selErr);

    // se já existe link → update idempotente
    if (existing && existing.length > 0) {
      const { error: updErr } = await admin
        .from("customer_accounts")
        .update({ vendus_client_id: vendusClientId, email, tipo_utilizador: 1 })
        .eq("user_id", userId);

      if (updErr) throw new ApiError(400, "Erro a atualizar customer_accounts", updErr);

      return { user_id: userId, vendus_client_id: vendusClientId, email, created_link: false };
    }

    // se não existe → insert
    const { error: insErr } = await admin
      .from("customer_accounts")
      .insert([{ user_id: userId, vendus_client_id: vendusClientId, email, tipo_utilizador: 1 }]);

    if (insErr) throw new ApiError(400, "Erro a inserir em customer_accounts", insErr);

    return { user_id: userId, vendus_client_id: vendusClientId, email, created_link: true };
  }

  async createUserAndLink(params: CreateParams) {
    const email = this.normEmail(params.email);
    const password = params.password || "";
    const vendusClientId = params.vendusClientId;

    if (!email) throw new ApiError(400, "email é obrigatório");
    if (password.length < 8) throw new ApiError(400, "password deve ter pelo menos 8 caracteres");
    if (!vendusClientId) throw new ApiError(400, "vendusClientId é obrigatório");

    const admin = this.admin();

    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    // Se email já existe → obtém user e garante link em customer_accounts
    if (error && this.isEmailExistsError(error)) {
      const existingUser = await this.getUserByEmail(email);
      const link = await this.ensureCustomerAccountLink({
        userId: existingUser.id,
        email,
        vendusClientId,
      });

      return { ...link, existed_user: true };
    }

    if (error || !data?.user) {
      throw new ApiError(400, "Erro a criar utilizador no Supabase", error);
    }

    const userId = data.user.id;

    const link = await this.ensureCustomerAccountLink({
      userId,
      email,
      vendusClientId,
    });

    return { ...link, existed_user: false };
  }
}
