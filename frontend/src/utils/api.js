const API = "http://127.0.0.1:8000";

export async function apiFetch(url, options = {}) {
  let token = localStorage.getItem("token");

  let res = await fetch(API + url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });

  // 🔥 token expired
  if (res.status === 401) {
    const refresh = localStorage.getItem("refresh_token");

    const r = await fetch(API + "/api/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refresh }),
    });

    if (!r.ok) {
      localStorage.clear();
      window.location.href = "/admin/login";
      return;
    }

    const data = await r.json();
    localStorage.setItem("token", data.access_token);

    // retry original request
    return fetch(API + url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${data.access_token}`,
      },
    });
  }

  return res;
}