from flask import request, current_app
import gzip
import json
from io import BytesIO

def compress_response():
    """Middleware para compressão gzip de respostas"""
    
    def should_compress(response):
        """Determina se a resposta deve ser comprimida"""
        # Verificar se o cliente aceita gzip
        accept_encoding = request.headers.get('Accept-Encoding', '')
        if 'gzip' not in accept_encoding.lower():
            return False
        
        # Verificar tamanho mínimo
        content_length = response.content_length
        if content_length and content_length < 1000:  # Menos de 1KB
            return False
        
        # Verificar tipo de conteúdo
        content_type = response.headers.get('Content-Type', '')
        compressible_types = [
            'text/',
            'application/json',
            'application/javascript',
            'application/xml',
            'image/svg+xml'
        ]
        
        if not any(ct in content_type for ct in compressible_types):
            return False
        
        # Não comprimir se já estiver comprimido
        if response.headers.get('Content-Encoding'):
            return False
        
        return True
    
    def compress_data(data):
        """Comprime dados usando gzip"""
        if isinstance(data, str):
            data = data.encode('utf-8')
        
        buffer = BytesIO()
        with gzip.GzipFile(fileobj=buffer, mode='wb', compresslevel=6) as f:
            f.write(data)
        
        return buffer.getvalue()
    
    def middleware(response):
        if should_compress(response):
            try:
                # Comprimir dados
                compressed_data = compress_data(response.get_data())
                
                # Atualizar resposta
                response.set_data(compressed_data)
                response.headers['Content-Encoding'] = 'gzip'
                response.headers['Content-Length'] = len(compressed_data)
                
                # Adicionar header Vary
                vary = response.headers.get('Vary')
                if vary:
                    if 'Accept-Encoding' not in vary:
                        response.headers['Vary'] = vary + ', Accept-Encoding'
                else:
                    response.headers['Vary'] = 'Accept-Encoding'
                
                current_app.logger.debug(f"Response compressed with gzip")
                
            except Exception as e:
                current_app.logger.error(f"Error compressing response: {e}")
        
        return response
    
    return middleware

def optimize_json_response():
    """Otimiza respostas JSON removendo espaços desnecessários"""
    
    def middleware(response):
        content_type = response.headers.get('Content-Type', '')
        
        if 'application/json' in content_type:
            try:
                # Parsear JSON e recriar sem espaços extras
                data = response.get_json()
                if data is not None:
                    compact_json = json.dumps(data, separators=(',', ':'), ensure_ascii=False)
                    response.set_data(compact_json)
                    response.headers['Content-Length'] = len(compact_json.encode('utf-8'))
                    
                    current_app.logger.debug("JSON response optimized")
                    
            except Exception as e:
                current_app.logger.error(f"Error optimizing JSON response: {e}")
        
        return response
    
    return middleware