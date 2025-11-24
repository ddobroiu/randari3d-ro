require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
const { GoogleAuth } = require('google-auth-library');

(async () => {
  try {
    const privateKey = process.env.GOOGLE_PRIVATE_KEY ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined;
    const auth = new GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: privateKey,
        project_id: process.env.GOOGLE_PROJECT_ID,
      },
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });

    const client = await auth.getClient();
    const access = await client.getAccessToken();
    console.log('Got Google token (first 40 chars):', access.token?.slice?.(0,40));
  } catch (err) {
    console.error('Failed to get Google token:', err?.message || err);
    process.exit(1);
  }
})();
