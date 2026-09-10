declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    BAIDU_APP_KEY?: string;
    BAIDU_SECRET_KEY?: string;
    BAIDU_REDIRECT_URI?: string;
    BAIDU_TOKEN_KEY?: string;
  }
}
