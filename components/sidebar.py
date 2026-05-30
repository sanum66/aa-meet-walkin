import streamlit as st

from streamlit_option_menu import option_menu

from config import (

    SHORT_ORGANIZATION_NAME,

    EVENT_NAME

)


# ---------------------------------------------------
# SIDEBAR
# ---------------------------------------------------

def render_sidebar():

    with st.sidebar:

        st.markdown(

            "<br>",

            unsafe_allow_html=True

        )

        # ---------------------------------------------------
        # BRAND
        # ---------------------------------------------------

        st.markdown(

            f"""

            <div style="
                margin-bottom:32px;
                padding-left:8px;
            ">

                <div style="
                    font-size:30px;
                    font-weight:900;
                    color:white;
                    line-height:1.1;
                ">
                    {SHORT_ORGANIZATION_NAME}
                </div>

                <div style="
                    color:
                        rgba(255,255,255,0.72);

                    font-size:14px;

                    margin-top:8px;

                    line-height:1.6;
                ">
                    {EVENT_NAME}
                </div>

            </div>

            """,

            unsafe_allow_html=True

        )

        # ---------------------------------------------------
        # MENU
        # ---------------------------------------------------

        selected = option_menu(

            menu_title=None,

            options=[

                "Dashboard",

                "Walk-In Registration",

                "Search & Check-In",

                "Analytics",

                "Import Data",

                "Export Data",

                "Admin Tools"

            ],

            icons=[

                "grid-fill",

                "person-plus-fill",

                "qr-code-scan",

                "bar-chart-fill",

                "cloud-upload-fill",

                "cloud-download-fill",

                "gear-fill"

            ],

            default_index=0,

            styles={

                "container": {

                    "padding": "0!important",

                    "background-color":
                    "transparent",

                },

                "icon": {

                    "color": "white",

                    "font-size": "18px",

                },

                "nav-link": {

                    "font-size": "16px",

                    "font-weight": "600",

                    "text-align": "left",

                    "margin": "10px 0",

                    "padding": "14px 18px",

                    "border-radius": "14px",

                    "color": "white",

                    "background-color":
                    "rgba(255,255,255,0.05)",

                    "--hover-color":
                    "rgba(255,255,255,0.12)",

                },

                "nav-link-selected": {

                    "background":
                    "linear-gradient("
                    "135deg,"
                    "#1E5EFF,"
                    "#3B82F6"
                    ")",

                    "font-weight": "700",

                    "box-shadow":
                    "0 10px 28px "
                    "rgba(30,94,255,0.28)",

                },

            }

        )

        st.markdown(

            "<br>",

            unsafe_allow_html=True

        )

        # ---------------------------------------------------
        # FOOTER CARD
        # ---------------------------------------------------

        st.markdown(

            """

            <div style="
                background:
                    rgba(255,255,255,0.06);

                border:
                    1px solid rgba(255,255,255,0.08);

                padding:18px;

                border-radius:18px;

                margin-top:12px;
            ">

                <div style="
                    color:white;

                    font-size:18px;

                    font-weight:800;

                    margin-bottom:6px;
                ">
                    IRTTAA NuzhAI
                </div>

                <div style="
                    color:
                        rgba(255,255,255,0.70);

                    font-size:13px;

                    line-height:1.7;
                ">
                    Smart Alumni Event
                    Management Platform
                </div>

            </div>

            """,

            unsafe_allow_html=True

        )

        st.markdown(

            "<br>",

            unsafe_allow_html=True

        )

        # ---------------------------------------------------
        # LOGOUT
        # ---------------------------------------------------

        logout = st.button(

            "Logout",

            use_container_width=True

        )

        return selected, logout