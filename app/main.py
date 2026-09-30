from pathlib import Path
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.face_service import detect_faces

BASE_DIR = Path(__file__).resolve().parent.parent
STATIC_DIR = BASE_DIR / "static"
TEMPLATE_DIR = BASE_DIR / "app" / "templates"

app = FastAPI(title="IMC Photos Face", version="0.1.0")
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

@app.get("/")
def home():
    return FileResponse(TEMPLATE_DIR / "index.html")

@app.get("/api/health")
def health():
    return {"status": "online", "service": "IMC Photos Face"}

@app.post("/api/find-face")
async def find_face(file: UploadFile = File(...)):
    if file.content_type not in {"image/jpeg", "image/png", "image/webp"}:
        raise HTTPException(status_code=415, detail="Envie uma imagem JPG, PNG ou WEBP.")

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Arquivo vazio.")

    if len(content) > 12 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="A imagem deve ter no máximo 12 MB.")

    try:
        faces = detect_faces(content)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return {
        "success": True,
        "faces": len(faces),
        "message": "Análise concluída.",
        "stage": "face-detection"
    }
