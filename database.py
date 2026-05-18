import os
import sqlite3
import hashlib
import secrets
from datetime import datetime

from dotenv import load_dotenv
from supabase_client import supabase

load_dotenv()

DB_PATH = os.getenv(
    "DB_PATH",
    os.path.join(
        os.path.dirname(__file__),
        "data",
        "registrations.db"
    )
)

DEFAULT_ADMIN = os.getenv(
    "ADMIN_USER",
    "admin"
)

DEFAULT_PASSWORD = os.getenv(
    "ADMIN_PASSWORD",
    "admin123"
)


class Database:

    def __init__(self):

        self.db_path = DB_PATH

        self._ensure_data_dir()

        self.conn = sqlite3.connect(
            self.db_path,
            check_same_thread=False
        )

        self.conn.row_factory = sqlite3.Row

        self.create_tables()

    # ---------------------------------------------------
    # SQLITE USERS TABLE ONLY
    # ---------------------------------------------------

    def _ensure_data_dir(self):

        directory = os.path.dirname(
            self.db_path
        )

        if directory and not os.path.exists(directory):

            os.makedirs(
                directory,
                exist_ok=True
            )

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

        self.conn.commit()

    # ---------------------------------------------------
    # SQLITE EXECUTE
    # ---------------------------------------------------

    def execute(
        self,
        query,
        params=None,
        commit=False
    ):

        params = params or []

        cursor = self.conn.cursor()

        cursor.execute(
            query,
            params
        )

        if commit:
            self.conn.commit()

        return cursor

    # ---------------------------------------------------
    # PASSWORD HASH
    # ---------------------------------------------------

    @staticmethod
    def hash_password(password):

        return hashlib.sha256(
            password.encode("utf-8")
        ).hexdigest()

    # ---------------------------------------------------
    # USER FUNCTIONS
    # ---------------------------------------------------

    def user_exists(self, username):

        cursor = self.execute(
            "SELECT 1 FROM users WHERE username = ?",
            [username]
        )

        return cursor.fetchone() is not None

    def create_user(
        self,
        username,
        password,
        role="admin"
    ):

        password_hash = self.hash_password(
            password
        )

        created_at = datetime.utcnow().isoformat()

        self.execute(
            """
            INSERT OR IGNORE INTO users (

                username,
                password_hash,
                role,
                created_at

            )
            VALUES (?, ?, ?, ?)
            """,
            [
                username,
                password_hash,
                role,
                created_at
            ],
            commit=True
        )

    def get_user(self, username):

        cursor = self.execute(
            """
            SELECT *
            FROM users
            WHERE username = ?
            """,
            [username]
        )

        return cursor.fetchone()

    def verify_user(
        self,
        username,
        password
    ):

        user = self.get_user(username)

        if not user:
            return False

        return secrets.compare_digest(
            user["password_hash"],
            self.hash_password(password)
        )

    # ---------------------------------------------------
    # INSERT ATTENDEE
    # ---------------------------------------------------

    def insert_attendee(self, data):

        try:

            attendee_id = (
                f"IRTTAA-"
                f"{secrets.token_hex(4).upper()}"
            )

            payload = {

                "attendee_id": attendee_id,

                "name": data.get(
                    "name",
                    ""
                ),

                "course": data.get(
                    "course",
                    ""
                ),

                "stream": data.get(
                    "stream",
                    ""
                ),

                "batch_year": int(
                    data.get(
                        "batch_year",
                        0
                    )
                ) if str(
                    data.get(
                        "batch_year",
                        ""
                    )
                ).isdigit() else None,

                "email": data.get(
                    "email",
                    ""
                ),

                "mobile": str(
                    data.get(
                        "mobile",
                        ""
                    )
                ),

                "status": data.get(
                    "status",
                    ""
                ),

                "food_preference": data.get(
                    "food_preference",
                    ""
                ),

                "family_members": int(
                    data.get(
                        "family_members",
                        0
                    )
                ),

                "gender": data.get(
                    "gender",
                    ""
                ),

                "city": data.get(
                    "city",
                    ""
                ),

                "company": data.get(
                    "company",
                    ""
                ),

                "registration_type": data.get(
                    "registration_type",
                    "Pre-Registered"
                ),

                "payment_status": data.get(
                    "payment_status",
                    "Paid"
                ),

                "payment_mode": data.get(
                    "payment_mode",
                    "Online"
                ),

                "amount_paid": float(
                    data.get(
                        "amount_paid",
                        0
                    )
                ),

                "membership_amount": float(
                    data.get(
                        "membership_amount",
                        0
                    )
                ),

                "contribution_amount": float(
                    data.get(
                        "contribution_amount",
                        0
                    )
                ),

                "remarks": data.get(
                    "remarks",
                    ""
                ),

                "created_at": datetime.utcnow().isoformat(),

                "checked_in": False

            }

            supabase.table(
                "attendees"
            ).insert(
                payload
            ).execute()

            return True

        except Exception as e:

            print(e)

            return False

    # ---------------------------------------------------
    # GET SINGLE ATTENDEE
    # ---------------------------------------------------

    def get_attendee(
        self,
        attendee_id=None,
        mobile=None,
        name=None
    ):

        try:

            query = supabase.table(
                "attendees"
            ).select("*")

            if attendee_id:

                response = query.eq(
                    "attendee_id",
                    attendee_id
                ).execute()

            elif mobile:

                response = query.eq(
                    "mobile",
                    mobile
                ).execute()

            elif name:

                response = query.ilike(
                    "name",
                    f"%{name}%"
                ).execute()

            else:

                return None

            if response.data:

                return response.data[0]

            return None

        except Exception as e:

            print(e)

            return None

    # ---------------------------------------------------
    # GET ALL ATTENDEES
    # ---------------------------------------------------

    def get_all_attendees(self):

        try:

            response = supabase.table(
                "attendees"
            ).select("*").order(
                "created_at",
                desc=True
            ).execute()

            return response.data

        except Exception as e:

            print(e)

            return []

    # ---------------------------------------------------
    # SEARCH ATTENDEES
    # ---------------------------------------------------

    def search_attendees(
        self,
        search_text
    ):

        try:

            response = supabase.table(
                "attendees"
            ).select("*").or_(

                f"name.ilike.%{search_text}%,"

                f"mobile.ilike.%{search_text}%,"

                f"attendee_id.ilike.%{search_text}%"

            ).execute()

            return response.data

        except Exception as e:

            print(e)

            return []

    # ---------------------------------------------------
    # MARK CHECK-IN
    # ---------------------------------------------------

    def mark_checked_in(
        self,
        attendee_id
    ):

        try:

            supabase.table(
                "attendees"
            ).update({

                "checked_in": True,

                "checked_in_at":
                datetime.utcnow().isoformat()

            }).eq(
                "attendee_id",
                attendee_id
            ).execute()

        except Exception as e:

            print(e)

    # ---------------------------------------------------
    # DASHBOARD METRICS
    # ---------------------------------------------------

    def get_metrics(self):

        attendees = self.get_all_attendees()

        result = {

            "total": len(attendees),

            "walk_in": 0,

            "pre_registered": 0,

            "paid": 0,

            "membership_total": 0,

            "contribution_total": 0,

            "checked_in": 0,

        }

        for attendee in attendees:

            if attendee.get(
                "registration_type"
            ) == "Walk-In":

                result["walk_in"] += 1

            else:

                result["pre_registered"] += 1

            result["paid"] += float(
                attendee.get(
                    "amount_paid",
                    0
                ) or 0
            )

            result["membership_total"] += float(
                attendee.get(
                    "membership_amount",
                    0
                ) or 0
            )

            result["contribution_total"] += float(
                attendee.get(
                    "contribution_amount",
                    0
                ) or 0
            )

            if attendee.get(
                "checked_in"
            ):

                result["checked_in"] += 1

        return result

    # ---------------------------------------------------
    # ANALYTICS BY BATCH
    # ---------------------------------------------------

    def analytics_by_batch(self):

        attendees = self.get_all_attendees()

        summary = {}

        for attendee in attendees:

            batch = str(
                attendee.get(
                    "batch_year",
                    "Unknown"
                )
            )

            summary[batch] = (
                summary.get(batch, 0) + 1
            )

        return [

            {
                "category": key,
                "count": value
            }

            for key, value in summary.items()

        ]

    # ---------------------------------------------------
    # ANALYTICS BY STREAM
    # ---------------------------------------------------

    def analytics_by_department(self):

        attendees = self.get_all_attendees()

        summary = {}

        for attendee in attendees:

            stream = attendee.get(
                "stream",
                "Unknown"
            )

            summary[stream] = (
                summary.get(stream, 0) + 1
            )

        return [

            {
                "category": key,
                "count": value
            }

            for key, value in summary.items()

        ]

    # ---------------------------------------------------
    # ANALYTICS BY DATE
    # ---------------------------------------------------

    def analytics_by_date(self):

        attendees = self.get_all_attendees()

        summary = {}

        for attendee in attendees:

            created_at = attendee.get(
                "created_at",
                ""
            )

            if created_at:

                day = created_at[:10]

                summary[day] = (
                    summary.get(day, 0) + 1
                )

        return [

            {
                "day": key,
                "count": value
            }

            for key, value in summary.items()

        ]
    
    # ---------------------------------------------------
    # UPDATE ATTENDEE
    # ---------------------------------------------------

    def update_attendee(
        self,
        attendee_id,
        updates
    ):

        try:

            supabase.table(
                "attendees"
            ).update(
                updates
            ).eq(
                "attendee_id",
                attendee_id
            ).execute()

            return True

        except Exception as e:

            print(e)

            return False
        
    # ---------------------------------------------------
    # DELETE ATTENDEE
    # ---------------------------------------------------

    def delete_attendee(
        self,
        attendee_id
    ):

        try:

            supabase.table(
                "attendees"
            ).delete().eq(
                "attendee_id",
                attendee_id
            ).execute()

        except Exception as e:

            print(e)

    # ---------------------------------------------------
    # CLOSE SQLITE
    # ---------------------------------------------------

    def close(self):

        self.conn.close()