import os
from datetime import datetime

import streamlit as st

from auth import AuthManager
from database import Database

from pages.analytics import render_analytics_page
from pages.admin import render_admin_panel
from pages.checkin import render_checkin_page
from pages.dashboard import render_dashboard_page
from pages.registration import render_registration_page

from pages.import_data import render_import_page
from pages.export_data import render_export_page

from utils import inject_custom_css


def main():

    st.set_page_config(
        page_title="IRTTAA Walk-In Registration System",
        layout="wide",
        initial_sidebar_state="expanded",
    )

    inject_custom_css()

    # ---------------------------------------------------
    # DATABASE
    # ---------------------------------------------------

    db = Database()

    # ---------------------------------------------------
    # AUTH
    # ---------------------------------------------------

    auth = AuthManager(db)

    # IMPORTANT
    # CREATE DEFAULT ADMIN USER
    auth.ensure_default_user()

    # ---------------------------------------------------
    # SESSION STATE
    # ---------------------------------------------------

    if "authenticated" not in st.session_state:

        st.session_state.authenticated = False

    if "username" not in st.session_state:

        st.session_state.username = None

    if "role" not in st.session_state:

        st.session_state.role = None

    # ---------------------------------------------------
    # SIDEBAR
    # ---------------------------------------------------

    with st.sidebar:

        logo_path = os.path.join(
            "assets",
            "logo.png"
        )

        if os.path.exists(logo_path):

            st.image(
                logo_path,
                width=120
            )

        st.title("IRTTAA Walk-In")

        if st.session_state.authenticated:

            st.markdown(
                f"**Logged in as:** "
                f"{st.session_state.username}"
            )

            st.markdown("---")

            page = st.radio(
                "Navigation",
                [
                    "Dashboard",
                    "Walk-In Registration",
                    "Search & Check-In",
                    "Admin Panel",
                    "Analytics",
                    "Import Data",
                    "Export Data",
                ],
                index=0,
            )

            st.markdown("---")

            if st.button("Logout"):

                auth.logout()

                st.rerun()

        else:

            page = "Login"

            st.markdown(
                "Please sign in to start "
                "managing walk-in registrations."
            )

    # ---------------------------------------------------
    # LOGIN SCREEN
    # ---------------------------------------------------

    if not st.session_state.authenticated:

        auth.render_login()

        return

    # ---------------------------------------------------
    # PAGE NAVIGATION
    # ---------------------------------------------------

    if page == "Dashboard":

        render_dashboard_page(db)

    elif page == "Walk-In Registration":

        render_registration_page(db)

    elif page == "Search & Check-In":

        render_checkin_page(db)

    elif page == "Admin Panel":

        render_admin_panel(db)

    elif page == "Analytics":

        render_analytics_page(db)

    elif page == "Import Data":

        render_import_page(db)

    elif page == "Export Data":

        render_export_page(db)


# ---------------------------------------------------
# RUN APPLICATION
# ---------------------------------------------------

if __name__ == "__main__":

    main()