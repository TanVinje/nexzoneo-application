from fastapi import APIRouter, Depends, File, UploadFile

from app.core.deps import get_current_user
from app.services.file_service import save_upload

router = APIRouter(prefix="/files", tags=["files"])


@router.post("/upload")
async def upload_file(file: UploadFile = File(...), user=Depends(get_current_user)):
    url = await save_upload(file)
    return {"url": url}
