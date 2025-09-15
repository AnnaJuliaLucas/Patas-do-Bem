from flask import Blueprint, request, jsonify
from src.services.file_service import file_service
from src.services.auth_service import token_required, admin_required

upload_bp = Blueprint('upload', __name__)

@upload_bp.route('/upload/raffle-image', methods=['POST'])
@token_required
@admin_required
def upload_raffle_image():
    """Upload de imagem para rifa (Admin)"""
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'Nenhum arquivo enviado'}), 400
        
        file = request.files['image']
        
        if file.filename == '':
            return jsonify({'error': 'Nenhum arquivo selecionado'}), 400
        
        result = file_service.upload_raffle_image(file)
        
        if result['success']:
            return jsonify({
                'message': 'Imagem enviada com sucesso',
                'filename': result['filename'],
                'image_url': result['image_url'],
                'thumbnail_url': result['thumbnail_url'],
                'file_size': result['file_size']
            }), 201
        else:
            return jsonify({'error': result['error']}), 400
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@upload_bp.route('/upload/delete/<filename>', methods=['DELETE'])
@token_required
@admin_required
def delete_uploaded_file(filename):
    """Deletar arquivo enviado (Admin)"""
    try:
        success = file_service.delete_file(filename, 'raffle')
        
        if success:
            return jsonify({'message': 'Arquivo deletado com sucesso'}), 200
        else:
            return jsonify({'error': 'Erro ao deletar arquivo'}), 400
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@upload_bp.route('/upload/info/<filename>', methods=['GET'])
def get_file_info(filename):
    """Obter informações do arquivo"""
    try:
        info = file_service.get_file_info(filename)
        
        if info['exists']:
            return jsonify(info), 200
        else:
            return jsonify({'error': 'Arquivo não encontrado'}), 404
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500