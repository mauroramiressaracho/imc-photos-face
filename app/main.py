from pathlib import Path
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.face_service import detect_faces, find_matching_photos

BASE_DIR = Path(__file__).resolve().parent.parent
STATIC_DIR = BASE_DIR / "static"
TEMPLATE_DIR = BASE_DIR / "app" / "templates"

app = FastAPI(title="IMC Photos Face", version="0.2.0")
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


@app.get("/")
def home():
    return FileResponse(TEMPLATE_DIR / "index.html")


@app.get("/api/health")
def health():
    return {"status": "online", "service": "IMC Photos Face", "version": "0.2.0"}


async def _read_image(file: UploadFile) -> bytes:
    if file.content_type not in {"image/jpeg", "image/png", "image/webp"}:
        raise HTTPException(status_code=415, detail="Envie uma imagem JPG, PNG ou WEBP.")

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Arquivo vazio.")

    if len(content) > 12 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="A imagem deve ter no máximo 12 MB.")

    return content


@app.post("/api/detect-face")
async def detect_face(file: UploadFile = File(...)):
    content = await _read_image(file)
    try:
        faces = detect_faces(content)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return {"success": True, "faces": faces, "count": len(faces)}


@app.post("/api/find-face")
async def find_face(file: UploadFile = File(...)):
    content = await _read_image(file)

    try:
        result = find_matching_photos(content)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Falha durante o reconhecimento facial: {type(exc).__name__}"
        ) from exc

    return {
        "success": True,
        "faces_detected": result["faces_detected"],
        "count": len(result["matches"]),
        "matches": result["matches"],
        "threshold": result["threshold"],
        "indexed_faces": result.get("indexed_faces", 0),
        "message": "Busca facial concluída."
    }
