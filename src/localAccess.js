const LOOPBACK_HOST = /^(localhost|127\.0\.0\.1)(?::(\d{1,5}))?$/i;

export const LOOPBACK_ADDRESS = "127.0.0.1";

export function isLocalConsoleHost(request) {
  const match = LOOPBACK_HOST.exec(request.headers.host ?? "");
  return Boolean(match && Number(match[2] ?? 80) === request.socket.localPort);
}

export function isLocalConsoleClient(request) {
  if (!isLocalConsoleHost(request)) return false;

  const { origin, host, "sec-fetch-site": fetchSite } = request.headers;
  if (fetchSite === "cross-site" || fetchSite === "same-site") return false;
  return origin === undefined || origin === new URL(`http://${host}`).origin;
}
