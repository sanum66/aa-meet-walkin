import os

import streamlit as st

from database import (
    DEFAULT_ADMIN,
    DEFAULT_PASSWORD
)

from config import (
    SHORT_ORGANIZATION_NAME,
    EVENT_NAME
)


# ---------------------------------------------------
# AUTH MANAGER
# ---------------------------------------------------

class AuthManager:

    def __init__(self, db):

        self.db = db

    # ---------------------------------------------------
    # DEFAULT USER
    # ---------------------------------------------------

    def ensure_default_user(self):

        if not self.db.user_exists(
            DEFAULT_ADMIN
        ):

            self.db.create_user(

                DEFAULT_ADMIN,

                DEFAULT_PASSWORD,

                role="admin"

            )

    # ---------------------------------------------------
    # LOGIN
    # ---------------------------------------------------

    def login(

        self,

        username,

        password

    ):

        if self.db.verify_user(

            username,

            password

        ):

            st.session_state.authenticated = True

            st.session_state.username = username

            st.session_state.role = (
                self.db.get_user(
                    username
                )["role"]
            )

            return True

        return False

    # ---------------------------------------------------
    # LOGOUT
    # ---------------------------------------------------

    def logout(self):

        for key in [

            "authenticated",

            "username",

            "role"

        ]:

            if key in st.session_state:

                del st.session_state[key]

    # ---------------------------------------------------
    # LOGIN PAGE
    # ---------------------------------------------------

    def render_login(self):

        left, right = st.columns([1.2, 1])

        # ---------------------------------------------------
        # LEFT
        # ---------------------------------------------------

        with left:

            st.markdown(

                f"""

                <div style="
                    padding-top:100px;
                    padding-left:20px;
                ">

                    <div style="
                        font-size:20px;
                        color:#1E5EFF;
                        font-weight:700;
                        margin-bottom:16px;
                    ">
                        {SHORT_ORGANIZATION_NAME}
                    </div>

                    <div style="
                        font-size:58px;
                        line-height:1.1;
                        font-weight:900;
                        color:#0F172A;
                        margin-bottom:24px;
                    ">
                        Alumni Event<br>
                        Management<br>
                        Platform
                    </div>

                    <div style="
                        font-size:20px;
                        color:#64748B;
                        line-height:1.8;
                        max-width:620px;
                    ">
                        {EVENT_NAME}
                        <br><br>

                        Smart registration,
                        check-in,
                        contribution,
                        membership,
                        and analytics platform
                        for modern alumni events.

                    </div>

                </div>

                """,

                unsafe_allow_html=True

            )

        # ---------------------------------------------------
        # RIGHT
        # ---------------------------------------------------

        with right:

            st.markdown(

                """
                <div style="
                    background:white;
                    padding:42px;
                    border-radius:28px;
                    margin-top:90px;
                    border:1px solid #E2E8F0;
                    box-shadow:
                        0 20px 40px rgba(0,0,0,0.08);
                ">
                """,

                unsafe_allow_html=True

            )

            st.markdown(

                """
                <div style="
                    font-size:34px;
                    font-weight:800;
                    color:#0F172A;
                    margin-bottom:8px;
                ">
                    Welcome Back
                </div>
                """,

                unsafe_allow_html=True

            )

            st.markdown(

                """
                <div style="
                    color:#64748B;
                    margin-bottom:28px;
                    font-size:16px;
                ">
                    Volunteer & Admin Access
                </div>
                """,

                unsafe_allow_html=True

            )

            with st.form("login_form"):

                username = st.text_input(

                    "Username",

                    value=os.getenv(

                        "ADMIN_USER",

                        "admin"

                    )

                )

                password = st.text_input(

                    "Password",

                    type="password"

                )

                submitted = st.form_submit_button(

                    "Sign In"

                )

                if submitted:

                    if self.login(

                        username.strip(),

                        password.strip()

                    ):

                        st.success(

                            "Login successful"

                        )

                        st.rerun()

                    else:

                        st.error(

                            "Invalid username or password"

                        )

            st.markdown(

                """
                <div style="
                    margin-top:25px;
                    text-align:center;
                    color:#94A3B8;
                    font-size:14px;
                ">
                    Powered by IRTTAA NuzhAI
                </div>
                """,

                unsafe_allow_html=True

            )

            st.markdown(

                "</div>",

                unsafe_allow_html=True

            )