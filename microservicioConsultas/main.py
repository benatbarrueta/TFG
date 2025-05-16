import uvicorn
import sqlite3
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
from dotenv import load_dotenv
from pydantic import BaseModel
import os
import base64

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
    title="Nature API",
    description="API for getting answer of animal, plant an questions.",
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

class ImagePath(BaseModel):
    image_path: str

class Question(BaseModel):
    question: str

class Image(BaseModel):
    base64: str
    latitude: float
    longitude: float
    imageName: str
    user: str

class ChatQuestion(BaseModel):
    question: str
    context: str
    chat_history: list[dict]

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))



@app.get("/convertImage")
async def image_to_base64():
    with open("../../modelo/perro.jpeg", "rb") as image_file:
        encoded_string = base64.b64encode(image_file.read()).decode("utf-8")
    return encoded_string

@app.post("/nature/getAnimal")
async def get_animal_from_API(image: ImagePath):
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "user",
                "content": [
                    """Analiza la imagen y devuelve EXACTAMENTE en este formato (sin corchetes ni información adicional):
                    \nNombre: nombre del animal
                    \nPeso máximo: número kg
                    \nTamaño máximo: número m de longitud
                    
                    \nPor ejemplo:
                    \nNombre: Oso pardo
                    \nPeso máximo: 700 kg
                    \nTamaño máximo: 3 m de longitud""", 
                    *map(lambda x: {"image": x, "resize": 768}, [image.image_path]),
                ],
            }
        ],
    )
    return {"result": response.choices[0].message.content}

@app.post("/nature/getAnimalByFootprint")
async def get_animal_by_footprint_from_API(image: ImagePath):
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "user",
                "content": [
                    """Analiza la huella y devuelve EXACTAMENTE en este formato (sin corchetes ni información adicional):
                    \nNombre: nombre del animal
                    \nPeso máximo: número kg
                    \nTamaño máximo: número m de longitud
                    
                    \nPor ejemplo:
                    \nNombre: Oso pardo
                    \nPeso máximo: 700 kg
                    \nTamaño máximo: 3 m de longitud""",
                    *map(lambda x: {"image": x, "resize": 768}, [image.image_path]),
                ],
            }
        ],
    )
    return {"result": response.choices[0].message.content}

@app.post("/nature/getPlant")
async def get_plant_from_API(image: ImagePath):
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "user",
                "content": [
                    """Analiza la imagen y devuelve EXACTAMENTE en este formato (sin corchetes ni información adicional):
                    \nNombre: nombre de la planta
                    \nAltura máxima: número m
                    \nFamilia: nombre de la familia
                    \nGrosor máximo: número cm
                    
                    \nPor ejemplo:
                    \nNombre: Roble común
                    \nAltura máxima: 35 m\nFamilia: Fagaceae\nGrosor máximo: 200 cm""", 
                    *map(lambda x: {"image": x, "resize": 768}, [image.image_path]),
                ],
            }
        ],
    )
    return {"result": response.choices[0].message.content}

@app.post("/nature/getAnswer")
async def get_answer_from_API(chat_question: ChatQuestion):
    # Construir el mensaje inicial con instrucciones más flexibles
    system_message = f"""Eres un experto en naturaleza que puede responder preguntas relacionadas con la imagen analizada.
    Contexto de la imagen: {chat_question.context}
    
    IMPORTANTE:
    - Puedes responder preguntas generales sobre la imagen como "qué más información tienes" o "qué otros datos puedes darme"
    - Para estas preguntas generales, proporciona información adicional relevante sobre el espécimen en la imagen
    - Si la pregunta es sobre algo completamente no relacionado con la naturaleza o el espécimen en la imagen, responde:
    "Lo siento, solo puedo responder preguntas relacionadas con la especie de la imagen o información sobre la naturaleza relacionada. ¿Qué te gustaría saber sobre esto?"
    
    Mantén tus respuestas enfocadas en información científica y relevante sobre el espécimen o su hábitat natural.
    """
    
    messages = [
        {"role": "system", "content": system_message}
    ]
    
    # Añadir el historial de chat
    for message in chat_question.chat_history:
        messages.append({
            "role": "user" if message.get("isUser") else "assistant",
            "content": message.get("text", "")
        })
    
    # Añadir la pregunta actual
    messages.append({
        "role": "user",
        "content": chat_question.question
    })

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=messages,
        temperature=0.7
    )
    
    return {"result": response.choices[0].message.content}

@app.get("/nature/getUsers")
async def get_users():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM user")
    users = cursor.fetchall()
    return {"result": users}

@app.post("/nature/saveInDB")
async def save_in_db(image: Image):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM user WHERE username = ?", (image.user,))
    user = cursor.fetchone()
    if user is None:
        return {"result": "User not found"}
    
    cursor.execute("INSERT INTO photo (base64, latitude, longitude, imageName, user_id) VALUES (?, ?, ?, ?, ?)", (image.base64, image.latitude, image.longitude, image.imageName, user[0]))
    conn.commit()
    return {"result": "Image saved in DB"}

@app.get("/nature/getPhotos")
async def get_photos():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM photo")
    photos = cursor.fetchall()
    return {"result": photos}

@app.get("/nature/getPhotosByUser/{user}")
async def get_photos_by_user(user: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM photo WHERE user = ?", (user,))
    photos = cursor.fetchall()
    return {"result": photos}

@app.get("/nature/getPhotosById/{id}")
async def get_photos_by_id(id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM photo WHERE id = ?", (id,))
    photo = cursor.fetchone()
    return {"result": photo}

@app.get("/nature/getPhotosByUsername/{username}")
async def get_photos_by_user_id(username: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM user WHERE username = ?", (username,))
    user_id = cursor.fetchone()
    if user_id is None:
        return {"result": "User not found"}
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM photo WHERE user_id = ?", (user_id[0],))
    photos = cursor.fetchall()
    return {"result": photos}

@app.delete("/nature/deletePhoto/{id}")
async def delete_photo(id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM photo WHERE id = ?", (id,))
    photo = cursor.fetchone()
    if photo is None:
        return {"result": "Photo not found"}

    cursor.execute("DELETE FROM photo WHERE id = ?", (id,))
    conn.commit()
    return {"result": "Photo deleted"}

if __name__ == "__main__":
    uvicorn.run(app, host="localhost", port=8000)