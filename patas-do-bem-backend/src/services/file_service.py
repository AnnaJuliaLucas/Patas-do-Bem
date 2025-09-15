"""
File Upload Service
Gerenciamento de upload e armazenamento de arquivos
"""

import os
import uuid
from PIL import Image
from werkzeug.utils import secure_filename
import logging

logger = logging.getLogger(__name__)

class FileService:
    """Serviço de gerenciamento de arquivos"""
    
    def __init__(self):
        self.upload_folder = os.path.join(os.path.dirname(__file__), '..', 'static', 'uploads')
        self.allowed_extensions = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
        self.max_file_size = 5 * 1024 * 1024  # 5MB
        
        # Criar diretório se não existir
        os.makedirs(self.upload_folder, exist_ok=True)
        os.makedirs(os.path.join(self.upload_folder, 'raffles'), exist_ok=True)
        os.makedirs(os.path.join(self.upload_folder, 'thumbnails'), exist_ok=True)
    
    def is_allowed_file(self, filename: str) -> bool:
        """Verificar se o arquivo é permitido"""
        return '.' in filename and \
               filename.rsplit('.', 1)[1].lower() in self.allowed_extensions
    
    def upload_raffle_image(self, file, raffle_id: int = None) -> dict:
        """Upload de imagem para rifa"""
        try:
            if not file:
                return {'success': False, 'error': 'Nenhum arquivo enviado'}
            
            if not self.is_allowed_file(file.filename):
                return {'success': False, 'error': 'Tipo de arquivo não permitido'}
            
            # Verificar tamanho do arquivo
            file.seek(0, os.SEEK_END)
            file_size = file.tell()
            file.seek(0)
            
            if file_size > self.max_file_size:
                return {'success': False, 'error': 'Arquivo muito grande (máx. 5MB)'}
            
            # Gerar nome único
            file_extension = file.filename.rsplit('.', 1)[1].lower()
            unique_filename = f"{uuid.uuid4().hex}.{file_extension}"
            
            # Paths
            raffles_folder = os.path.join(self.upload_folder, 'raffles')
            thumbnails_folder = os.path.join(self.upload_folder, 'thumbnails')
            
            original_path = os.path.join(raffles_folder, unique_filename)
            thumbnail_path = os.path.join(thumbnails_folder, f"thumb_{unique_filename}")
            
            # Salvar arquivo original
            file.save(original_path)
            
            # Criar thumbnail
            self._create_thumbnail(original_path, thumbnail_path)
            
            # URLs relativas
            image_url = f"/static/uploads/raffles/{unique_filename}"
            thumbnail_url = f"/static/uploads/thumbnails/thumb_{unique_filename}"
            
            return {
                'success': True,
                'filename': unique_filename,
                'image_url': image_url,
                'thumbnail_url': thumbnail_url,
                'file_size': file_size
            }
            
        except Exception as e:
            logger.error(f"Erro ao fazer upload: {e}")
            return {'success': False, 'error': f'Erro interno: {str(e)}'}
    
    def _create_thumbnail(self, original_path: str, thumbnail_path: str, size: tuple = (300, 300)):
        """Criar thumbnail da imagem"""
        try:
            with Image.open(original_path) as image:
                # Manter proporção
                image.thumbnail(size, Image.Resampling.LANCZOS)
                
                # Converter para RGB se necessário (para JPEGs)
                if image.mode in ("RGBA", "P"):
                    image = image.convert("RGB")
                
                image.save(thumbnail_path, "JPEG", quality=85)
                
        except Exception as e:
            logger.error(f"Erro ao criar thumbnail: {e}")
    
    def delete_file(self, filename: str, file_type: str = 'raffle') -> bool:
        """Deletar arquivo e seu thumbnail"""
        try:
            if file_type == 'raffle':
                # Deletar arquivo original
                original_path = os.path.join(self.upload_folder, 'raffles', filename)
                if os.path.exists(original_path):
                    os.remove(original_path)
                
                # Deletar thumbnail
                thumbnail_path = os.path.join(self.upload_folder, 'thumbnails', f"thumb_{filename}")
                if os.path.exists(thumbnail_path):
                    os.remove(thumbnail_path)
                
                return True
                
        except Exception as e:
            logger.error(f"Erro ao deletar arquivo: {e}")
            return False
        
        return False
    
    def get_file_info(self, filename: str) -> dict:
        """Obter informações do arquivo"""
        try:
            file_path = os.path.join(self.upload_folder, 'raffles', filename)
            
            if os.path.exists(file_path):
                stat = os.stat(file_path)
                
                return {
                    'exists': True,
                    'size': stat.st_size,
                    'created_at': stat.st_ctime,
                    'modified_at': stat.st_mtime,
                    'url': f"/static/uploads/raffles/{filename}",
                    'thumbnail_url': f"/static/uploads/thumbnails/thumb_{filename}"
                }
            else:
                return {'exists': False}
                
        except Exception as e:
            logger.error(f"Erro ao obter info do arquivo: {e}")
            return {'exists': False, 'error': str(e)}

# Instância global
file_service = FileService()