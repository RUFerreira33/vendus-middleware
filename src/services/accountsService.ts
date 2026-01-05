import { ApiError } from "../errors.js";
import { supabaseAdmin } from "./supabaseAdmin.js";

export class AccountsService {
  private admin = supabaseAdmin();

  async createUserAndLink(params: { email: string; password: string; vendusClientId: number }) {
    const email = (params.email || "").trim().toLowerCase();
    const password = params.password || "";
    const vendusClientId = params.vendusClientId;

    if (!email) throw new ApiError(400, "email é obrigatório");
    if (password.length < 8) throw new ApiError(400, "password deve ter pelo menos 8 caracteres");
    if (!vendusClientId) throw new ApiError(400, "vendusClientId é obrigatório");

    // 1) criar user no Supabase Auth (admin API)
    const { data, error } = await this.admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (error || !data?.user) {
      throw new ApiError(400, "Erro a criar utilizador no Supabase", error);
    }

    const userId = data.user.id;

    // 2) inserir ligação user_id <-> vendus_client_id
    const { error: insertErr } = await this.admin
      .from("customer_accounts")
      .insert({
        user_id: userId,
        vendus_client_id: vendusClientId,
        email
      });

    if (insertErr) {
      throw new ApiError(400, "Erro a inserir em customer_accounts", insertErr);
    }

    return { user_id: userId, vendus_client_id: vendusClientId, email };
  }
}
