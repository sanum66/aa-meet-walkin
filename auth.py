import os
import streamlit as st

from database import DEFAULT_ADMIN, DEFAULT_PASSWORD


class AuthManager:
    def __init__(self, db):
        self.db = db

    def ensure_default_user(self):
        if not self.db.user_exists(DEFAULT_ADMIN):
            self.db.create_user(DEFAULT_ADMIN, DEFAULT_PASSWORD, role="admin")

    def login(self, username, password):
        if self.db.verify_user(username, password):
            st.session_state.authenticated = True
            st.session_state.username = username
            st.session_state.role = self.db.get_user(username)["role"]
            return True
        return False

    def logout(self):
        for key in ["authenticated", "username", "role"]:
            if key in st.session_state:
                del st.session_state[key]

    def render_login(self):
        st.title("IRTTAA Walk-In Registration System")
        st.write("Secure volunteer and admin access for the Alumni Association event.")
        with st.form(key="login_form"):
            username = st.text_input("Username", value=os.getenv("ADMIN_USER", "admin"))
            password = st.text_input("Password", type="password")
            submitted = st.form_submit_button("Sign In")
            if submitted:
                if self.login(username.strip(), password.strip()):
                    st.success("Login successful. Welcome back!")
                    st.rerun()
                else:
                    st.error("Invalid username or password. Please try again.")
