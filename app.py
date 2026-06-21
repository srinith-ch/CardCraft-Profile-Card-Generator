import os
import sqlite3
from flask import Flask, request, jsonify, render_template

app = Flask(__name__, template_folder='templates', static_folder='static')

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'profiles.db')

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS profiles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            job_title TEXT NOT NULL,
            bio TEXT,
            avatar_url TEXT,
            skills TEXT,
            theme TEXT DEFAULT 'glass',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/profiles', methods=['GET'])
def get_profiles():
    try:
        conn = get_db_connection()
        profiles = conn.execute('SELECT * FROM profiles ORDER BY id DESC').fetchall()
        conn.close()
        
        profiles_list = []
        for profile in profiles:
            profiles_list.append({
                'id': profile['id'],
                'name': profile['name'],
                'job_title': profile['job_title'],
                'bio': profile['bio'],
                'avatar_url': profile['avatar_url'],
                'skills': profile['skills'],
                'theme': profile['theme'],
                'created_at': profile['created_at']
            })
        return jsonify(profiles_list)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/profile', methods=['POST'])
def create_profile():
    try:
        data = request.get_json() or {}
        name = data.get('name', '').strip()
        job_title = data.get('job_title', '').strip()
        bio = data.get('bio', '').strip()
        avatar_url = data.get('avatar_url', '').strip()
        skills = data.get('skills', '').strip()  # Comma separated
        theme = data.get('theme', 'glass').strip()
        
        if not name:
            return jsonify({'error': 'Name is required'}), 400
        if not job_title:
            return jsonify({'error': 'Job Title is required'}), 400
            
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO profiles (name, job_title, bio, avatar_url, skills, theme)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (name, job_title, bio, avatar_url, skills, theme))
        profile_id = cursor.lastrowid
        conn.commit()
        
        profile = conn.execute('SELECT * FROM profiles WHERE id = ?', (profile_id,)).fetchone()
        conn.close()
        
        return jsonify({
            'id': profile['id'],
            'name': profile['name'],
            'job_title': profile['job_title'],
            'bio': profile['bio'],
            'avatar_url': profile['avatar_url'],
            'skills': profile['skills'],
            'theme': profile['theme'],
            'created_at': profile['created_at']
        }), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    init_db()
    # Run on Port 5002
    app.run(host='127.0.0.1', port=5002, debug=True)
