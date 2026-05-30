import streamlit as st

from auth import AuthManager
from database import Database

from utils import inject_custom_css

from components.sidebar import render_sidebar
from components.navbar import render_navbar

from pages.dashboard import render_dashboard_page
from pages.registration import render_registration_page
from pages.checkin import render_checkin_page
from pages.analytics import render_analytics_page
from pages.admin import render_admin_panel
from pages.import_data import render_import_page
from pages.export_data import render_export_page


# ---------------------------------------------------
# MAIN APPLICATION
# ---------------------------------------------------

def main():

    # ---------------------------------------------------
    # PAGE CONFIG
    # ---------------------------------------------------

    st.set_page_config(

        page_title="IRTTAA NuzhAI",

        page_icon="🚀",

        layout="wide",

        initial_sidebar_state="expanded"

    )

    # ---------------------------------------------------
    # LOAD THEME
    # ---------------------------------------------------

    inject_custom_css()

    # ---------------------------------------------------
    # DATABASE
    # ---------------------------------------------------

    db = Database()

    auth = AuthManager(db)

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
    # LOGIN PAGE
    # ---------------------------------------------------

    if not st.session_state.authenticated:

        auth.render_login()

        return

    # ---------------------------------------------------
    # SIDEBAR
    # ---------------------------------------------------

    selected_page, logout = render_sidebar()

    if logout:

        auth.logout()

        st.rerun()

    # ---------------------------------------------------
    # NAVBAR
    # ---------------------------------------------------

    render_navbar(

        st.session_state.username

    )

    # ---------------------------------------------------
    # ROUTING
    # ---------------------------------------------------

    if selected_page == "Dashboard":

        render_dashboard_page(db)

    elif selected_page == "Walk-In Registration":

        render_registration_page(db)

    elif selected_page == "Search & Check-In":

        render_checkin_page(db)

    elif selected_page == "Analytics":

        render_analytics_page(db)

    elif selected_page == "Import Data":

        render_import_page(db)

    elif selected_page == "Export Data":

        render_export_page(db)

    elif selected_page == "Admin Tools":

        render_admin_panel(db)


# ---------------------------------------------------
# RUN APPLICATION
# ---------------------------------------------------

if __name__ == "__main__":

    main()