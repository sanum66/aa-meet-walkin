import base64

import streamlit as st

from config import (

    SHORT_ORGANIZATION_NAME,

    EVENT_NAME,

    LOGO_PATH

)


# ---------------------------------------------------
# IMAGE TO BASE64
# ---------------------------------------------------

def get_base64_image(image_path):

    try:

        with open(image_path, "rb") as image_file:

            encoded = base64.b64encode(

                image_file.read()

            ).decode()

        return encoded

    except Exception:

        return None


# ---------------------------------------------------
# NAVBAR
# ---------------------------------------------------

def render_navbar(username="Admin"):

    logo_base64 = get_base64_image(

        LOGO_PATH

    )

    logo_html = ""

    if logo_base64:

        logo_html = f"""

        <img

            src="data:image/png;base64,{logo_base64}"

            style="
                width:56px;
                height:56px;
                border-radius:50%;
                object-fit:cover;
                border:
                    2px solid rgba(255,255,255,0.18);
            "

        />

        """

    st.markdown(

        f"""

        <div style="
            background:
                linear-gradient(
                    135deg,
                    #071B4D 0%,
                    #0A2472 100%
                );

            border-radius:24px;

            padding:20px 28px;

            margin-bottom:28px;

            box-shadow:
                0 15px 35px rgba(0,0,0,0.12);
        ">

            <div style="
                display:flex;
                justify-content:space-between;
                align-items:center;
            ">

                <!-- LEFT -->

                <div style="
                    display:flex;
                    align-items:center;
                    gap:18px;
                ">

                    {logo_html}

                    <div>

                        <div style="
                            color:white;
                            font-size:30px;
                            font-weight:800;
                            line-height:1.1;
                        ">
                            {SHORT_ORGANIZATION_NAME}
                        </div>

                        <div style="
                            color:
                                rgba(255,255,255,0.72);

                            font-size:15px;

                            margin-top:5px;
                        ">
                            {EVENT_NAME}
                        </div>

                    </div>

                </div>

                <!-- RIGHT -->

                <div style="
                    display:flex;
                    align-items:center;
                    gap:16px;
                ">

                    <div style="
                        background:
                            rgba(255,255,255,0.10);

                        padding:12px 18px;

                        border-radius:14px;

                        color:white;

                        font-weight:700;

                        font-size:15px;
                    ">
                        👤 {username}
                    </div>

                </div>

            </div>

        </div>

        """,

        unsafe_allow_html=True

    )