export async function onRequest(context) {
  return Response.redirect(
    "https://github.com/Amnibro/Haven/releases/download/v8.2.5/Haven-v8.2.5-80205.apk",
    302
  );
}
