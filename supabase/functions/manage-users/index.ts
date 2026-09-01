import { createClient } from "npm:@supabase/supabase-js@2";

const allowedOrigins = new Set([
  "https://sistema.cysrepuestos.cl",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
]);

const allowedRoles = new Set(["admin", "vendedor", "bodega"]);

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin");

  return {
    ...(origin && allowedOrigins.has(origin)
      ? {
          "Access-Control-Allow-Origin": origin,
        }
      : {}),
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}

function jsonResponse(
  req: Request,
  body: Record<string, unknown>,
  status = 200,
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...getCorsHeaders(req),
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

function isValidRole(value: unknown): value is "admin" | "vendedor" | "bodega" {
  return typeof value === "string" && allowedRoles.has(value);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: getCorsHeaders(req),
    });
  }

  if (req.method !== "POST") {
    return jsonResponse(
      req,
      {
        message: "Método no permitido.",
      },
      405,
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");

  const publishableKey = Deno.env.get("SUPABASE_ANON_KEY");

  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !publishableKey || !serviceRoleKey) {
    return jsonResponse(
      req,
      {
        message: "La administración de usuarios no está configurada.",
      },
      500,
    );
  }

  const authorization = req.headers.get("Authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return jsonResponse(
      req,
      {
        message: "Debes iniciar sesión.",
      },
      401,
    );
  }

  // Cliente con la identidad REAL
  // del usuario conectado.
  const userClient = createClient(supabaseUrl, publishableKey, {
    global: {
      headers: {
        Authorization: authorization,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data: userData, error: userError } = await userClient.auth.getUser();

  if (userError || !userData.user) {
    return jsonResponse(
      req,
      {
        message: "La sesión no es válida o expiró.",
      },
      401,
    );
  }

  // La verificación de owner ocurre
  // utilizando su JWT, no service_role.
  const { data: canManage, error: permissionError } = await userClient.rpc(
    "cys_can_manage_users",
  );

  if (permissionError || canManage !== true) {
    return jsonResponse(
      req,
      {
        message: "No tienes permisos para administrar usuarios.",
      },
      403,
    );
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  let body: Record<string, unknown>;

  try {
    body = await req.json();
  } catch {
    return jsonResponse(
      req,
      {
        message: "La solicitud no es válida.",
      },
      400,
    );
  }

  const action = body.action;

  // ========================================================
  // LISTAR USUARIOS
  // ========================================================

  if (action === "list") {
    const { data: profileData, error: profilesError } = await adminClient
      .from("profiles")
      .select(
        `
            id,
            full_name,
            role,
            active,
            account_type,
            receives_monthly_report,
            created_at,
            updated_at
          `,
      )
      .order("created_at", {
        ascending: true,
      });

    if (profilesError) {
      console.error("Error leyendo perfiles:", profilesError);

      return jsonResponse(
        req,
        {
          message: "No fue posible cargar los usuarios.",
        },
        500,
      );
    }

    const { data: authData, error: authError } =
      await adminClient.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });

    if (authError) {
      console.error("Error leyendo Auth:", authError);

      return jsonResponse(
        req,
        {
          message: "No fue posible cargar las cuentas.",
        },
        500,
      );
    }

    const authById = new Map(authData.users.map((user) => [user.id, user]));

    const users = (profileData ?? []).map((profile) => {
      const authUser = authById.get(profile.id);

      return {
        id: profile.id,
        fullName: profile.full_name,
        email: authUser?.email ?? null,
        role: profile.role,
        active: profile.active,
        accountType: profile.account_type,
        receivesMonthlyReport: profile.receives_monthly_report,
        createdAt: profile.created_at,
        manageable:
          profile.account_type === "staff" ||
          profile.account_type === "pending",
      };
    });

    return jsonResponse(req, {
      users,
    });
  }

  // ========================================================
  // INVITAR STAFF
  // ========================================================

  if (action === "invite") {
    const fullName =
      typeof body.fullName === "string" ? body.fullName.trim() : "";

    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    const role = body.role;

    const receivesMonthlyReport = body.receivesMonthlyReport === true;

    if (fullName.length < 2 || fullName.length > 100) {
      return jsonResponse(
        req,
        {
          message: "El nombre no es válido.",
        },
        400,
      );
    }

    if (!email || !email.includes("@") || email.length > 254) {
      return jsonResponse(
        req,
        {
          message: "El correo no es válido.",
        },
        400,
      );
    }

    if (!isValidRole(role)) {
      return jsonResponse(
        req,
        {
          message: "El rol no es válido.",
        },
        400,
      );
    }

    if (receivesMonthlyReport && role !== "admin") {
      return jsonResponse(
        req,
        {
          message:
            "Solo los administradores pueden recibir el reporte mensual.",
        },
        400,
      );
    }

    const { data: inviteData, error: inviteError } =
      await adminClient.auth.admin.inviteUserByEmail(email, {
        data: {
          full_name: fullName,
        },
        redirectTo: `${
          request.headers.get("origin") === "http://localhost:5173"
            ? "http://localhost:5173"
            : "https://sistema.cysrepuestos.cl"
        }/establecer-contrasena`,
      });

    if (inviteError || !inviteData.user) {
      console.error("Error invitando usuario:", inviteError);

      return jsonResponse(
        req,
        {
          message: inviteError?.message ?? "No fue posible invitar al usuario.",
        },
        400,
      );
    }

    const { data: profile, error: profileError } = await adminClient
      .from("profiles")
      .update({
        full_name: fullName,
        role,
        account_type: "staff",
        active: true,
        receives_monthly_report: receivesMonthlyReport,
      })
      .eq("id", inviteData.user.id)
      .select(
        `
            id,
            full_name,
            role,
            active,
            account_type,
            receives_monthly_report
          `,
      )
      .single();

    if (profileError) {
      console.error("Error configurando perfil:", profileError);

      // Evitamos dejar una cuenta
      // Auth huérfana si falla
      // la configuración del perfil.
      await adminClient.auth.admin.deleteUser(inviteData.user.id);

      return jsonResponse(
        req,
        {
          message: "No fue posible configurar la cuenta.",
        },
        500,
      );
    }

    return jsonResponse(
      req,
      {
        message: "Invitación enviada correctamente.",
        user: {
          id: profile.id,
          fullName: profile.full_name,
          email,
          role: profile.role,
          active: profile.active,
          accountType: profile.account_type,
          receivesMonthlyReport: profile.receives_monthly_report,
        },
      },
      201,
    );
  }

  // ========================================================
  // MODIFICAR STAFF
  // ========================================================

  if (action === "update") {
    const userId = typeof body.userId === "string" ? body.userId : "";

    const fullName =
      typeof body.fullName === "string" ? body.fullName.trim() : "";

    const role = body.role;

    const active = body.active;

    const receivesMonthlyReport = body.receivesMonthlyReport === true;

    if (!userId) {
      return jsonResponse(
        req,
        {
          message: "Usuario inválido.",
        },
        400,
      );
    }

    if (!isValidRole(role)) {
      return jsonResponse(
        req,
        {
          message: "El rol no es válido.",
        },
        400,
      );
    }

    if (typeof active !== "boolean") {
      return jsonResponse(
        req,
        {
          message: "El estado no es válido.",
        },
        400,
      );
    }

    if (fullName.length < 2 || fullName.length > 100) {
      return jsonResponse(
        req,
        {
          message: "El nombre no es válido.",
        },
        400,
      );
    }

    if (receivesMonthlyReport && role !== "admin") {
      return jsonResponse(
        req,
        {
          message: "Solo un administrador puede recibir el reporte mensual.",
        },
        400,
      );
    }

    const { data: target, error: targetError } = await adminClient
      .from("profiles")
      .select("id, account_type")
      .eq("id", userId)
      .single();

    if (targetError || !target) {
      return jsonResponse(
        req,
        {
          message: "El usuario no existe.",
        },
        404,
      );
    }

    // Un owner NO puede modificar
    // owner/developer mediante esta acción.
    if (target.account_type !== "staff") {
      return jsonResponse(
        req,
        {
          message:
            "Esta cuenta no puede modificarse desde administración de usuarios.",
        },
        403,
      );
    }

    const { data: updated, error: updateError } = await adminClient
      .from("profiles")
      .update({
        full_name: fullName,
        role,
        active,
        receives_monthly_report: receivesMonthlyReport,
      })
      .eq("id", userId)
      .select(
        `
            id,
            full_name,
            role,
            active,
            account_type,
            receives_monthly_report
          `,
      )
      .single();

    if (updateError) {
      console.error("Error actualizando usuario:", updateError);

      return jsonResponse(
        req,
        {
          message: "No fue posible actualizar el usuario.",
        },
        500,
      );
    }

    return jsonResponse(req, {
      message: "Usuario actualizado correctamente.",
      user: updated,
    });
  }

  // ========================================================
  // ACTIVAR/DESACTIVAR REPORTE PARA OWNER
  // ========================================================

  if (action === "set-report-recipient") {
    const userId = typeof body.userId === "string" ? body.userId : "";

    const enabled = body.enabled;

    if (!userId || typeof enabled !== "boolean") {
      return jsonResponse(
        req,
        {
          message: "La solicitud no es válida.",
        },
        400,
      );
    }

    const { data: target, error: targetError } = await adminClient
      .from("profiles")
      .select("id, account_type, role")
      .eq("id", userId)
      .single();

    if (targetError || !target) {
      return jsonResponse(
        req,
        {
          message: "El usuario no existe.",
        },
        404,
      );
    }

    const canReceive =
      target.account_type === "owner" ||
      (target.account_type === "staff" && target.role === "admin");

    if (enabled && !canReceive) {
      return jsonResponse(
        req,
        {
          message: "Esta cuenta no puede recibir el reporte mensual.",
        },
        400,
      );
    }

    const { error: updateError } = await adminClient
      .from("profiles")
      .update({
        receives_monthly_report: enabled,
      })
      .eq("id", userId);

    if (updateError) {
      return jsonResponse(
        req,
        {
          message: "No fue posible actualizar el destinatario.",
        },
        500,
      );
    }

    return jsonResponse(req, {
      message: enabled ? "Destinatario activado." : "Destinatario desactivado.",
    });
  }

  return jsonResponse(
    req,
    {
      message: "Acción no válida.",
    },
    400,
  );
});
