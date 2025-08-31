# -*- coding: utf-8 -*-
import sys
import io
# 确保标准输出使用UTF-8编码
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import os
import json
import uuid
from datetime import datetime

class SessionManager:
    def __init__(self, sessions_dir='sessions'):
        # 获取当前脚本所在目录，确保使用绝对路径
        current_dir = os.path.dirname(os.path.abspath(__file__))
        # 确保sessions目录在项目根目录下，而不是server目录下
        self.sessions_dir = os.path.join(os.path.dirname(current_dir), sessions_dir)
        self.init_server()
    
    def init_server(self):
        try:
            os.makedirs(self.sessions_dir, exist_ok=True)
            print(f'会话存储目录已创建: {self.sessions_dir}')
            # 验证目录是否真的创建成功
            if os.path.exists(self.sessions_dir):
                print(f'目录验证成功，绝对路径: {os.path.abspath(self.sessions_dir)}')
            else:
                print(f'警告: 目录创建命令执行成功，但目录似乎不存在')
        except Exception as e:
            print(f'目录初始化失败: {e}')
            print(f'尝试的目录路径: {os.path.abspath(self.sessions_dir)}')
    
    def generate_suffix(self, length=4):
        import random
        import string
        return ''.join(random.choices(string.ascii_lowercase, k=length))
    
    def check_file_exists(self, filename):
        return os.path.exists(os.path.join(self.sessions_dir, filename))
    
    def create_new_session(self, session_data):
        try:
            if 'createdAt' not in session_data or not isinstance(session_data['createdAt'], int):
                return {'error': '缺少有效的时间戳'}, 400
            
            # 自动生成唯一ID
            session_data['id'] = self.generate_suffix(8)
            
            first_message = session_data.get('messages', [])[1] if len(session_data.get('messages', [])) > 1 else None
            if first_message and first_message.get('content'):
                content_prefix = first_message['content'][:7]
                content_prefix = ''.join(c if c.isalnum() or c in '_\u4e00-\u9fa5' else '_' for c in content_prefix)
                content_prefix = content_prefix.strip('_')
                content_prefix = content_prefix if content_prefix else '新建会话'
            else:
                content_prefix = '新建会话'
            
            sessionname = f'{content_prefix}.olm'
            retries = 0
            
            while self.check_file_exists(sessionname):
                suffix = self.generate_suffix(2)
                sessionname = f'{content_prefix}_{suffix}.olm'
                retries += 1
                if retries > 10:
                    raise Exception('无法生成唯一文件名')
            
            session_data['sessionName'] = sessionname.replace('.olm', '')
            session_data['filePath'] = os.path.join(self.sessions_dir, sessionname)
            
            # 确保所有文件写入都使用utf-8编码
            with open(os.path.join(self.sessions_dir, sessionname), 'w', encoding='utf-8') as f:
                json.dump(session_data, f, ensure_ascii=False, indent=2)
            
            return {
                'session': session_data,
                'message': f'会话创建成功，路径: {os.path.join(self.sessions_dir, sessionname)}'
            }, 201
        except Exception as e:
            print(f'[{datetime.now().isoformat()}] 创建错误: {e}')
            return {
                'error': '会话创建失败',
                'details': str(e)
            }, 500
    
    def get_sessions(self):
        try:
            files = os.listdir(self.sessions_dir)
            sessions = []
            for file in files:
                if file.endswith('.olm'):
                    try:
                        with open(os.path.join(self.sessions_dir, file), 'r', encoding='utf-8') as f:
                            session_data = json.load(f)
                        session_data['id'] = session_data.get('id', file.replace('.olm', ''))
                        session_data['filePath'] = os.path.join(self.sessions_dir, file)
                        sessions.append(session_data)
                    except Exception as file_error:
                        print(f'文件解析失败: {file}', file_error)
            
            sessions = [s for s in sessions if s is not None]
            sessions.sort(key=lambda x: x.get('lastUpdated', 0), reverse=True)
            return {'sessions': sessions, 'status': 'success'}
        except Exception as e:
            print('获取会话列表失败:', e)
            return {
                'error': '无法读取会话数据',
                'detail': str(e),
                'sessions': []
            }, 500
    
    def cat_session(self, file_path):
        try:
            if not file_path:
                return {'error': '缺少filePath参数'}, 400
            
            with open(file_path, 'r', encoding='utf-8') as f:
                session_data = json.load(f)
            
            if isinstance(session_data, str):
                session_data = json.loads(session_data)
            
            return session_data
        except Exception as e:
            return {'error': '会话不存在'}, 404
    
    def save_session(self, session_data):
        try:
            print(f'接收到的会话数据: {session_data}')
            file_path = session_data.get('filePath')
            if not file_path:
                print('缺少filePath参数')
                return {'error': '缺少filePath参数'}, 400
            
            print(f'准备保存到文件: {file_path}')
            # 明确指定使用utf-8编码来处理Unicode字符
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(session_data, f, ensure_ascii=False, indent=2)
            
            print('会话保存成功')
            return {'message': '会话保存成功'}
        except Exception as e:
            print('保存会话失败:', e)
            return {'error': '会话保存失败', 'details': str(e)}, 500

app = Flask(__name__)
CORS(app)  # 启用CORS
session_manager = SessionManager()

@app.route('/newsessions', methods=['POST'])
def create_session():
    data = request.get_json()
    result, status_code = session_manager.create_new_session(data)
    return jsonify(result), status_code

@app.route('/getsessions', methods=['GET'])
def get_sessions():
    result = session_manager.get_sessions()
    if isinstance(result, tuple):
        return jsonify(result[0]), result[1]
    return jsonify(result)

@app.route('/catsessions', methods=['POST'])
def cat_session():
    data = request.get_json()
    result = session_manager.cat_session(data.get('filePath'))
    if isinstance(result, tuple):
        return jsonify(result[0]), result[1]
    return jsonify(result)

@app.route('/savesessions', methods=['PUT'])
def save_session():
    data = request.get_json()
    result = session_manager.save_session(data)
    if isinstance(result, tuple):
        return jsonify(result[0]), result[1]
    return jsonify(result), 200

if __name__ == '__main__':
    app.run(host='localhost', port=3001, debug=True)