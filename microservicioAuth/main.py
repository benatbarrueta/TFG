import uvicorn
from fastapi import FastAPI, Depends
from fastapi.security import OAuth2PasswordBearer
from requests_oauthlib import OAuth2Session
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import sqlite3
import jwt
from dotenv import load_dotenv
import os
import datetime

# Cargar variables de entorno
load_dotenv()

# Asegurar que el directorio de la base de datos exista
DB_PATH = os.getenv("DB_PATH", "/app/data/ecotrack.db")

if not os.path.exists(os.path.dirname(DB_PATH)):
    os.makedirs(os.path.dirname(DB_PATH))

# Función para obtener conexión a SQLite
def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row 
    print("Connected to SQLite")
    return conn

app = FastAPI(
    title="Authentication API",
    description="API for user authentication and favorite lanes management.",
    version="1.0.0",
    docs_url="/docs",  # Path for Swagger documentation
    redoc_url="/redoc",  # Path for ReDoc documentation
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

# Modelo Pydantic para el registro y login de usuarios
class User(BaseModel):
    name: str
    username: str
    password: str

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI")
AUTHORIZATION_BASE_URL = os.getenv("AUTHORIZATION_BASE_URL")
TOKEN_URL = os.getenv("TOKEN_URL")
SECRET_KEY = os.getenv("SECRET_KEY")
ALLOWED_USERS = [
    "benat.barrueta@opendeusto.es",
    "a.pikatza@deusto.es",
    "gonzalez.asier@deusto.es"
]

# Función para crear un token JWT
def create_jwt_token(data: dict):
    expiration = datetime.datetime.utcnow() + datetime.timedelta(hours=1)
    data.update({"exp": expiration})
    token = jwt.encode(data, SECRET_KEY, algorithm="HS256")
    return token

# Ruta para iniciar el flujo de autenticación con Google
@app.get("/auth/google")
async def google_login():
    google = OAuth2Session(GOOGLE_CLIENT_ID, redirect_uri=GOOGLE_REDIRECT_URI, scope=["openid", "email", "profile"])
    authorization_url, _ = google.authorization_url(AUTHORIZATION_BASE_URL, access_type="offline", prompt="select_account")
    return {"authorization_url": authorization_url}

# Ruta para iniciar sesión con usuario y contraseña via Google
@app.get("/auth/google/callback")
async def google_auth_callback(code: str):
    # Inicializar sesión OAuth2 con Google
    google = OAuth2Session(GOOGLE_CLIENT_ID, redirect_uri=GOOGLE_REDIRECT_URI)
    token = google.fetch_token(TOKEN_URL, client_secret=GOOGLE_CLIENT_SECRET, code=code)

    # Obtener información del usuario desde Google
    user_info = google.get("https://www.googleapis.com/oauth2/v1/userinfo").json()

    if user_info["email"] not in ALLOWED_USERS:
        return JSONResponse(status_code=403, content={"error": "Acceso denegado"})
    else:
        # Conectar a SQLite
        conn = get_db_connection()
        cursor = conn.cursor()

        # Verificar si el usuario ya existe
        query = "SELECT * FROM user WHERE username=?"
        cursor.execute(query, (user_info["email"],))
        user = cursor.fetchone()

        if not user:
            # Si el usuario no existe, registrar uno nuevo
            insert_query = "INSERT INTO user (name, username, photoLink) VALUES (?, ?, ?)"
            cursor.execute(insert_query, (user_info["name"], user_info["email"], user_info["picture"]))
            conn.commit()

        cursor.close()
        conn.close()

        # Generar un token JWT para el usuario
        jwt_token = create_jwt_token({"sub": user_info["email"]})

        # Incluir la foto de perfil y el token en la respuesta
        return {
            "access_token": jwt_token,
            "token_type": "bearer",
            "user": {
                "name": user_info.get("name"),
                "email": user_info.get("email"),
                "picture": user_info.get("picture"),  # URL de la foto de perfil
            }
        }

# Ruta para cerrar sesión
@app.post("/auth/logout")
async def logout(token: str = Depends(oauth2_scheme)):
    return {"message": "User logged out successfully"}

if __name__ == "__main__":
    uvicorn.run(app, host="localhost", port=8001)
