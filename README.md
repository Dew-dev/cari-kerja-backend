
here's the env needed:

# Application
APP_HOST=http://localhost:5000
APP_ENV=development
APP_PORT=5000
FE_URL=http://localhost:5173

# CORS
CORS_ORIGINS=http://localhost:5173

# Database
# POSTGRESQL_URL=postgresql://postgres:postgres@localhost:5432/sample
POSTGRESQL_URL=your_postgresql_connection_string

# JWT Secret
ACCESS_TOKEN_SECRET=your_access_token_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret
ACCESS_SIGN_OPTIONS='{"expiresIn": "1d"}'
REFRESH_SIGN_OPTIONS='{"expiresIn": "1d"}'

# BASIC AUTH
USERNAME_BASIC=your_basic_auth_username
PASSWORD_BASIC=your_basic_auth_password

# Google Oauth 2.0
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_SECRET_KEY=your_google_client_secret

# Cloud flare R2
R2_ENDPOINT_S3_CLIENT=your_r2_endpoint
R2_USER_API_TOKEN=your_r2_api_token
R2_ACCESS_S3_USER=your_r2_access_key
R2_SECRET_S3_USER=your_r2_secret_key
R2_BUCKET_NAME=your_bucket_name

CORS_ORIGINS=http://localhost:5173
# Mail Configuration
MAIL_HOST=smtp.hostinger.com
MAIL_PORT=587
MAIL_SECURE=true
MAIL_FROM="Job Portal <your_email@domain.com>"

MAIL_USER=your_email@domain.com
MAIL_PASS=your_mail_password
FRONTEND_URL=http://localhost:5173
