from __future__ import annotations

import threading
from pathlib import Path

import cv2
import numpy as np
import requests

MODEL_DIR = Path("/tmp/imc-face-models")
MODEL_DIR.mkdir(parents=True, exist_ok=True)

YUNET_PATH = MODEL_DIR / "face_detection_yunet_2023mar.onnx"
SFACE_PATH = MODEL_DIR / "face_recognition_sface_2021dec.onnx"

YUNET_URL = "https://github.com/opencv/opencv_zoo/raw/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx"
SFACE_URL = "https://github.com/opencv/opencv_zoo/raw/main/models/face_recognition_sface/face_recognition_sface_2021dec.onnx"

MODEL_LOCK = threading.Lock()
INDEX_LOCK = threading.Lock()

# Limite conservador para reduzir falsos positivos.
# A documentação/modelo SFace usa ~0.363 como referência de mesmo rosto;
# aqui usamos 0.46 para o primeiro teste.
MATCH_THRESHOLD = 0.46

PHOTO_IDS = [
    "16AN-a502OQre1uyIzm79YlaI7fRZ5Q5Y",
    "1h_bf-WpOLZ5rnr5hK4nobkXfUycAhonx",
    "1KIwVo4X8uO4b79Ey1IyYoj0S09eXr5F7",
    "1g2xqr5_IfnppaesA4rceaZvnnYOX5xrP",
    "1cG_YSchGQGtZULpMuX2qMLwvRaILJFq4",
    "1qpTVzNmvHu0vus4kCRIV9eknaUvhKFqv",
    "1RtQcD-A_Li-XS4rsmasjyXx-ollUITn9",
    "1N-04PxQbr8ZwUPddGjrmeTBfPHqImn8p",
    "1Bw_HsF0rwgDy4GTKkga6xBtYO4NOg7Yg",
    "12OVlJjPADkTaLsfiFn-xKdtwrx4S2q4L",
    "15H8hX6vhaCRyY67QQMIcejFvJTzuKjXo",
    "1NrvZd3gB6CPMYi9ulLLLtVi4hvuTh8zt",
    "13-g8jaszvjyoBE-BebGNB6h5IpMBbQ84",
    "142vukxIAT6wU3DALd6mQwX9RdNtMAS7A",
    "17HJ3gELBh7nqLziPUJqO5Tp69BU7x2LX",
    "14oIdzD8HGU9X02QKTcOi7uQ7tV2S7K3z",
    "1Wi99SqLv-2RPnYNX1o29syMBYEA3qI5p",
    "13cw0556OGo6KL75N7vYVw0ClvJvk4cbO",
    "1vnrUfiuLnmEhc0MfusO6uc0Ik3BkLsyr",
    "1hZviqJkBlR-KtWBP_RQCcXHnw1eJJU6x",
]

_face_index: list[dict] | None = None


def _download(url: str, path: Path) -> None:
    if path.exists() and path.stat().st_size > 100_000:
        return
    response = requests.get(url, timeout=90)
    response.raise_for_status()
    path.write_bytes(response.content)


def _ensure_models() -> None:
    with MODEL_LOCK:
        _download(YUNET_URL, YUNET_PATH)
        _download(SFACE_URL, SFACE_PATH)


def _decode(image_bytes: bytes) -> np.ndarray:
    data = np.frombuffer(image_bytes, dtype=np.uint8)
    image = cv2.imdecode(data, cv2.IMREAD_COLOR)
    if image is None:
        raise ValueError("Não foi possível ler a imagem.")
    return image


def _models():
    _ensure_models()
    detector = cv2.FaceDetectorYN.create(str(YUNET_PATH), "", (320, 320), 0.85, 0.3, 5000)
    recognizer = cv2.FaceRecognizerSF.create(str(SFACE_PATH), "")
    return detector, recognizer


def _faces_and_features(image: np.ndarray):
    detector, recognizer = _models()
    height, width = image.shape[:2]
    detector.setInputSize((width, height))
    _, faces = detector.detect(image)

    if faces is None or len(faces) == 0:
        return [], recognizer

    rows = []
    for face in faces:
        aligned = recognizer.alignCrop(image, face)
        feature = recognizer.feature(aligned)
        x, y, w, h = [int(v) for v in face[:4]]
        score = float(face[-1])
        rows.append({
            "box": {"x": x, "y": y, "w": w, "h": h},
            "confidence": score,
            "feature": feature,
            "area": max(w, 0) * max(h, 0),
        })

    rows.sort(key=lambda item: (item["area"], item["confidence"]), reverse=True)
    return rows, recognizer


def detect_faces(image_bytes: bytes):
    image = _decode(image_bytes)
    faces, _ = _faces_and_features(image)
    return [
        {**item["box"], "confidence": round(item["confidence"], 4)}
        for item in faces
    ]


def _download_drive_thumbnail(photo_id: str) -> bytes:
    url = f"https://drive.google.com/thumbnail?id={photo_id}&sz=w1200"
    response = requests.get(url, timeout=45)
    response.raise_for_status()
    return response.content


def _build_index() -> list[dict]:
    global _face_index
    if _face_index is not None:
        return _face_index

    with INDEX_LOCK:
        if _face_index is not None:
            return _face_index

        index: list[dict] = []
        for photo_id in PHOTO_IDS:
            try:
                content = _download_drive_thumbnail(photo_id)
                image = _decode(content)
                faces, _ = _faces_and_features(image)
                for face in faces:
                    index.append({
                        "photo_id": photo_id,
                        "feature": face["feature"],
                    })
            except Exception:
                # Uma foto com erro não interrompe o álbum inteiro.
                continue

        _face_index = index
        return index


def find_matching_photos(image_bytes: bytes):
    image = _decode(image_bytes)
    faces, recognizer = _faces_and_features(image)

    if not faces:
        return {
            "faces_detected": 0,
            "matches": [],
            "threshold": MATCH_THRESHOLD,
        }

    # Em caso de falso positivo no fundo, usamos o maior rosto da selfie como principal.
    selfie = faces[0]["feature"]
    index = _build_index()

    best_by_photo: dict[str, float] = {}

    for item in index:
        score = float(
            recognizer.match(
                selfie,
                item["feature"],
                cv2.FaceRecognizerSF_FR_COSINE
            )
        )
        photo_id = item["photo_id"]
        if score > best_by_photo.get(photo_id, -1.0):
            best_by_photo[photo_id] = score

    matches = [
        {"id": photo_id, "score": round(score, 4)}
        for photo_id, score in best_by_photo.items()
        if score >= MATCH_THRESHOLD
    ]
    matches.sort(key=lambda item: item["score"], reverse=True)

    return {
        "faces_detected": len(faces),
        "matches": matches,
        "threshold": MATCH_THRESHOLD,
        "indexed_faces": len(index),
    }
