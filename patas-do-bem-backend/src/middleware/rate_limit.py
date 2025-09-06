from functools import wraps
from flask import request, jsonify, current_app
import time
from collections import defaultdict, deque
from datetime import datetime, timedelta

# Armazenamento das requisições por IP
_request_counts = defaultdict(lambda: deque())
_blocked_ips = {}

def get_client_ip():
    """Obtém o IP real do cliente considerando proxies"""
    if request.headers.get('X-Forwarded-For'):
        return request.headers.get('X-Forwarded-For').split(',')[0].strip()
    elif request.headers.get('X-Real-IP'):
        return request.headers.get('X-Real-IP')
    else:
        return request.remote_addr

def is_ip_blocked(ip):
    """Verifica se um IP está bloqueado temporariamente"""
    if ip in _blocked_ips:
        blocked_until = _blocked_ips[ip]
        if datetime.now() < blocked_until:
            return True
        else:
            # Remove o bloqueio expirado
            del _blocked_ips[ip]
    return False

def block_ip(ip, duration_minutes=15):
    """Bloqueia um IP temporariamente"""
    _blocked_ips[ip] = datetime.now() + timedelta(minutes=duration_minutes)
    current_app.logger.warning(f"IP {ip} blocked for {duration_minutes} minutes due to rate limiting")

def clean_old_requests(ip, window_seconds):
    """Remove requisições antigas da janela de tempo"""
    cutoff_time = time.time() - window_seconds
    requests = _request_counts[ip]
    
    # Remove requisições antigas
    while requests and requests[0] < cutoff_time:
        requests.popleft()

def rate_limit(max_requests=60, window_seconds=60, block_duration=15):
    """
    Decorator para rate limiting
    
    Args:
        max_requests (int): Número máximo de requisições permitidas
        window_seconds (int): Janela de tempo em segundos
        block_duration (int): Duração do bloqueio em minutos após exceder o limite
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            ip = get_client_ip()
            current_time = time.time()
            
            # Verificar se IP está bloqueado
            if is_ip_blocked(ip):
                return jsonify({
                    'error': 'Rate limit exceeded. Too many requests.',
                    'retry_after': 900  # 15 minutos em segundos
                }), 429
            
            # Limpar requisições antigas
            clean_old_requests(ip, window_seconds)
            
            # Contar requisições na janela atual
            requests = _request_counts[ip]
            request_count = len(requests)
            
            # Verificar limite
            if request_count >= max_requests:
                block_ip(ip, block_duration)
                return jsonify({
                    'error': 'Rate limit exceeded. IP temporarily blocked.',
                    'retry_after': block_duration * 60
                }), 429
            
            # Registrar esta requisição
            requests.append(current_time)
            
            # Adicionar headers informativos
            def add_rate_limit_headers(response):
                if hasattr(response, 'headers'):
                    response.headers['X-RateLimit-Limit'] = str(max_requests)
                    response.headers['X-RateLimit-Remaining'] = str(max_requests - len(requests))
                    response.headers['X-RateLimit-Reset'] = str(int(current_time + window_seconds))
                return response
            
            # Executar função
            result = f(*args, **kwargs)
            
            # Adicionar headers à resposta
            if isinstance(result, tuple):
                response, status_code = result
                response = add_rate_limit_headers(response)
                return response, status_code
            else:
                return add_rate_limit_headers(result)
        
        return decorated_function
    return decorator

def strict_rate_limit(max_requests=10, window_seconds=60, block_duration=30):
    """Rate limiting mais rigoroso para endpoints sensíveis"""
    return rate_limit(max_requests, window_seconds, block_duration)

def api_rate_limit(max_requests=100, window_seconds=60):
    """Rate limiting padrão para APIs"""
    return rate_limit(max_requests, window_seconds, 15)

def payment_rate_limit(max_requests=5, window_seconds=60):
    """Rate limiting específico para pagamentos"""
    return rate_limit(max_requests, window_seconds, 30)

def get_rate_limit_stats():
    """Retorna estatísticas de rate limiting"""
    current_time = datetime.now()
    
    # Contar IPs ativos
    active_ips = len([ip for ip, requests in _request_counts.items() if requests])
    
    # Contar IPs bloqueados
    blocked_count = len([ip for ip, blocked_until in _blocked_ips.items() if blocked_until > current_time])
    
    # Total de requisições na última hora
    hour_ago = time.time() - 3600
    total_requests = sum(
        len([req for req in requests if req > hour_ago])
        for requests in _request_counts.values()
    )
    
    return {
        'active_ips': active_ips,
        'blocked_ips': blocked_count,
        'total_requests_last_hour': total_requests,
        'monitored_ips': len(_request_counts)
    }

def cleanup_rate_limit_data():
    """Limpa dados antigos de rate limiting para economizar memória"""
    current_time = time.time()
    hour_ago = current_time - 3600
    
    # Remover registros de IPs sem atividade recente
    inactive_ips = []
    for ip, requests in _request_counts.items():
        # Limpar requisições antigas
        while requests and requests[0] < hour_ago:
            requests.popleft()
        
        # Marcar IPs sem atividade para remoção
        if not requests:
            inactive_ips.append(ip)
    
    # Remover IPs inativos
    for ip in inactive_ips:
        del _request_counts[ip]
    
    # Limpar bloqueios expirados
    current_datetime = datetime.now()
    expired_blocks = [
        ip for ip, blocked_until in _blocked_ips.items()
        if blocked_until <= current_datetime
    ]
    
    for ip in expired_blocks:
        del _blocked_ips[ip]
    
    current_app.logger.info(f"Rate limit cleanup: removed {len(inactive_ips)} inactive IPs and {len(expired_blocks)} expired blocks")