import os
import sqlite3
import hashlib
import secrets
from datetime import datetime

from dotenv import load_dotenv

load_dotenv()

DB_PATH = os.getenv("DB_PATH", os.path.join(os.path.dirname(__file__), "data", "registrations.db"))
DEFAULT_ADMIN = os.getenv("ADMIN_USER", "admin")
DEFAULT_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123")


class Database:
    def __init__(self):
        self.db_path = DB_PATH
        self._ensure_data_dir()
        self.conn = sqlite3.connect(self.db_path, check_same_thread=False)
        self.conn.row_factory = sqlite3.Row
        self.create_tables()

    def _ensure_data_dir(self):
        directory = os.path.dirname(self.db_path)
        if directory and not os.path.exists(directory):
            os.makedirs(directory, exist_ok=True)

    def create_tables(self):
        cursor = self.conn.cursor()
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
            """
        )
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS attendees (
                attendee_id TEXT PRIMARY KEY,
                full_name TEXT NOT NULL,
                batch_year TEXT NOT NULL,
                department TEXT NOT NULL,
                mobile TEXT UNIQUE NOT NULL,
                email TEXT,
                city TEXT,
                company TEXT,
                registration_type TEXT NOT NULL,
                payment_status TEXT NOT NULL,
                payment_mode TEXT,
                amount_paid REAL DEFAULT 0,
                food_preference TEXT,
                remarks TEXT,
                created_at TEXT NOT NULL,
                checked_in INTEGER DEFAULT 0,
                checked_in_at TEXT,
                qr_code_path TEXT
            )
            """
        )
        self.conn.commit()

    def execute(self, query, params=None, commit=False):
        params = params or []
        cursor = self.conn.cursor()
        cursor.execute(query, params)
        if commit:
            self.conn.commit()
        return cursor

    def user_exists(self, username):
        cursor = self.execute("SELECT 1 FROM users WHERE username = ?", [username])
        return cursor.fetchone() is not None

    def create_user(self, username, password, role="admin"):
        password_hash = self.hash_password(password)
        created_at = datetime.utcnow().isoformat()
        self.execute(
            "INSERT OR IGNORE INTO users (username, password_hash, role, created_at) VALUES (?, ?, ?, ?)",
            [username, password_hash, role, created_at],
            commit=True,
        )

    def get_user(self, username):
        cursor = self.execute("SELECT * FROM users WHERE username = ?", [username])
        return cursor.fetchone()

    def verify_user(self, username, password):
        user = self.get_user(username)
        if not user:
            return False
        return secrets.compare_digest(user["password_hash"], self.hash_password(password))

    @staticmethod
    def hash_password(password):
        return hashlib.sha256(password.encode("utf-8")).hexdigest()

    def add_attendee(self, **attendee_data):
        fields = ", ".join(attendee_data.keys())
        placeholders = ", ".join(["?"] * len(attendee_data))
        query = f"INSERT INTO attendees ({fields}) VALUES ({placeholders})"
        self.execute(query, list(attendee_data.values()), commit=True)

    def update_attendee(self, attendee_id, **updates):
        assignments = ", ".join([f"{field} = ?" for field in updates])
        query = f"UPDATE attendees SET {assignments} WHERE attendee_id = ?"
        self.execute(query, list(updates.values()) + [attendee_id], commit=True)

    def delete_attendee(self, attendee_id):
        self.execute("DELETE FROM attendees WHERE attendee_id = ?", [attendee_id], commit=True)

    def get_attendee(self, attendee_id=None, mobile=None, full_name=None):
        if attendee_id:
            query = "SELECT * FROM attendees WHERE attendee_id = ?"
            params = [attendee_id]
        elif mobile:
            query = "SELECT * FROM attendees WHERE mobile = ?"
            params = [mobile]
        elif full_name:
            query = "SELECT * FROM attendees WHERE LOWER(full_name) LIKE ?"
            params = [f"%{full_name.lower()}%"]
        else:
            return None
        cursor = self.execute(query, params)
        return cursor.fetchone()

    def search_attendees(self, search_text):
        like_value = f"%{search_text.lower()}%"
        cursor = self.execute(
            "SELECT * FROM attendees WHERE LOWER(full_name) LIKE ? OR mobile LIKE ? OR attendee_id LIKE ?",
            [like_value, like_value, like_value],
        )
        return cursor.fetchall()

    def list_attendees(self, filters=None):
        filters = filters or {}
        query = "SELECT * FROM attendees"
        clauses = []
        params = []
        for field, value in filters.items():
            if value is not None and value != "All":
                clauses.append(f"{field} = ?")
                params.append(value)
        if clauses:
            query += " WHERE " + " AND ".join(clauses)
        query += " ORDER BY created_at DESC"
        cursor = self.execute(query, params)
        return cursor.fetchall()

    def mark_checked_in(self, attendee_id):
        self.update_attendee(attendee_id, checked_in=1, checked_in_at=datetime.utcnow().isoformat())

    def duplicate_mobile_exists(self, mobile):
        cursor = self.execute("SELECT 1 FROM attendees WHERE mobile = ?", [mobile])
        return cursor.fetchone() is not None

    def get_metrics(self):
        result = {
            "total": 0,
            "walk_in": 0,
            "pre_registered": 0,
            "paid": 0.0,
            "checked_in": 0,
        }
        cursor = self.execute("SELECT COUNT(*) AS total, SUM(amount_paid) AS paid, SUM(checked_in) AS checked_in FROM attendees")
        row = cursor.fetchone()
        if row:
            result["total"] = row["total"] or 0
            result["paid"] = float(row["paid"] or 0)
            result["checked_in"] = row["checked_in"] or 0
        cursor = self.execute(
            "SELECT registration_type, COUNT(*) AS count FROM attendees GROUP BY registration_type"
        )
        for row in cursor.fetchall():
            if row["registration_type"] == "Spot Registration":
                result["walk_in"] = row["count"]
            else:
                result["pre_registered"] = row["count"]
        return result

    def analytics_by_batch(self):
        cursor = self.execute(
            "SELECT batch_year AS category, COUNT(*) AS count FROM attendees GROUP BY batch_year ORDER BY batch_year"
        )
        return cursor.fetchall()

    def analytics_by_department(self):
        cursor = self.execute(
            "SELECT department AS category, COUNT(*) AS count FROM attendees GROUP BY department ORDER BY count DESC"
        )
        return cursor.fetchall()

    def analytics_by_date(self):
        cursor = self.execute(
            "SELECT DATE(created_at) AS day, COUNT(*) AS count FROM attendees GROUP BY DATE(created_at) ORDER BY day"
        )
        return cursor.fetchall()

    def close(self):
        self.conn.close()
def get_all_attendees(self):

    conn = self.get_connection()

    cursor = conn.cursor()

    cursor.execute("""
    SELECT *
    FROM attendees
    ORDER BY created_at DESC
    """)

    rows = cursor.fetchall()

    conn.close()

    return rows