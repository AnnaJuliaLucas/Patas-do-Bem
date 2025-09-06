from functools import wraps
from flask import request, jsonify, current_app
import json
import hashlib
import time
from datetime import datetime, timedelta

# Cache simples em memória
_cache = {}
_cache_timestamps = {}

def clear_expired_cache():
    """Remove entradas expiradas do cache"""
    current_time = time.time()
    expired_keys = [
        key for key, timestamp in _cache_timestamps.items()
        if current_time - timestamp > 300  # 5 minutos
    ]
    
    for key in expired_keys:
        _cache.pop(key, None)
        _cache_timestamps.pop(key, None)

def generate_cache_key(prefix, *args, **kwargs):
    """Gera uma chave única para o cache"""
    # Inclui argumentos da função e parâmetros da requisição
    key_data = {
        'prefix': prefix,
        'args': args,
        'kwargs': kwargs,
        'query_string': request.query_string.decode('utf-8'),
        'method': request.method
    }
    
    key_string = json.dumps(key_data, sort_keys=True)
    return hashlib.md5(key_string.encode()).hexdigest()

def cache_response(timeout=300):
    """
    Decorator para cache de respostas
    
    Args:
        timeout (int): Tempo em segundos para expirar o cache (padrão: 5 minutos)
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Limpar cache expirado periodicamente
            clear_expired_cache()
            
            # Gerar chave do cache
            cache_key = generate_cache_key(f.__name__, *args, **kwargs)
            current_time = time.time()
            
            # Verificar se existe no cache e não expirou
            if cache_key in _cache:
                cache_time = _cache_timestamps.get(cache_key, 0)
                if current_time - cache_time < timeout:
                    current_app.logger.info(f"Cache HIT para {f.__name__}")
                    return _cache[cache_key]
            
            # Executar função e armazenar resultado
            current_app.logger.info(f"Cache MISS para {f.__name__}")
            result = f(*args, **kwargs)
            
            # Armazenar no cache apenas se for uma resposta de sucesso
            if isinstance(result, tuple):
                response, status_code = result
                if status_code == 200:
                    _cache[cache_key] = result
                    _cache_timestamps[cache_key] = current_time
            else:
                _cache[cache_key] = result
                _cache_timestamps[cache_key] = current_time
            
            return result
        
        return decorated_function
    return decorator

def cache_database_query(timeout=600):
    """
    Cache específico para consultas de banco de dados
    Timeout padrão maior (10 minutos) pois dados mudam menos frequentemente
    """
    return cache_response(timeout)

def invalidate_cache_pattern(pattern):
    """Remove todas as entradas do cache que contenham o padrão"""
    keys_to_remove = [key for key in _cache.keys() if pattern in key]
    for key in keys_to_remove:
        _cache.pop(key, None)
        _cache_timestamps.pop(key, None)
    
    current_app.logger.info(f"Invalidated {len(keys_to_remove)} cache entries with pattern: {pattern}")

def get_cache_stats():
    """Retorna estatísticas do cache"""
    clear_expired_cache()
    
    current_time = time.time()
    valid_entries = sum(
        1 for timestamp in _cache_timestamps.values()
        if current_time - timestamp < 300
    )
    
    return {
        'total_entries': len(_cache),
        'valid_entries': valid_entries,
        'memory_usage_kb': len(str(_cache)) / 1024,  # Estimativa aproximada
        'oldest_entry': min(_cache_timestamps.values()) if _cache_timestamps else None,
        'newest_entry': max(_cache_timestamps.values()) if _cache_timestamps else None
    }