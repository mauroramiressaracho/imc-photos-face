# IMC Photos Face

Plataforma de fotos da Regional Campo Grande/MS - Insanos MC.

## Arquitetura atual

O projeto agora roda como um único Web Service:

- FastAPI entrega o frontend;
- HTML/CSS/JS ficam no mesmo domínio;
- a selfie é enviada para `/api/find-face`;
- OpenCV faz a primeira validação/detecção facial;
- Google Drive continua sendo a origem das fotos.

## Estrutura

```
app/
  main.py
  face_service.py
  drive_service.py
  templates/index.html
static/
  style.css
  script.js
requirements.txt
render.yaml
```

## Rodar localmente

```bash
python -m venv .venv
# Windows
.venv\Scripts\activate

pip install -r requirements.txt
uvicorn app.main:app --reload
```

Acesse:

- Site: http://127.0.0.1:8000
- Health: http://127.0.0.1:8000/api/health
- Docs: http://127.0.0.1:8000/docs

## Deploy no Render

Crie um **Web Service** apontando para este repositório. O `render.yaml` já contém build, start command e health check.

## Estado do reconhecimento

Nesta etapa o backend detecta quantos rostos existem na selfie usando OpenCV. A comparação biométrica com as fotos do Drive será adicionada na próxima etapa, depois de validarmos que o serviço Free do Render está estável.

## Google Drive

Folder ID de teste:

```
18KOtwcU9QB0Moqr9uIaU342O2WexxaYb
```
